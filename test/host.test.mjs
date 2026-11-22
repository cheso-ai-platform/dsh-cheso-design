import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, realpath, rename, rm, symlink, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { apply } from '../lib/index.js';

const cheso = 'https://cheso.example';
const embed = 'https://preview.example';
const project = `${cheso}/agent/project_demo`;
const projectFilesUrl = `${cheso}/api/v1/project/files/tree?project_id=project_demo`;
const globalCheso = 'https://cheso.ai';

function startHost({ ask, overlays, credentials, attachmentStore, approveUpload, workdir, webUrl, token = 'test-token' } = {}) {
  const tools = new Map();
  const routes = new Map();
  const inboxListeners = new Set();
  let executeHook;
  let webRequestHook;
  const webServer = webUrl && { getOrigin: () => new URL(webUrl).origin, register() {} };
  let site = 'configured';
  apply({
    credentials,
    workingDirectory: { ensure: async () => workdir },
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
      if (service === 'webServer') return webServer;
      if (service === 'webApp' && webUrl) return { getAdvertisedUrl: () => webUrl };
      if (service === 'profileContext' && overlays) return { overlays };
      if (service === 'userQuestions' && ask) return { ask };
      if (service === 'attachments') return attachmentStore;
      if (service === 'approval' && approveUpload) return { request: approveUpload };
    },
    inject(services, register) {
      if (services.includes('webServer') && webServer) {
        register({ webServer, effect: setup => setup(), on: (event, hook) => {
          assert.equal(event, 'webserver/request');
          webRequestHook = hook;
        } });
      }
      if (services.includes('connection')) {
        register({ connection: { fetch: { register: route => routes.set(route.path, route) } } });
      }
    },
  }, {
    site: { get: () => site },
    baseUrl: cheso,
    embedBaseUrl: embed,
    token,
    timeoutSec: 10,
  });
  return {
    siteOptions: () => routes.get('/api/cheso/site-options').fetch(),
    selectSite: value => { site = value; },
    hasTool: name => tools.has(name),
    call: (name, args, exec = {}) => {
      exec.name ??= name;
      exec.signal ??= new AbortController().signal;
      return tools.get(name).execute(args, exec);
    },
    output: name => tools.get(name).output,
    executeHook: (exec, next) => executeHook(exec, next),
    notifyInbox: (agent, message) => {
      for (const listener of inboxListeners) listener({ agent, message });
    },
    inboxListenerCount: () => inboxListeners.size,
    questionPreviews: callId => routes.get('/api/cheso/question-previews').fetch(
      new Request(`http://dsh.local/api/cheso/question-previews?${new URLSearchParams({ call_id: callId })}`),
    ),
    loginStatus: (siteUrl, action = 'check') => routes.get('/api/cheso/login').fetch(new Request('http://dsh.local/api/cheso/login', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, site: siteUrl }),
    })),
    async dispatchWebRequest(request) {
      let result;
      await webRequestHook(request, { writeHead(status, headers) {
        result = new Response(null, { status, headers });
        return { end() {} };
      } }, async () => { result = new Response('forbidden', { status: 403 }); });
      return result;
    },
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

