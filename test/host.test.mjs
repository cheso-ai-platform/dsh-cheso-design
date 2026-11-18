import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apply } from '../lib/index.js';

const cheso = 'https://cheso.example';
const embed = 'https://preview.example';
const project = `${cheso}/agent/project_demo`;
const globalCheso = 'https://cheso.ai';

function startHost({ ask, overlays } = {}) {
  const tools = new Map();
  const routes = new Map();
  const inboxListeners = new Set();
  let executeHook;
  let site = 'configured';
  apply({
    fiber: { entry: { options: { id: 'cheso', name: 'dsh-cheso-design' } } },
    tools: { register: tool => tools.set(tool.name, tool) },
    on(event, hook) {
      if (event === 'tools/execute') executeHook = hook;
      if (event === 'agent/inbox/inserted') {
        inboxListeners.add(hook);
        return () => inboxListeners.delete(hook);
      }
    },
    get(service) {
      if (service === 'profileContext' && overlays) return { overlays };
      if (service === 'userQuestions' && ask) return { ask };
    },
    inject(services, register) {
      if (services.includes('connection')) {
        register({ connection: { fetch: { register: route => routes.set(route.path, route) } } });
      }
    },
  }, {
    site: { get: () => site },
    baseUrl: cheso,
    embedBaseUrl: embed,
    token: 'test-token',
    timeoutSec: 10,
  });
  return {
    siteOptions: () => routes.get('/api/cheso/site-options').fetch(),
    selectSite: value => { site = value; },
    hasTool: name => tools.has(name),
    call: (name, args, exec = {}) => tools.get(name).execute(args, exec),
    output: name => tools.get(name).output,
    executeHook: (exec, next) => executeHook(exec, next),
    notifyInbox: (agent, message) => {
      for (const listener of inboxListeners) listener({ agent, message });
    },
    inboxListenerCount: () => inboxListeners.size,
    questionPreviews: callId => routes.get('/api/cheso/question-previews').fetch(
      new Request(`http://dsh.local/api/cheso/question-previews?${new URLSearchParams({ call_id: callId })}`),
    ),
    preview: params => routes.get('/api/cheso/preview').fetch(
      new Request(`http://dsh.local/api/cheso/preview?${new URLSearchParams(params)}`),
    ),
  };
}

test('startup configuration disables switching only when it owns the Cheso config', async () => {
  const cases = [
    { overlays: undefined, locked: false },
    { overlays: [{ id: 'cheso', disabled: false }, { id: 'another', config: {} }], locked: false },
    { overlays: [{ id: 'cheso', name: 'another-plugin', config: {} }], locked: false },
    { overlays: [{ id: 'cheso', config: { baseUrl: cheso } }], locked: true },
    { overlays: [{ id: 'cheso', name: 'dsh-cheso-design', config: {} }], locked: true },
    { overlays: [{ insert: [{ id: 'group', group: true, config: [{ id: 'cheso' }] }] }], locked: true },
  ];
  for (const { overlays, locked } of cases) {
    const response = await startHost({ overlays }).siteOptions();
    assert.equal(response.status, 200);
    const options = await response.json();
    assert.equal(options.lockedByStartupConfig, locked, JSON.stringify(overlays));
    assert.equal(options.configuredHost, 'cheso.example');
  }
});

function mockCheso(t, responses) {
  return t.mock.method(globalThis, 'fetch', async (url, options) => {
    const key = `${options.method} ${url}`;
    assert.ok(Object.hasOwn(responses, key), `Unexpected Cheso request: ${key}`);
    const fixture = responses[key];
    const response = typeof fixture === 'function' ? await fixture(options) : fixture;
    return response instanceof Response ? response : Response.json({ code: 0, data: response });
  }).mock;
}

