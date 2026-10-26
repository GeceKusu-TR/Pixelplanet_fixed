/* eslint-disable no-console */

const { spawnSync } = require('child_process');

const babelNode = require.resolve('@babel/node/bin/babel-node.js');
const nodeOptions = [
  process.env.NODE_OPTIONS,
  '--openssl-legacy-provider',
].filter(Boolean).join(' ');

const result = spawnSync(
  process.execPath,
  [babelNode, 'tools/run', 'build'],
  {
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
    stdio: 'inherit',
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