test('local files require a DSH approval that names the destination and resolved path', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'cheso-approval-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = join(directory, 'draft.txt');
  await writeFile(file, 'draft');
  let asked = false;
  const host = startHost({
    workdir: directory,
    approveUpload: async request => {
      asked = true;
      assert.equal(request.toolName, 'cheso_create');
      assert.ok(request.reason.includes(cheso));
      assert.ok(request.reason.includes(await realpath(file)));
      return 'rejected';
    },
  });
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/billing/credits`]: { grants: [{ amount_available: 1 }] },
  });
  const agent = { session: { deriveMessages: () => [] } };
  await assert.rejects(host.call('cheso_create', { prompt: 'Read this', files: ['draft.txt'] }, { agent }), /上传未获授权/);
  assert.equal(asked, true);
  assert.equal(requests.calls.length, 1);
});

test('a user attachment uploads the verified host copy with the original filename', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'cheso-attachment-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = join(directory, 'stored-object');
  const contents = 'reference material';
  await writeFile(file, contents);
  const attachmentId = 'sha256:' + createHash('sha256').update(contents).digest('hex');
  const agent = { session: { deriveMessages: () => [{
    role: 'user', source: { kind: 'user' },
    content: [{ type: 'file', attachment: { attachmentId, name: 'reference.txt', bytes: Buffer.byteLength(contents) } }],
  }] } };
  const host = startHost({ attachmentStore: {
    fileHostPath: ref => {
      assert.equal(ref.attachmentId, attachmentId);
      return file;
    },
  } });
  mockCheso(t, {
    [`GET ${cheso}/api/v1/billing/credits`]: { grants: [{ amount_available: 1 }] },
    [`POST ${cheso}/api/v1/files/presign`]: async ({ body }) => {
      assert.equal(JSON.parse(body).name, 'reference.txt');
      // Once authorized and prepared, the uploaded bytes come from the private snapshot.
      await writeFile(file, 'later modification');
      return { file_id: 'file_reference', version: 1, upload_url: `${cheso}/storage` };
    },
    [`PUT ${cheso}/storage`]: async ({ body }) => {
      assert.equal(await body.text(), contents);
      return new Response(null, { status: 204 });
    },
    [`POST ${cheso}/api/v1/files/confirm`]: {},
    [`POST ${cheso}/api/v1/plans/create`]: ({ body }) => {
      assert.deepEqual(JSON.parse(body).contexts, [{ file_id: 'file_reference', category: 'attachment' }]);
      return { plan_id: 'plan_demo' };
    },
  });
  assert.equal((await host.call('cheso_create', { prompt: 'Use the reference', files: ['reference.txt'] }, { agent })).task_id, 'plan_demo');
});

test('invalid batch members and path replacement abort before any attachment is uploaded', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'cheso-preflight-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const first = join(directory, 'first.txt');
  const second = join(directory, 'second.txt');
  await writeFile(first, 'first');
  await writeFile(second, 'second');
  const agent = { session: { deriveMessages: () => [] } };
  const host = startHost({
    workdir: directory,
    approveUpload: async () => {
      await rm(second);
      await symlink(first, second);
      return 'allowed-once';
    },
  });
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/billing/credits`]: { grants: [{ amount_available: 1 }] },
  });
  const args = { prompt: 'Use the references', project_id: 'project_demo' };
  await assert.rejects(host.call('cheso_create', { ...args, files: ['first.txt', 'missing.txt'] }, { agent }), /missing.txt/);
  await assert.rejects(host.call('cheso_create', { ...args, files: ['first.txt', 'second.txt'] }, { agent }), /second.txt/);
  assert.equal(requests.calls.length, 2);
});