test('waiting follows a task handoff on the original site and returns its artifact', async t => {
  const host = startHost();
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/billing/credits`]: { grants: [{ amount_available: 1 }] },
    [`POST ${cheso}/api/v1/plans/create`]: { plan_id: 'plan_first', project_id: 'project_demo' },
    [`GET ${cheso}/api/v1/plans/plan_first/result`]: { status: 'completed', next_plan_id: 'plan_second' },
    [`GET ${cheso}/api/v1/plans/plan_second/result`]: {
      status: 'completed',
      result: { files: [
        { file_id: 'file_deck', name: 'slides.vppt', version: 2 },
        { file_id: 'file_source', name: 'source.pdf', category: 'attachment' },
      ] },
    },
  });

  const created = await host.call('cheso_create', { prompt: 'Make a slide deck' });
  host.selectSite('global');
  const result = await host.call('cheso_wait', { task_id: created.task_id });

  assert.equal(result.task_id, 'plan_second');
  assert.equal(result.status, 'completed');
  assert.equal(result.project_url, project);
  assert.equal(result.embed_base_url, embed);
  assert.deepEqual(result.artifacts, [
    { file_id: 'file_deck', name: 'slides.vppt', format: 'vppt', version: 2, category: 'result' },
  ]);
  assert.deepEqual(requests.calls.map(call => call.arguments[0]), [
    `${cheso}/api/v1/billing/credits`,
    `${cheso}/api/v1/plans/create`,
    `${cheso}/api/v1/plans/plan_first/result`,
    `${cheso}/api/v1/plans/plan_second/result`,
  ]);
});

test('user steering releases a Cheso wait and sends a correction into the original conversation', async t => {
  const host = startHost();
  const polling = Promise.withResolvers();
  let firstPoll = true;
  const submissions = [];
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/billing/credits`]: { grants: [{ amount_available: 1 }] },
    [`POST ${cheso}/api/v1/plans/create`]: ({ body }) => {
      submissions.push(JSON.parse(body));
      return submissions.length === 1 ? { plan_id: 'plan_first', project_id: 'project_demo' }
        : { queued: true, project_id: 'project_demo', session_id: 'session_demo', message: { message_id: 'msg_correction' } };
    },
    [`GET ${cheso}/api/v1/plans/plan_first`]: { project_id: 'project_demo', session_id: 'session_demo' },
    [`GET ${cheso}/api/v1/plans/plan_first/result`]: { status: 'completed', next_plan_id: 'plan_second' },
    [`GET ${cheso}/api/v1/plans/plan_second/result`]: ({ signal }) => {
      if (!firstPoll) return { status: 'in_progress' };
      firstPoll = false;
      polling.resolve(signal);
      return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    },
    [`POST ${cheso}/api/v1/messages/send_now`]: ({ body }) => {
      assert.deepEqual(JSON.parse(body), { message_id: 'msg_correction' });
      return { plan_id: 'plan_corrected', project_id: 'project_demo', plan_status: 'pending' };
    },
    [`GET ${cheso}/api/v1/plans/plan_corrected/result`]: {
      status: 'completed', result: { files: [{ file_id: 'file_poster', name: 'poster.vimg' }] },
    },
  });
  const { task_id } = await host.call('cheso_create', { prompt: '做一张鹈鹕汽车的海报', agent_type: 'image_edit' });
  host.selectSite('global');
  const agent = { inbox: { nextStep: [], nextTurn: [] } };
  const controller = new AbortController();
  const waiting = host.call('cheso_wait', { task_id }, { agent, signal: controller.signal });
  const pollSignal = await polling.promise;

  const userMessage = { id: 'user', source: { kind: 'user' } };
  agent.inbox.nextTurn.push(userMessage);
  host.notifyInbox(agent, userMessage);
  host.notifyInbox({ inbox: { nextStep: [userMessage] } }, userMessage);
  const context = { id: 'context', source: { kind: 'plugin' } };
  agent.inbox.nextStep.push(context);
  host.notifyInbox(agent, context);
  assert.equal(pollSignal.aborted, false);

  agent.inbox.nextStep.push(agent.inbox.nextTurn.pop());
  host.notifyInbox(agent, userMessage);
  const yielded = await waiting;
  assert.equal(pollSignal.aborted, true);
  assert.equal(controller.signal.aborted, false);
  assert.equal(host.inboxListenerCount(), 0);
  assert.equal(yielded.status, 'running');
  assert.equal(yielded.project_url, project);
  assert.match(yielded.message, /处理用户插话/);
  assert.deepEqual(agent.inbox.nextStep, [context, userMessage]);
  assert.equal(requests.calls.filter(call => call.arguments[1].method === 'POST').length, 1);

  const correction = '说错了，是鹈鹕骑车';
  const corrected = await host.call('cheso_create', { prompt: correction, follow_up_task_id: yielded.task_id }, { signal: controller.signal });
  assert.equal(corrected.task_id, 'plan_corrected');
  assert.equal(corrected.status, 'pending');
  assert.equal(corrected.project_url, project);
  assert.deepEqual(submissions[1], {
    prompt: correction, project_id: 'project_demo', session_id: 'session_demo', on_running: 'queue', agent_type: 'image_edit',
  });
  const completed = await host.call('cheso_wait', { task_id: corrected.task_id });
  assert.equal(completed.status, 'completed');
  assert.equal(completed.artifacts[0].file_id, 'file_poster');
  assert.deepEqual(requests.calls.filter(call => call.arguments[1].method === 'POST').map(call => call.arguments[0]), [
    `${cheso}/api/v1/plans/create`,
    `${cheso}/api/v1/plans/create`,
    `${cheso}/api/v1/messages/send_now`,
  ]);
});

