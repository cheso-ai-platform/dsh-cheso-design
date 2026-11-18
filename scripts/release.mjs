import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const registry = 'https://registry.npmjs.org';
const usage = 'Usage: npm run release -- <test|stable> <version> [--dry-run]';

function runNpm(args, capture = false) {
  const npmCli = process.env.npm_execpath;
  const result = spawnSync(npmCli ? process.execPath : 'npm', npmCli ? [npmCli, ...args] : args, {
    cwd: root,
    encoding: 'utf8',
    stdio: capture ? ['inherit', 'pipe', 'inherit'] : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`npm ${args[0]} failed (${result.signal ?? result.status})`);
  }
  return result.stdout;
}

function release() {
  const { values, positionals } = parseArgs({
    options: { 'dry-run': { type: 'boolean' }, help: { type: 'boolean', short: 'h' } },
    allowPositionals: true,
  });
  if (values.help) {
    console.log(usage);
    return;
  }

  const [channel, version] = positionals;
  if (positionals.length !== 2 || (channel !== 'test' && channel !== 'stable')) {
    throw new Error(usage);
  }

  const versionMatch = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(version);
  const prerelease = versionMatch?.[1];
  if (!versionMatch || prerelease?.split('.').some(part => /^0\d+$/.test(part))) {
    throw new Error(`Invalid release version: ${version}`);
  }
  if (channel === 'test' && !prerelease) {
    throw new Error('Test releases require a prerelease version such as 0.1.1-rc.0.');
  }
  if (channel === 'stable' && prerelease) {
    throw new Error('Stable releases require a version such as 0.1.1.');
  }

  const tag = channel === 'test' ? 'next' : 'latest';
  runNpm(['run', 'typecheck']);
  runNpm(['test']); // The test script builds the publishable bundles.

  const [{ files }] = JSON.parse(runNpm(['pack', '--dry-run', '--json', '--ignore-scripts'], true));
  const staging = mkdtempSync(join(tmpdir(), 'dsh-cheso-release-'));
  try {
    for (const { path } of files) {
      const destination = join(staging, path);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(join(root, path), destination);
    }

    const manifestPath = join(staging, 'package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.version = version;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const args = ['publish', staging, `--tag=${tag}`, `--registry=${registry}`, '--ignore-scripts'];
    if (values['dry-run']) args.push('--dry-run');
    runNpm(args);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

try {
  release();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