test('approval rejects a replaced or edited local file before making an upload request', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'cheso-identity-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const selected = join(directory, 'reference.txt');
  const replacement = join(directory, 'replacement.txt');
  const timestamp = new Date('2000-01-01T00:00:00Z');
  await writeFile(replacement, 'changed');
  await utimes(replacement, timestamp, timestamp);
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/billing/credits`]: { grants: [{ amount_available: 1 }] },
  });
  const agent = { session: { deriveMessages: () => [] } };
  const mutations = [
    () => rename(replacement, selected),
    async () => {
      await writeFile(selected, 'changed');
      await utimes(selected, timestamp, timestamp);
    },
  ];
  for (const mutate of mutations) {
    await writeFile(selected, 'initial');
    await utimes(selected, timestamp, timestamp);
    const host = startHost({
      workdir: directory,
      approveUpload: async () => {
        await mutate();
        return 'allowed-once';
      },
    });
    await assert.rejects(
      host.call('cheso_create', { prompt: 'Read the reference', files: ['reference.txt'] }, { agent }),
      /等待审批期间已变化/,
    );
  }
  assert.equal(requests.calls.length, mutations.length);
});

test('an approved local file uploads when it has not changed', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'cheso-approved-file-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, 'reference.txt'), 'approved contents');
  const host = startHost({ workdir: directory, approveUpload: async () => 'allowed-once' });
  const agent = { session: { deriveMessages: () => [] } };
  mockCheso(t, {
    [`GET ${cheso}/api/v1/billing/credits`]: { grants: [{ amount_available: 1 }] },
    [`POST ${cheso}/api/v1/files/presign`]: { file_id: 'file_reference', version: 1, upload_url: `${cheso}/storage` },
    [`PUT ${cheso}/storage`]: async ({ body }) => {
      assert.equal(await body.text(), 'approved contents');
      return new Response(null, { status: 204 });
    },
    [`POST ${cheso}/api/v1/files/confirm`]: {},
    [`POST ${cheso}/api/v1/plans/create`]: { plan_id: 'plan_demo' },
  });
  const result = await host.call('cheso_create', { prompt: 'Use the reference', files: ['reference.txt'] }, { agent });
  assert.equal(result.task_id, 'plan_demo');
});

test('task routing recovers the original site from a saved tool result after restart', async t => {
  const original = startHost();
  mockCheso(t, {
    [`GET ${cheso}/api/v1/billing/credits`]: { grants: [{ amount_available: 1 }] },
    [`POST ${cheso}/api/v1/plans/create`]: { plan_id: 'plan_original', project_id: 'project_demo' },
    [`GET ${cheso}/api/v1/plans/plan_original/result`]: { status: 'completed', result: { files: [{ file_id: 'file_demo' }] } },
    [`GET ${cheso}/api/v1/plans/plan_original`]: { project_id: 'project_demo', session_id: 'session_demo' },
  });
  const args = { prompt: 'Make a deck' };
  const created = await original.call('cheso_create', args);
  await original.call('cheso_wait', { task_id: created.task_id });
  const content = original.output('cheso_create').render(args, created);
  const agent = { session: { deriveMessages: () => [
    { role: 'assistant', content: [{ type: 'tool-call', name: 'cheso_create', id: 'call_original' }] },
    { role: 'tool', source: { kind: 'tool', callId: 'call_original' }, content },
  ] } };
  const restarted = startHost();
  original.selectSite('global');
  restarted.selectSite('global');
  await assert.rejects(original.call('cheso_create', {
    prompt: 'Add a cover', follow_up_task_id: 'plan_original', task_site: globalCheso,
  }), /站点与原任务不一致/);
  for (const [host, exec] of [[original, {}], [restarted, { agent }]]) {
    const result = await host.call('cheso_create', { prompt: 'Add a cover', follow_up_task_id: 'plan_original' }, exec);
    assert.equal(result.base_url, cheso);
    assert.equal(result.project_url, project);
  }
});

test('task routing isolates the same ID across sites and uses the matching conversation history', async t => {
  const credentials = { readRecord: async () => ({
    kind: 'grant', payload: { authorization: { accessToken: 'global-fixture', expiresAt: Date.now() + 3600_000 } },
  }) };
  const host = startHost({ credentials });
  const taskId = 'plan_shared';
  const responses = {};
  for (const [site, label] of [[cheso, 'alpha'], [globalCheso, 'beta']]) {
    responses[`GET ${site}/api/v1/billing/credits`] = { grants: [{ amount_available: 1 }] };
    responses[`POST ${site}/api/v1/plans/create`] = { plan_id: taskId, project_id: `project_${label}` };
    responses[`GET ${site}/api/v1/plans/${taskId}/result`] = {
      status: 'completed', result: { files: [{ file_id: 'file_demo', name: `${label}.txt` }] },
    };
  }
  responses[`GET ${globalCheso}/api/v1/plans/${taskId}`] = { project_id: 'project_beta' };
  mockCheso(t, responses);
  const args = { prompt: 'Make a deck' };
  const alpha = await host.call('cheso_create', args);
  host.selectSite('global');
  const beta = await host.call('cheso_create', args);
  const history = (payload, callId) => [
    { role: 'assistant', content: [{ type: 'tool-call', name: 'cheso_create', id: callId }] },
    { role: 'tool', source: { kind: 'tool', callId }, content: host.output('cheso_create').render(args, payload) },
  ];
  const alphaHistory = history({ ...alpha, base_url: undefined }, 'call_alpha');
  const betaHistory = history({ ...beta, project_id: undefined, project_url: undefined }, 'call_beta');
  const alphaAgent = { session: { deriveMessages: () => [...alphaHistory] } };
  const bothAgent = { session: { deriveMessages: () => [...alphaHistory, ...betaHistory] } };
  const original = await host.call('cheso_wait', { task_id: taskId }, { agent: alphaAgent });
  assert.equal(original.base_url, cheso);
  assert.equal(original.artifacts[0].name, 'alpha.txt');
  await assert.rejects(host.call('cheso_wait', { task_id: taskId }), /多个 Cheso 站点/);

  const restarted = startHost({ credentials });
  await assert.rejects(restarted.call('cheso_wait', { task_id: taskId }, { agent: bothAgent }), /多个 Cheso 站点/);
  for (const instance of [host, restarted]) {
    for (const [site, label] of [[cheso, 'alpha'], [globalCheso, 'beta']]) {
      const result = await instance.call('cheso_wait', { task_id: taskId, task_site: site }, { agent: bothAgent });
      assert.equal(result.base_url, site);
      assert.equal(result.project_id, `project_${label}`);
      assert.equal(result.artifacts[0].name, `${label}.txt`);
    }
  }
});

test('text-only tasks do not include old project artifacts with an empty or omitted file list', async t => {
  const host = startHost();
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_empty/result`]: { status: 'completed', result: { text: 'Ready', files: [] } },
    [`GET ${cheso}/api/v1/plans/plan_legacy/result`]: { status: 'completed', result: { text: 'Ready' } },
    [`GET ${cheso}/api/v1/plans/plan_empty`]: { project_id: 'project_demo' },
    [`GET ${cheso}/api/v1/plans/plan_legacy`]: { project_id: 'project_demo' },
    [`GET ${projectFilesUrl}`]: { tree: [{
      type: 'file', name: 'previous.vppt', file_id: 'file_previous', file: { category: 'result' },
    }] },
  });
  for (const taskId of ['plan_empty', 'plan_legacy']) {
    const result = await host.call('cheso_wait', { task_id: taskId });
    assert.equal(result.status, 'completed');
    assert.equal(result.answer, 'Ready');
    assert.equal(result.project_url, project);
    assert.deepEqual(result.artifacts, []);
  }
  assert.ok(requests.calls.every(call => call.arguments[0] !== projectFilesUrl));
  const listing = await host.call('cheso_project_files', { project: 'project_demo', show_card: true });
  assert.deepEqual(listing.artifacts.map(file => file.file_id), ['file_previous']);
});

