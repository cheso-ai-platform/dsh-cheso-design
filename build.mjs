import { context } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';

const watch = process.argv.includes('--watch');
const clientId = 'dsh-cheso-design';

await mkdir('lib', { recursive: true });

const hostOptions = {
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
};

const clientOptions = {
  entryPoints: ['src/client/index.tsx'],
  outfile: 'lib/client.js',
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
  sourcemap: true,
  logLevel: 'info',
  plugins: [{
    name: 'write-dsh-client',
    setup(build) {
      build.onEnd(async ({ errors, outputFiles }) => {
        if (!errors.length) await writeClient(outputFiles);
      });
    },
  }],
};

async function writeClient(outputFiles) {
  const js = outputFiles.find((file) => file.path.endsWith('.js'));
  const map = outputFiles.find((file) => file.path.endsWith('.map'));
  if (!js) throw new Error('client bundle missing');
  // DSH 通过自己的模块加载器运行浏览器包，并用传入的 require 解析 React 等依赖。
  const code = js.text.replace(/\n?\/\/# sourceMappingURL=.*\s*$/u, '');
  const wrapped = [
    'window.__ModuleLoader__.load({',
    `  id: ${JSON.stringify(clientId)},`,
    '  factory: (require) => {',
    '    var module = { exports: {} };',
    '    var exports = module.exports;',
    code,
    '    return module.exports;',
    '  }',
    '});',
    '//# sourceMappingURL=client.js.map',
    '',
  ].join('\n');
  await writeFile('lib/client.js', wrapped);
  if (map) await writeFile('lib/client.js.map', map.text);
}

const hostCtx = await context(hostOptions);
const clientCtx = await context(clientOptions);
if (watch) {
  await hostCtx.watch();
  await clientCtx.watch();
  console.log('[dsh-cheso-design] watching…');
} else {
  try {
    await hostCtx.rebuild();
    await clientCtx.rebuild();
  } finally {
    await Promise.all([hostCtx.dispose(), clientCtx.dispose()]);
  }
  console.log('[dsh-cheso-design] built lib/index.js and lib/client.js');
}
