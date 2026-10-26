/*
 * Creates regular backups of the canvas in png tiles
 * In order to run huge redis operations, you have to allow redis to use
 * more virtual memory, with:
 * vm.overcommit_memory = 1 in /etc/sysctl.conf and `sysctl vm.overcommit_memory=1`
 * also:
 * echo never > /sys/kernel/mm/transparent_hugepage/enabled
 *
 * @flow
 */

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import redis from 'redis';
import bluebird from 'bluebird';

import process from 'process';
import { spawn } from 'child_process';

import {
  updateBackupRedis,
  createPngBackup,
  incrementialBackupRedis,
} from './core/tilesBackup';
import canvases from './canvases.json';

/*
 * use low cpu priority
 */
const priority = 15;
const proc = spawn('renice', [priority, process.pid]);
proc.on('exit', (code) => {
  if (code !== 0) {
    console.log(`renice failed with code ${code}`);
  }
  console.log('Using low cpu priority');
});
// -------------------


bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const [
  CANVAS_REDIS_URL,
  BACKUP_REDIS_URL,
  BACKUP_DIR,
  INTERVAL,
  CMD,
] = process.argv.slice(2);

if (!CANVAS_REDIS_URL || !BACKUP_REDIS_URL || !BACKUP_DIR) {
  console.error(
    'Usage: node backup.js original_canvas backup_canvas backup_directory',
  );
  process.exit(1);
}

function normalizeRedisEndpoint(redisUrl: string) {
  let parsed;
  try {
    parsed = new URL(redisUrl);
  } catch (err) {
    throw new Error(`Invalid Redis URL: ${redisUrl}`);
  }
  if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
    throw new Error(`Redis URL must use redis:// or rediss://: ${redisUrl}`);
  }
  let hostname = parsed.hostname.toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    hostname = 'loopback';
  }
  const port = parsed.port || (parsed.protocol === 'rediss:' ? '6380' : '6379');
  const database = parsed.pathname && parsed.pathname !== '/'
    ? parsed.pathname.replace(/^\//, '')
    : '0';
  return `${parsed.protocol}//${hostname}:${port}/${database}`;
}

const canvasEndpoint = normalizeRedisEndpoint(CANVAS_REDIS_URL);
const backupEndpoint = normalizeRedisEndpoint(BACKUP_REDIS_URL);
if (canvasEndpoint === backupEndpoint) {
  throw new Error(
    'Refusing to run backup: BACKUP_REDIS_URL must be a separate Redis endpoint/database.',
  );
}

function getRedisServerInfo(redisClient: Object): Promise<string> {
  return new Promise((resolve, reject) => {
    redisClient.info('server', (err, info) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(info);
    });
  });
}

function getRedisRunId(info: string) {
  const match = info.match(/^run_id:([^\r\n]+)/m);
  return match ? match[1] : null;
}

async function assertRedisInstancesAreDistinct() {
  const [canvasInfo, backupInfo] = await Promise.all([
    getRedisServerInfo(canvasRedis),
    getRedisServerInfo(backupRedis),
  ]);
  const canvasRunId = getRedisRunId(canvasInfo);
  const backupRunId = getRedisRunId(backupInfo);
  if (!canvasRunId || !backupRunId) {
    throw new Error(
      'Refusing to run backup: could not verify Redis server identity from INFO server run_id.',
    );
  }
  if (canvasRunId && backupRunId && canvasRunId === backupRunId) {
    throw new Error(
      'Refusing to run backup: canvas and backup URLs resolve to the same Redis server.',
    );
  }
}

const canvasRedis = redis
  .createClient(CANVAS_REDIS_URL, { return_buffers: true });
const backupRedis = redis
  .createClient(BACKUP_REDIS_URL, { return_buffers: true });
canvasRedis.on('error', () => {
  console.error('Could not connect to canvas redis');
  process.exit(1);
});
backupRedis.on('error', () => {
  console.error('Could not connect to backup redis');
  process.exit(1);
});


function runCmd(cmd: string) {
  const startTime = Date.now();
  console.log(`Executing ${cmd}`);
  const cmdproc = spawn(cmd);
  cmdproc.on('exit', (code) => {
    if (code !== 0) {
      console.log(`${cmd} failed with code ${code}`);
    }
    const time = Date.now() - startTime;
    console.log(`${cmd} done in ${time}ms`);
  });
  cmdproc.stdout.on('data', (data) => {
    console.log(`${cmd}: ${data}`);
  });
  cmdproc.stderr.on('data', (data) => {
    console.log(`${cmd} error: ${data}`);
  });
}


function getDateFolder() {
  const dir = path.resolve(__dirname, BACKUP_DIR);
  if (!fs.existsSync(dir)) {
    console.error(`Backup directory ${BACKUP_DIR} does not exist!`);
    process.exit(1);
  }
  const date = new Date();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  if (month < 10) month = `0${month}`;
  if (day < 10) day = `0${day}`;
  const dayDir = `${date.getFullYear()}${month}${day}`;
  const backupDir = `${dir}/${dayDir}`;
  return backupDir;
}

async function dailyBackup() {
  const backupDir = getDateFolder();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  // Only clear the dedicated backup database. Never flush every Redis database.
  await backupRedis.flushdbAsync('ASYNC');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  await updateBackupRedis(canvasRedis, backupRedis, canvases);
  await createPngBackup(backupRedis, canvases, backupDir);
  console.log('Daily full backup done');
}

async function incrementialBackup() {
  const backupDir = getDateFolder();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  await incrementialBackupRedis(
    canvasRedis,
    backupRedis,
    canvases,
    backupDir,
  );
}

async function trigger() {
  await assertRedisInstancesAreDistinct();
  const backupDir = getDateFolder();
  if (!fs.existsSync(backupDir)) {
    await dailyBackup();
  } else {
    await incrementialBackup();
  }
  if (CMD) {
    runCmd(CMD);
  }
  if (!INTERVAL) {
    process.exit(0);
  }
  console.log(`Creating next backup in ${INTERVAL} minutes`);
  setTimeout(trigger, INTERVAL * 60 * 1000);
}

console.log('Starting backup...');
trigger();