test('the task stays completed when project metadata is unavailable', async t => {
  const host = startHost();
  mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: { status: 'completed', result: { text: 'Ready' } },
    [`GET ${cheso}/api/v1/plans/plan_demo`]: Response.json({}, { status: 503 }),
  });
  const result = await host.call('cheso_wait', { task_id: 'plan_demo' });
  assert.equal(result.status, 'completed');
  assert.equal(result.answer, 'Ready');
  assert.deepEqual(result.artifacts, []);
});

test('reading an HTTP 200 response body can time out and be retried by the poller', async t => {
  const host = startHost();
  let polls = 0;
  mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: () => ++polls === 1
      ? new Response(new ReadableStream({ start: controller => controller.error(new DOMException('Timeout', 'TimeoutError')) }))
      : { status: 'completed', result: { files: [{ file_id: 'file_demo' }] } },
    [`GET ${cheso}/api/v1/plans/plan_demo`]: { project_id: 'project_demo' },
  });
  assert.equal((await host.call('cheso_wait', { task_id: 'plan_demo' })).status, 'completed');
  assert.equal(polls, 2);
});

test('duplicate question text sends the user to Cheso without asking or submitting ambiguous answers', async t => {
  const host = startHost({ ask: async () => assert.fail('duplicate questions must not open a native card') });
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: { status: 'interact', interaction: {
      tool_call_id: 'question_demo',
      questions: [{ header: 'Cover', question: 'Choose a color' }, { header: 'End', question: 'Choose a color' }],
    } },
    [`GET ${cheso}/api/v1/plans/plan_demo`]: { project_id: 'project_demo' },
  });
  const result = await host.call('cheso_wait', { task_id: 'plan_demo' }, { agent: { inbox: { nextStep: [] } } });
  assert.equal(result.status, 'interact');
  assert.match(result.message, /请打开 Cheso 项目/);
  assert.ok(requests.calls.every(call => call.arguments[1].method === 'GET'));
});

test('login status uses the configured token and checks expired OAuth grants', async t => {
  const fixed = startHost();
  let record = { kind: 'grant', payload: { authorization: {
    accessToken: 'expired-test-token', refreshToken: 'expired-refresh', expiresAt: Date.now() - 60_000,
    clientId: 'client_demo', tokenEndpoint: `${cheso}/oauth/token`,
  } } };
  const oauth = startHost({ token: '', credentials: {
    readRecord: async () => record,
    modifyRecord: async (_, mutate) => (record = await mutate(record) ?? record),
  } });
  mockCheso(t, {
    [`GET ${cheso}/api/v1/whoami`]: options => {
      assert.equal(options.headers['x-cheso-token'], 'test-token');
      return { user: { username: 'fixture' } };
    },
    [`POST ${cheso}/oauth/token`]: Response.json({ error: 'invalid_grant' }, { status: 400 }),
  });
  assert.equal((await (await fixed.loginStatus()).json()).status, 'signed_in');
  assert.equal((await (await oauth.loginStatus()).json()).status, 'login_required');
});

test('the advertised OAuth callback handles a cross-site navigation before DSH route admission', async t => {
  let record;
  const webUrl = 'http://127.0.0.1:3080';
  const host = startHost({ webUrl, token: '', credentials: {
    readRecord: async () => record,
    modifyRecord: async (_, mutate) => (record = await mutate(record) ?? record),
  } });
  const requests = mockCheso(t, {
    [`GET ${cheso}/.well-known/oauth-authorization-server`]: Response.json({
      issuer: cheso, registration_endpoint: `${cheso}/oauth/register`,
      authorization_endpoint: `${cheso}/oauth/authorize`, token_endpoint: `${cheso}/oauth/token`,
    }),
    [`POST ${cheso}/oauth/register`]: Response.json({ client_id: 'client_demo' }),
    [`POST ${cheso}/oauth/token`]: ({ body }) => {
      assert.equal(body.get('code'), 'test-code');
      assert.equal(body.get('redirect_uri'), redirect.href);
      assert.equal(createHash('sha256').update(body.get('code_verifier')).digest('base64url'), authorization.searchParams.get('code_challenge'));
      return Response.json({ access_token: 'test-access', expires_in: 3600 });
    },
  });
  const login = await host.call('cheso_login', {});
  const authorization = new URL(login.verification_uri);
  const redirect = new URL(authorization.searchParams.get('redirect_uri'));
  assert.equal(redirect.href, `${webUrl}/cheso/oauth/callback`);
  const query = new URLSearchParams({ code: 'test-code', iss: cheso, state: authorization.searchParams.get('state') });
  const request = {
    method: 'GET', url: `${redirect.pathname}?${query}`,
    headers: { host: redirect.host, 'sec-fetch-site': 'cross-site' },
  };

  assert.equal((await host.dispatchWebRequest({ ...request, url: `/other${redirect.pathname}?${query}` })).status, 403);
  assert.equal((await host.dispatchWebRequest({ ...request, headers: { ...request.headers, host: 'other.example' } })).status, 403);
  assert.equal((await host.dispatchWebRequest({ ...request, method: 'POST' })).status, 405);
  const invalidQuery = new URLSearchParams(query);
  invalidQuery.set('state', 'wrong-state');
  const invalid = await host.dispatchWebRequest({ ...request, url: `${redirect.pathname}?${invalidQuery}` });
  assert.equal(new URL(invalid.headers.get('location')).searchParams.get('reason'), 'state_mismatch');
  assert.equal(requests.calls.length, 2);

  const response = await host.dispatchWebRequest(request);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('location'), `${cheso}/oauth/callback-result?status=success&client=dsh_cheso`);
  assert.equal(record.payload.authorization.accessToken, 'test-access');
  const replay = await host.dispatchWebRequest(request);
  assert.equal(new URL(replay.headers.get('location')).searchParams.get('reason'), 'state_mismatch');
  assert.equal(requests.calls.length, 3);
});