test('a follow-up starts directly in the original conversation if Cheso is idle', async t => {
  const host = startHost();
  mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo`]: { project_id: 'project_demo', session_id: 'session_demo' },
    [`POST ${cheso}/api/v1/plans/create`]: ({ body }) => {
      assert.deepEqual(JSON.parse(body), {
        prompt: 'Add a cover', project_id: 'project_demo', session_id: 'session_demo', on_running: 'queue',
      });
      return { plan_id: 'plan_follow_up', plan_status: 'in_progress' };
    },
  });
  const next = await host.call('cheso_create', { prompt: 'Add a cover', follow_up_task_id: 'plan_demo' });
  assert.equal(next.task_id, 'plan_follow_up');
  assert.equal(next.status, 'in_progress');
  assert.equal(next.project_url, project);
});

test('a follow-up remains queued when its Cheso authorization denies immediate sending', async t => {
  const host = startHost();
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo`]: { project_id: 'project_demo', session_id: 'session_demo' },
    [`POST ${cheso}/api/v1/plans/create`]: { queued: true, message: { message_id: 'msg_follow_up' } },
    [`POST ${cheso}/api/v1/messages/send_now`]: Response.json({ code: 2410 }, { status: 403 }),
  });
  const result = await host.call('cheso_create', { prompt: 'Add a cover', follow_up_task_id: 'plan_demo' });
  assert.equal(result.status, 'queued');
  assert.equal(result.task_id, undefined);
  assert.equal(result.project_url, project);
  assert.match(result.message, /当前 Cheso 授权未开放立即发送/);
  assert.equal(requests.calls.length, 3);
});

test('stopping follows a task handoff on the original site and confirms the remote result', async t => {
  const host = startHost();
  let stopped = false;
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/billing/credits`]: { grants: [{ amount_available: 1 }] },
    [`POST ${cheso}/api/v1/plans/create`]: { plan_id: 'plan_first', project_id: 'project_demo' },
    [`GET ${cheso}/api/v1/plans/plan_first/result`]: { status: 'completed', next_plan_id: 'plan_current' },
    [`GET ${cheso}/api/v1/plans/plan_current/result`]: () => ({ status: stopped ? 'terminated' : 'interact' }),
    [`POST ${cheso}/api/v1/plans/plan_current/terminate`]: () => {
      stopped = true;
      return Response.json({ code: 0 });
    },
  });
  const { task_id } = await host.call('cheso_create', { prompt: 'Make a slide deck' });
  host.selectSite('global');
  const args = { task_id };
  assert.deepEqual(await host.call('cheso_stop', args), { task_id: 'plan_current', status: 'terminated' });
  assert.deepEqual(await host.call('cheso_stop', args), { task_id: 'plan_current', status: 'terminated' });
  assert.equal(requests.calls.filter(call => call.arguments[0].endsWith('/terminate')).length, 1);
});

test('stopping a follow-up during handoff uses the running task in the same chain', async t => {
  const host = startHost();
  let stopped = false;
  mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_running`]: { project_id: 'project_demo', session_id: 'session_demo' },
    [`POST ${cheso}/api/v1/plans/create`]: { queued: true, message: { message_id: 'msg_follow_up' } },
    [`POST ${cheso}/api/v1/messages/send_now`]: { plan_id: 'plan_pending', plan_status: 'pending' },
    [`GET ${cheso}/api/v1/plans/plan_pending/result`]: () => ({ status: stopped ? 'terminated' : 'pending' }),
    [`POST ${cheso}/api/v1/plans/plan_running/terminate`]: () => {
      stopped = true;
      return Response.json({ code: 0 });
    },
  });
  const { task_id } = await host.call('cheso_create', { prompt: 'Add a cover', follow_up_task_id: 'plan_running' });
  assert.equal(task_id, 'plan_pending');
  assert.deepEqual(await host.call('cheso_stop', { task_id }), { task_id, status: 'terminated' });
});

