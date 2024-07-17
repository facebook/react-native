/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {execSync} = require('node:child_process');

const CACHE_LIMIT = (10 * 1024 ** 3) * 0.9;

function cleanData(rawStr) {
  const now = new Date();
  const json = JSON.parse(rawStr);
  return json
    .map(raw => ({
      ...raw,
      msSinceLastAccessed: now - new Date(raw.lastAccessedAt),
    }))
    .sort((a, b) => b.msSinceLastAccessed - a.msSinceLastAccessed);
}

const mb = bytes => (bytes / 1024 ** 2).toFixed(2) + 'MB';
const hrs = ms => (ms / (1000 * 60 * 60)).toFixed(1) + 'hrs';

const dryRun = process.argv.indexOf('--dry') !== -1;

function main() {
  const cacheUsage = cleanData(execSync(
    'gh cache list --sort last_accessed_at --json id,key,lastAccessedAt,sizeInBytes --limit 1000',
    'utf8'
  ));

  let total = 0;
  let remove = [];
  let cleaned = 0;
  for (let i = cacheUsage.length - 1; i > 0; i--) {
    const {id, key, msSinceLastAccessed, sizeInBytes} = cacheUsage[i];
    total += sizeInBytes;

    // Are we in the danger zone?
    if (total > CACHE_LIMIT) {
      console.warn(`[${hrs(msSinceLastAccessed).padStart(7)}] ${mb(sizeInBytes).padStart(7)} -> ${key}`);
      cleaned += sizeInBytes;
      remove.push(id);
    } else {
      console.warn(`skip ${cacheUsage.length - i} ${mb(sizeInBytes)} ${hrs(msSinceLastAccessed)}`);
    }
  }
  console.warn(`Identifed ${remove.length} cache keys for removal, reducing cache from ${mb(total)} -> ${mb(total - cleaned)}`);

  const cleanup = remove.map(id => `gh cache delete ${id} --repo facebook/react-native`);
  for (const cmd of cleanup) {
    if (dryRun) {
      console.warn(`DRY: ${cmd}`);
    } else {
      console.warn(`${cmd} -> ${execSync(cmd, 'utf8').toString()}`);
    }
  }
}

main();