test('the conversation checks the login card site after switching sites', async t => {
  const grants = new Map();
  const credentials = {
    readRecord: async key => grants.get(key),
    modifyRecord: async (key, update) => {
      const next = await update(grants.get(key));
      if (next) grants.set(key, next);
      return grants.get(key);
    },
  };
  const host = startHost({ token: '', credentials });
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/whoami`]: options => {
      assert.equal(options.headers['x-cheso-token'], 'original-site-fixture');
      return { user: { username: 'fixture' } };
    },
  });
  const createArgs = { prompt: 'Make a presentation' };
  const card = await host.call('cheso_create', createArgs);
  assert.equal(card.status, 'login_required');
  assert.equal(card.base_url, cheso);
  const agent = { session: { deriveMessages: () => [
    { role: 'assistant', content: [{ type: 'tool-call', name: 'cheso_create', id: 'call_login' }] },
    { role: 'tool', source: { kind: 'tool', callId: 'call_login' }, content: host.output('cheso_create').render(createArgs, card) },
  ] } };
  host.selectSite('global');
  const key = `cheso/site-${createHash('sha256').update(cheso).digest('hex')}`;
  grants.set(key, { kind: 'grant', payload: { authorization: {
    accessToken: 'original-site-fixture', expiresAt: Date.now() + 3600_000,
  } } });

  const signedIn = { status: 'signed_in', base_url: cheso };
  assert.deepEqual(await (await host.loginStatus(cheso)).json(), signedIn);
  assert.deepEqual(await host.call('cheso_login_wait', { base_url: card.base_url }), signedIn);
  assert.deepEqual(await host.call('cheso_login_wait', {}, { agent }), signedIn);
  assert.deepEqual(await host.call('cheso_login_wait', {}, {}), { status: 'login_required', base_url: globalCheso });
  await assert.rejects(host.call('cheso_login_wait', { base_url: 'https://unknown.example' }), /不在插件配置/);
  assert.equal(requests.calls.length, 3);
});

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

test('a Cheso hard stop returns only task artifacts for a final reply', async t => {
  const host = startHost();
  const agent = { session: {} };
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: {
      status: 'terminated', reason: 'hard_stopped', next_plan_id: 'plan_next',
      result: { files: [
        { file_id: 'file_deck', name: 'slides.vppt', version: 1 },
        { file_id: 'file_source', name: 'source.pdf', category: 'attachment' },
      ] },
    },
    [`GET ${cheso}/api/v1/plans/plan_demo`]: { project_id: 'project_demo' },
  });
  const args = { task_id: 'plan_demo' };
  const result = await host.call('cheso_wait', args, {
    agent,
    concludeTurn: () => assert.fail('The agent needs a model step to summarize the stop'),
  });
  assert.equal(result.task_id, args.task_id);
  assert.equal(result.status, 'terminated');
  assert.equal(result.message, undefined);
  assert.equal(result.project_url, project);
  assert.deepEqual(result.artifacts.map(file => [file.file_id, file.version]), [['file_deck', 1]]);
  assert.deepEqual(requests.calls.map(call => `${call.arguments[1].method} ${call.arguments[0]}`), [
    `GET ${cheso}/api/v1/plans/plan_demo/result`, `GET ${cheso}/api/v1/plans/plan_demo`,
  ]);
  const summary = host.output('cheso_wait').render(args, result)[0].text;
  assert.match(summary, /任务已停止.*任务结果列出的成品/);
  assert.match(summary, /slides\.vppt/);
  assert.match(summary, /不要再查询项目文件、继续等待或重新提交任务/);
});

test('a stopped task with no confirmed artifacts does not fall back to the project file list', async t => {
  const host = startHost();
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: { status: 'terminated' },
    [`GET ${cheso}/api/v1/plans/plan_demo`]: { project_id: 'project_demo' },
  });
  const args = { task_id: 'plan_demo' };
  const result = await host.call('cheso_wait', args);
  assert.equal(result.status, 'terminated');
  assert.equal(result.project_url, project);
  assert.deepEqual(result.artifacts, []);
  assert.equal(requests.calls.some(call => call.arguments[0] === projectFilesUrl), false);
  assert.match(host.output('cheso_wait').render(args, result)[0].text, /Cheso 任务已停止/);
});

test('creating a task without authorization directs the user to the DSH login card', async () => {
  const host = startHost({ token: '', credentials: { readRecord: async () => undefined, modifyRecord: async () => undefined } });
  const args = { prompt: '制作一个 PPT' };
  const result = await host.call('cheso_create', args);
  assert.equal(result.status, 'login_required');
  assert.equal(result.base_url, cheso);
  assert.match(host.output('cheso_create').render(args, result)[0].text, /DSH 登录卡/);
});

test('a login retry preserves the original task, site and user attachment after switching sites', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'cheso-login-retry-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const contents = 'original attached reference';
  const file = join(directory, 'stored-reference');
  await writeFile(file, contents);
  const attachmentId = 'sha256:' + createHash('sha256').update(contents).digest('hex');
  const grants = new Map();
  const credentials = {
    readRecord: async key => grants.get(key),
    modifyRecord: async (key, update) => {
      const next = await update(grants.get(key));
      if (next) grants.set(key, next);
      return grants.get(key);
    },
  };
  const host = startHost({
    token: '', credentials,
    attachmentStore: { fileHostPath: ref => {
      assert.equal(ref.attachmentId, attachmentId);
      return file;
    } },
  });
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/whoami`]: { user: { username: 'original-account' } },
    [`GET ${cheso}/api/v1/billing/credits`]: { grants: [{ amount_available: 1 }] },
    [`POST ${cheso}/api/v1/files/presign`]: ({ body }) => {
      assert.equal(JSON.parse(body).name, 'reference.txt');
      return { file_id: 'file_original', version: 1, upload_url: `${cheso}/storage` };
    },
    [`PUT ${cheso}/storage`]: async ({ body }) => {
      assert.equal(await body.text(), contents);
      return new Response(null, { status: 204 });
    },
    [`POST ${cheso}/api/v1/files/confirm`]: {},
    [`POST ${cheso}/api/v1/plans/create`]: ({ body }) => {
      assert.deepEqual(JSON.parse(body), {
        prompt: 'Use this reference', project_id: 'project_demo', agent_type: 'image_edit',
        contexts: [{ file_id: 'file_original', category: 'attachment' }],
      });
      return { plan_id: 'plan_original', project_id: 'project_demo' };
    },
  });
  const original = { role: 'user', source: { kind: 'user' }, content: [
    { type: 'file', attachment: { attachmentId, name: 'reference.txt', bytes: Buffer.byteLength(contents) } },
  ] };
  let messages = [original];
  const agent = { session: { deriveMessages: () => [...messages] } };
  const args = { prompt: 'Use this reference', files: ['reference.txt'], project_id: 'project_demo', agent_type: 'image_edit' };
  const blocked = await host.call('cheso_create', args, { agent });
  assert.equal(blocked.status, 'login_required');
  assert.equal(blocked.base_url, cheso);
  assert.equal(typeof blocked.retry_call_id, 'string');
  assert.match(host.output('cheso_create').render(args, blocked)[0].text, /retry_call_id/);
  const retry = { retry_call_id: blocked.retry_call_id };
  host.selectSite('global');
  assert.deepEqual(await host.call('cheso_create', retry, { agent }), blocked);
  for (const site of [cheso, globalCheso]) {
    const key = `cheso/site-${createHash('sha256').update(site).digest('hex')}`;
    grants.set(key, { kind: 'grant', payload: { authorization: {
      accessToken: 'site-fixture', expiresAt: Date.now() + 3600_000,
    } } });
  }
  messages = [original, { role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '已授权，请继续' }] }];
  assert.deepEqual(await host.call('cheso_login_wait', { base_url: blocked.base_url }, { agent }), {
    status: 'signed_in', base_url: cheso,
  });
  assert.equal(requests.calls.length, 1);
  await assert.rejects(host.call('cheso_create', retry, { agent: { session: {} } }), /不可恢复/);
  await assert.rejects(host.call('cheso_create', { ...retry, task_site: globalCheso }, { agent }), /沿用原站点和原请求/);
  await assert.rejects(host.call('cheso_create', { ...retry, files: ['another.txt'] }, { agent }), /沿用原站点和原请求/);
  const running = host.call('cheso_create', retry, { agent });
  await assert.rejects(host.call('cheso_create', retry, { agent }), /正在重试/);
  const result = await running;
  assert.equal(result.task_id, 'plan_original');
  assert.equal(result.base_url, cheso);
  await assert.rejects(host.call('cheso_create', retry, { agent }), /已处理/);
  assert.equal(requests.calls.filter(call => call.arguments[0] === `${cheso}/api/v1/plans/create`).length, 1);

  // The resumed request still checks the original attachment's saved digest.
  const originalKey = `cheso/site-${createHash('sha256').update(cheso).digest('hex')}`;
  const originalGrant = grants.get(originalKey);
  grants.delete(originalKey);
  messages = [original];
  const secondBlocked = await host.call('cheso_create', { ...args, task_site: cheso }, { agent });
  grants.set(originalKey, originalGrant);
  await writeFile(file, 'modified since upload to DSH');
  const beforeRetry = requests.calls.length;
  await assert.rejects(host.call('cheso_create', { retry_call_id: secondBlocked.retry_call_id }, { agent }), /附件.*已变化/);
  assert.deepEqual(requests.calls.slice(beforeRetry).map(call => call.arguments[0]), [`${cheso}/api/v1/billing/credits`]);
});