test('stopping reports completion when the task finishes before Cheso can stop it', async t => {
  const host = startHost();
  let completed = false;
  mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: () => ({ status: completed ? 'completed' : 'in_progress' }),
    [`POST ${cheso}/api/v1/plans/plan_demo/terminate`]: () => {
      completed = true;
      return Response.json({ code: 1101 }, { status: 409 });
    },
  });
  const args = { task_id: 'plan_demo' };
  const result = await host.call('cheso_stop', args);
  assert.deepEqual(result, { task_id: 'plan_demo', status: 'completed' });
  assert.match(host.output('cheso_stop').render(args, result)[0].text, /任务已完成/);
});

test('steering while a question is open closes the local question without submitting an answer', async t => {
  const shown = Promise.withResolvers();
  const host = startHost({
    ask({ signal }) {
      shown.resolve(signal);
      return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    },
  });
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: {
      status: 'interact', interaction: { tool_call_id: 'question_first', questions: [{ question: 'Style?' }] },
    },
    [`GET ${cheso}/api/v1/plans/plan_demo`]: { project_id: 'project_demo' },
  });
  const agent = { inbox: { nextStep: [] } };
  const waiting = host.call('cheso_wait', { task_id: 'plan_demo' }, { agent, signal: new AbortController().signal });
  const questionSignal = await shown.promise;
  const userMessage = { id: 'user', source: { kind: 'user' } };
  agent.inbox.nextStep.push(userMessage);
  host.notifyInbox(agent, userMessage);
  const yielded = await waiting;
  assert.equal(questionSignal.aborted, true);
  assert.equal(yielded.status, 'running');
  assert.equal(yielded.project_url, project);
  assert.equal(requests.calls.some(call => call.arguments[1].method === 'POST'), false);
});

