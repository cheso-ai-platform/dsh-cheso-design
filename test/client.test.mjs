import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const bundle = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8');
const artifactsKey = 'dsh-cheso-design-artifacts';

function startClient() {
  const element = (type, props) => ({ type, props });
  const views = new Map();
  const definitions = new Map();
  vm.runInNewContext(bundle, { window: { __ModuleLoader__: { load({ factory }) {
    factory(() => ({ jsx: element, jsxs: element })).apply({
      locale: { bind: () => key => key },
      configForms: { get: () => ({}) },
      effect() {},
      slots: {
        inject(name, setup) {
          if (name === 'conversation.input.dock' || name === 'tool.call.toolview') setup();
        },
        register(options, view) { views.set(options.id ?? options.key, view); },
      },
      uiConversation: { events: { register(definition) { definitions.set(definition.kind, definition); } } },
    });
  } } } });
  return { views, artifacts: definitions.get(artifactsKey) };
}

const resultContent = payload => [{ type: 'text', text: 'Task status\n[cheso-card]' + JSON.stringify(payload) }];

test('progress links distinguish tasks with the same ID on different sites', () => {
  const { views, artifacts } = startClient();
  const taskId = 'plan_shared';
  const sites = ['https://cheso.example', 'https://cheso.ai'];
  const projectUrls = sites.map((site, index) => `${site}/agent/project_${index}`);
  const turn = 1;
  const toolCall = callId => ({ type: 'tool/call', data: { callId, name: 'cheso_create', turn } });
  let state = artifacts.start({}, { event: toolCall('create_0') });
  for (const [index, site] of sites.entries()) {
    const callId = `create_${index}`;
    state = artifacts.update({ state }, { event: toolCall(callId) });
    state = artifacts.update({ state }, { event: {
      type: 'tool/result', surfaceOp: 'append', data: { turn, message: {
        source: { callId }, content: resultContent({
          task_id: taskId, status: 'in_progress', base_url: index === 0 ? undefined : site, project_url: projectUrls[index],
        }),
      } },
    } });
  }
  assert.equal(state.cards.size, 2);
  const dock = views.get('dsh-cheso-design-progress');
  function progressLink(site) {
    const snapshot = {
      timeline: { turns: new Map([[turn, { data: new Map([[artifactsKey, state]]) }]]) },
      legacy: { runningCalls: [{
        name: 'cheso_wait', phase: 'start', callId: 'wait', subCalls: [], turn,
        argsRaw: JSON.stringify({ task_id: taskId, task_site: site }),
      }] },
    };
    const progress = dock({ t: key => key, useChat: selector => selector(snapshot) }).props.children[0];
    return progress.type(progress.props).props.children[1]?.props.href;
  }
  assert.equal(progressLink(sites[0]), projectUrls[0]);
  assert.equal(progressLink(sites[1]), projectUrls[1]);
  assert.equal(progressLink(undefined), undefined);
});

test('the persisted stopping result keeps the existing text-only presentation', () => {
  const { views } = startClient();
  const view = views.get('cheso_stop');
  const element = view({
    phase: 'result', t: key => key,
    block: { content: resultContent({ task_id: 'plan_new', status: 'stopping', base_url: 'https://cheso.example' }) },
  });
  assert.equal(element.type(element.props), null);
});