test('fresh creation can explicitly select the original site without a follow-up task ID', async t => {
  const host = startHost();
  host.selectSite('global');
  mockCheso(t, {
    [`GET ${cheso}/api/v1/billing/credits`]: { grants: [{ amount_available: 1 }] },
    [`POST ${cheso}/api/v1/plans/create`]: { plan_id: 'plan_original' },
  });
  const result = await host.call('cheso_create', { prompt: 'Make a presentation', task_site: cheso });
  assert.equal(result.base_url, cheso);
  await assert.rejects(host.call('cheso_create', { prompt: 'Make a presentation', task_site: 'https://unknown.example' }), /不在插件配置/);
});

test('a rejected fixed API token prompts configuration changes and never starts OAuth', async t => {
  const host = startHost({ credentials: {
    readRecord: async () => assert.fail('OAuth credentials must not be used'),
    modifyRecord: async () => assert.fail('OAuth must not be started'),
  } });
  const rejectFixedToken = options => {
    assert.equal(options.headers['x-cheso-token'], 'test-token');
    return new Response(null, { status: 401 });
  };
  mockCheso(t, {
    [`GET ${cheso}/api/v1/billing/credits`]: rejectFixedToken,
    [`GET ${cheso}/api/v1/whoami`]: rejectFixedToken,
    [`GET ${cheso}/api/v1/files/file_demo`]: rejectFixedToken,
  });
  const message = /更新或移除 DSH 配置中的 token 或启动环境中的 CHESO_API_TOKEN/;
  for (const tool of ['cheso_create', 'cheso_login', 'cheso_login_wait', 'cheso_whoami']) {
    await assert.rejects(host.call(tool, tool === 'cheso_create' ? { prompt: 'Make a presentation' } : {}), message);
  }
  for (const action of ['check', 'start']) {
    const response = await host.loginStatus(cheso, action);
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.code, 'fixed_token_rejected');
    assert.match(body.error, message);
    assert.equal(body.verification_uri, undefined);
  }
  const preview = await host.preview({ project_url: project, embed_base_url: embed, file_id: 'file_demo' });
  assert.equal(preview.status, 401);
  assert.deepEqual(await preview.json(), { error: 'fixed_token_rejected' });
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
    [`GET ${cheso}/api/v1/plans/plan_second`]: { project_id: 'project_demo', session_id: 'session_demo' },
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
  assert.equal(yielded.task_id, 'plan_second');
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
    [`GET ${cheso}/api/v1/plans/plan_current/result`]: () => stopped
      ? { status: 'terminated', result: { files: [{ file_id: 'file_deck', name: 'saved.vppt' }] } }
      : { status: 'interact' },
    [`POST ${cheso}/api/v1/plans/plan_current/terminate`]: () => {
      stopped = true;
      return Response.json({ code: 0 });
    },
  });
  const { task_id } = await host.call('cheso_create', { prompt: 'Make a slide deck' });
  host.selectSite('global');
  const args = { task_id };
  const result = await host.call('cheso_stop', args);
  assert.equal(result.task_id, 'plan_current');
  assert.equal(result.status, 'terminated');
  assert.equal(result.project_url, project);
  assert.deepEqual(result.artifacts.map(file => file.file_id), ['file_deck']);
  assert.match(host.output('cheso_stop').render(args, result)[0].text, /saved\.vppt/);
  assert.deepEqual(await host.call('cheso_stop', args), result);
  assert.equal(requests.calls.filter(call => call.arguments[0].endsWith('/terminate')).length, 1);
  assert.equal(requests.calls.some(call => call.arguments[0] === projectFilesUrl), false);
});