test('Cheso waits for native user answers and skips, then resumes the same task', async t => {
  const asks = Array.from({ length: 2 }, () => ({
    shown: Promise.withResolvers(),
    answer: Promise.withResolvers(),
  }));
  let askIndex = 0;
  const host = startHost({
    ask(request) {
      const ask = asks[askIndex++];
      ask.shown.resolve(request);
      return ask.answer.promise;
    },
  });
  const agent = {};
  const { signal } = new AbortController();
  const callId = 'call_wait';
  const resultPath = `GET ${cheso}/api/v1/plans/plan_second/result`;
  const replyUrl = `${cheso}/api/v1/plans/plan_second/interact`;
  const html = '<h1 style="color:navy">Natural style</h1>';
  const firstQuestions = [
    { question: 'Style?', header: 'Design', multi_select: true, options: [
      { label: 'Natural', description: 'Light colors', html_preview: html },
    ] },
    { question: 'Use the 11-page outline?' },
    { question: 'Any notes?' },
  ];
  const confirmation = { question: 'Generate the revised 6-page outline?', options: [{ label: 'Confirm' }] };
  let next = { status: 'interact', interaction: { tool_call_id: 'question_first', questions: firstQuestions } };
  const submissions = [];
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/billing/credits`]: { grants: [{ amount_available: 1 }] },
    [`POST ${cheso}/api/v1/plans/create`]: { plan_id: 'plan_first', project_id: 'project_demo' },
    [`GET ${cheso}/api/v1/plans/plan_first/result`]: { status: 'completed', next_plan_id: 'plan_second' },
    [resultPath]: () => next,
    [`POST ${replyUrl}`]: ({ body }) => {
      submissions.push(JSON.parse(body));
      next = submissions.length === 1
        ? { status: 'interact', interaction: { tool_call_id: 'question_second', questions: [confirmation] } }
        : { status: 'completed', result: { files: [{ file_id: 'file_deck', name: 'slides.vppt' }] } };
      return {};
    },
  });
  const created = await host.call('cheso_create', { prompt: 'Make a slide deck' });
  const result = host.call('cheso_wait', { task_id: created.task_id }, { agent, signal, callId });
  const first = await asks[0].shown.promise;
  assert.equal(first.agent, agent);
  assert.equal(first.signal.aborted, false);
  assert.deepEqual(first.questions, [
    { id: '1', question: 'Style?', header: 'Design', multiSelect: true, options: [{ label: 'Natural', description: 'Light colors' }] },
    { id: '2', question: 'Use the 11-page outline?', multiSelect: false },
    { id: '3', question: 'Any notes?', multiSelect: false },
  ]);
  assert.deepEqual(await (await host.questionPreviews(callId)).json(), { previews: [{ label: 'Natural', html }], receipts: [] });
  assert.equal(host.hasTool('cheso_reply'), false);
  assert.equal(requests.calls.filter(call => call.arguments[0] === replyUrl).length, 0);
  host.selectSite('global');

  asks[0].answer.resolve({ answers: [
    { id: '1', selected: ['Natural'], custom: 'with watercolor' },
    { id: '2', selected: [], custom: '6 pages is enough' },
    { id: '3', selected: [] },
  ] });
  const second = await asks[1].shown.promise;
  assert.deepEqual(second.questions, [{ ...confirmation, id: '1', multiSelect: false }]);
  const firstReceipt = { answers: [
    { label: 'Design', values: ['Natural', 'with watercolor'] },
    { label: 'Use the 11-page outline?', values: ['6 pages is enough'] },
    { label: 'Any notes?', values: [] },
  ] };
  assert.deepEqual(await (await host.questionPreviews(callId)).json(), { previews: [], receipts: [firstReceipt] });
  assert.deepEqual(submissions, [{
    args: {
      tool_call_id: 'question_first',
      answers: { 'Style?': 'Natural,with watercolor', 'Use the 11-page outline?': '6 pages is enough' },
    },
    skip: false,
  }]);

  asks[1].answer.resolve({ answers: [{ id: '1', selected: [] }] });
  const completed = await result;
  assert.deepEqual(await (await host.questionPreviews(callId)).json(), { previews: null, receipts: [] });
  assert.deepEqual(submissions[1], { args: { tool_call_id: 'question_second' }, skip: true });
  assert.equal(completed.task_id, 'plan_second');
  assert.equal(completed.status, 'completed');
  assert.equal(completed.artifacts[0].name, 'slides.vppt');
  const output = host.output('cheso_wait');
  assert.deepEqual(output.presentationMeta({}, completed), {
    cheso_question_receipts: [firstReceipt, { answers: [{ label: confirmation.question, values: [] }] }],
  });
  assert.equal(output.render({}, completed)[0].text.includes('6 pages is enough'), false);
});

test('Cheso auto-skip closes the open question and resumes without submitting a skip', async t => {
  const host = startHost({
    ask({ signal }) {
      current = { status: 'in_progress' };
      return new Promise((_, reject) => signal.addEventListener('abort', () => {
        questionClosed = true;
        reject(signal.reason);
      }, { once: true }));
    },
  });
  let questionClosed = false;
  let current = {
    status: 'interact',
    interaction: { tool_call_id: 'question_first', timeout: 300, questions: [{ question: 'Style?' }] },
  };
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: () => {
      const snapshot = current;
      if (snapshot.status === 'in_progress') {
        current = { status: 'completed', result: { files: [{ file_id: 'file_deck', name: 'slides.vppt' }] } };
      }
      return snapshot;
    },
    [`GET ${cheso}/api/v1/plans/plan_demo`]: { project_id: 'project_demo' },
  });

  const result = await host.call('cheso_wait', { task_id: 'plan_demo' }, { agent: {} });
  assert.equal(result.status, 'completed');
  assert.equal(questionClosed, true);
  assert.equal(requests.calls.some(call => call.arguments[1].method === 'POST'), false);
});

test('stopping the wait keeps answers that Cheso already accepted', async t => {
  const cancel = new AbortController();
  const host = startHost({
    ask: async () => ({ answers: [{ id: '1', selected: [], custom: '8 pages' }] }),
  });
  const args = { task_id: 'plan_demo' };
  const exec = { name: 'cheso_wait', agent: {}, signal: cancel.signal };
  let submitted = false;
  mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: () => {
      if (submitted) {
        cancel.abort();
        return { status: 'in_progress' };
      }
      return { status: 'interact', interaction: { tool_call_id: 'question_first', questions: [{ question: 'Page count?' }] } };
    },
    [`GET ${cheso}/api/v1/plans/plan_demo`]: { project_id: 'project_demo' },
    [`POST ${cheso}/api/v1/plans/plan_demo/interact`]: () => {
      submitted = true;
      return {};
    },
  });

  const aborted = { isError: true, content: [{ type: 'text', text: 'Error: tool call aborted' }] };
  const outcome = await host.executeHook(exec, async () => {
    await assert.rejects(host.call('cheso_wait', args, exec), { name: 'AbortError' });
    return aborted;
  });
  assert.deepEqual(outcome, {
    ...aborted,
    meta: { cheso_question_receipts: [{ answers: [{ label: 'Page count?', values: ['8 pages'] }] }] },
  });
});

test('an answer sent just as a Cheso question expires resumes polling', async t => {
  let asks = 0;
  const host = startHost({
    async ask() {
      asks += 1;
      return { answers: [{ id: '1', selected: [], custom: 'Natural' }] };
    },
  });
  let current = {
    status: 'interact',
    interaction: { tool_call_id: 'question_first', timeout: 300, questions: [{ question: 'Style?' }] },
  };
  mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: () => current,
    [`GET ${cheso}/api/v1/plans/plan_demo`]: { project_id: 'project_demo' },
    [`POST ${cheso}/api/v1/plans/plan_demo/interact`]: () => {
      current = { status: 'completed', result: { files: [{ file_id: 'file_deck', name: 'slides.vppt' }] } };
      return Response.json({ code: 1101 }, { status: 409 });
    },
  });

  const result = await host.call('cheso_wait', { task_id: 'plan_demo' }, { agent: {} });
  assert.equal(result.status, 'completed');
  assert.equal(asks, 1);
  assert.equal(host.output('cheso_wait').presentationMeta({}, result), null);
});

test('a stale answer is never sent after Cheso has moved on', async t => {
  const host = startHost({
    async ask({ questions }) {
      assert.equal(questions[0].question, 'Use this outline?');
      current = { status: 'completed', result: { files: [{ file_id: 'file_deck', name: 'slides.vppt' }] } };
      return { answers: [{ id: '1', selected: ['Yes'] }] };
    },
  });
  let current = {
    status: 'interact',
    interaction: { tool_call_id: 'question_old', questions: [{ question: 'Use this outline?', options: [{ label: 'Yes' }] }] },
  };
  mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: () => current,
    [`GET ${cheso}/api/v1/plans/plan_demo`]: { project_id: 'project_demo' },
  });

  const result = await host.call('cheso_wait', { task_id: 'plan_demo' }, { agent: {} });
  assert.equal(result.status, 'completed');
});

test('an unavailable user question card leaves Cheso paused', async t => {
  const host = startHost({ ask: async () => { throw new Error('No connected client'); } });
  mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: {
      status: 'interact',
      interaction: { tool_call_id: 'question_first', questions: [{ question: 'Style?', options: [{ label: 'Natural' }] }] },
    },
    [`GET ${cheso}/api/v1/plans/plan_demo`]: { project_id: 'project_demo' },
  });
  const result = await host.call('cheso_wait', { task_id: 'plan_demo' }, { agent: {} });
  assert.equal(result.status, 'interact');
  assert.equal(result.project_url, project);
  assert.match(result.message, /Style\?（Natural）/);
});

test('cancelling the wait does not become a skip', async t => {
  const controller = new AbortController();
  const host = startHost({
    async ask() {
      controller.abort();
      return { answers: [{ id: '1', selected: [] }] };
    },
  });
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: {
      status: 'interact',
      interaction: { tool_call_id: 'question_first', questions: [{ question: 'Style?' }] },
    },
    [`GET ${cheso}/api/v1/plans/plan_demo`]: { project_id: 'project_demo' },
  });

  await assert.rejects(
    host.call('cheso_wait', { task_id: 'plan_demo' }, { agent: {}, signal: controller.signal }),
    { name: 'AbortError' },
  );
  assert.equal(requests.calls.some(call => call.arguments[1].method === 'POST'), false);
});

test('preview uses the project site and requests the version from the card', async t => {
  const host = startHost();
  const contentUrl = 'https://download.example/deck.vppt';
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/files/file_deck?version=2`]: { download_url: contentUrl, version: 2 },
  });

  host.selectSite('global');
  const response = await host.preview({
    project_url: project,
    embed_base_url: globalCheso,
    file_id: 'file_deck',
    version: '2',
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const data = await response.json();
  assert.equal(data.content_url, contentUrl);
  assert.equal(data.version, 2);
  assert.equal(data.embed_url, `${embed}/embed/preview`);
  assert.equal(requests.callCount(), 1);
  assert.equal(requests.calls[0].arguments[1].headers['x-cheso-token'], 'test-token');
});

test('preview rejects an unconfigured site before making a Cheso request', async t => {
  const host = startHost();
  const requests = mockCheso(t, {});

  const response = await host.preview({
    project_url: 'https://unconfigured.example/agent/project_demo',
    embed_base_url: embed,
    file_id: 'file_deck',
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'unknown_cheso_site' });
  assert.equal(requests.callCount(), 0);
});