test('stopping a follow-up during handoff uses the running task in the same chain', async t => {
  const host = startHost();
  let stopped = false;
  mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_previous`]: { project_id: 'project_demo', session_id: 'session_demo' },
    [`POST ${cheso}/api/v1/plans/create`]: { queued: true, message: { message_id: 'msg_follow_up' } },
    [`POST ${cheso}/api/v1/messages/send_now`]: { plan_id: 'plan_pending', plan_status: 'pending' },
    [`GET ${cheso}/api/v1/plans/plan_pending/result`]: () => ({ status: stopped ? 'terminated' : 'pending' }),
    [`GET ${cheso}/api/v1/plans/plan_previous/result`]: { status: 'completed', next_plan_id: 'plan_running' },
    [`GET ${cheso}/api/v1/plans/plan_running/result`]: { status: 'in_progress' },
    [`POST ${cheso}/api/v1/plans/plan_running/terminate`]: () => {
      stopped = true;
      return Response.json({ code: 0 });
    },
  });
  const { task_id } = await host.call('cheso_create', { prompt: 'Add a cover', follow_up_task_id: 'plan_previous' });
  assert.equal(task_id, 'plan_pending');
  const result = await host.call('cheso_stop', { task_id });
  assert.equal(result.task_id, task_id);
  assert.equal(result.status, 'terminated');
});

test('stopping an already hard-stopped task does not send a terminate request', async t => {
  const host = startHost();
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_demo/result`]: { status: 'hard_stopped' },
    [`GET ${cheso}/api/v1/plans/plan_demo`]: {},
  });
  const args = { task_id: 'plan_demo' };
  const result = await host.call('cheso_stop', args);
  assert.equal(result.status, 'terminated');
  assert.ok(requests.calls.every(call => call.arguments[1].method === 'GET'));
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
  assert.deepEqual(result, { task_id: 'plan_demo', status: 'completed', base_url: cheso });
  assert.match(host.output('cheso_stop').render(args, result)[0].text, /任务已完成/);
});

test('a stopping result preserves the original site for its new task ID after restart', async t => {
  const host = startHost();
  let acknowledged = false;
  let completed = false;
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_first/result`]: { status: 'completed', next_plan_id: 'plan_new' },
    [`GET ${cheso}/api/v1/plans/plan_new/result`]: () => {
      if (completed) return { status: 'completed' };
      return acknowledged ? Response.json({}, { status: 403 }) : { status: 'in_progress' };
    },
    [`POST ${cheso}/api/v1/plans/plan_new/terminate`]: () => {
      acknowledged = true;
      return {};
    },
  });
  const args = { task_id: 'plan_first' };
  const result = await host.call('cheso_stop', args);
  assert.deepEqual(result, { task_id: 'plan_new', status: 'stopping', base_url: cheso });
  const content = host.output('cheso_stop').render(args, result);
  const agent = { session: { deriveMessages: () => [
    { role: 'assistant', content: [{ type: 'tool-call', name: 'cheso_stop', id: 'call_stop' }] },
    { role: 'tool', source: { kind: 'tool', callId: 'call_stop' }, content },
  ] } };
  const restarted = startHost();
  restarted.selectSite('global');
  completed = true;
  assert.deepEqual(await restarted.call('cheso_stop', { task_id: result.task_id }, { agent }), {
    task_id: 'plan_new', status: 'completed', base_url: cheso,
  });
  assert.equal(requests.calls.filter(call => call.arguments[1].method === 'POST').length, 1);
});

test('stopping retries a new active target when the original stage just handed off', async t => {
  const host = startHost();
  let handedOff = false;
  let stopped = false;
  const requests = mockCheso(t, {
    [`GET ${cheso}/api/v1/plans/plan_first/result`]: () => handedOff
      ? { status: 'completed', next_plan_id: 'plan_new' }
      : { status: 'in_progress' },
    [`POST ${cheso}/api/v1/plans/plan_first/terminate`]: () => {
      handedOff = true;
      return Response.json({ code: 1101 }, { status: 409 });
    },
    [`GET ${cheso}/api/v1/plans/plan_new/result`]: () => ({ status: stopped ? 'terminated' : 'in_progress' }),
    [`POST ${cheso}/api/v1/plans/plan_new/terminate`]: () => {
      stopped = true;
      return {};
    },
    [`GET ${cheso}/api/v1/plans/plan_new`]: { project_id: 'project_demo' },
  });
  const result = await host.call('cheso_stop', { task_id: 'plan_first' });
  assert.equal(result.status, 'terminated');
  assert.equal(result.task_id, 'plan_new');
  assert.deepEqual(requests.calls.filter(call => call.arguments[1].method === 'POST').map(call => call.arguments[0]), [
    `${cheso}/api/v1/plans/plan_first/terminate`,
    `${cheso}/api/v1/plans/plan_new/terminate`,
  ]);
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
    { label: 'Design', question: 'Style?', values: ['Natural', 'with watercolor'] },
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
