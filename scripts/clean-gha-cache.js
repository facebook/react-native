/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

const {execSync} = require('node:child_process');

const CACHE_LIMIT = 10 * 1024 ** 3 * 0.9;
// Doing this to capture node-modules- and the pre-existing node-cache-<platform>-yarn-<sha> entries
const NODE_CACHE_KEY = 'node-';
const NODE_CACHE_KEY_FULL = 'node-modules-';

function cleanData(rawStr) {
  const now = new Date();
  const json = JSON.parse(rawStr);
  return (
    json
      .map(raw => ({
        ...raw,
        createdAt: now - new Date(raw.createdAt),
        msSinceLastAccessed: now - new Date(raw.lastAccessedAt),
      }))
      // Order: oldest last access time first
      .sort((a, b) => b.msSinceLastAccessed - a.msSinceLastAccessed)
  );
}

const mb = bytes => (bytes / 1024 ** 2).toFixed(2) + 'MB';
const hrs = ms => (ms / (1000 * 60 * 60)).toFixed(1) + 'hrs';

const dryRun = process.argv.indexOf('--dry') !== -1;

function cacheToString(entry) {
  return `[${hrs(entry.msSinceLastAccessed).padStart(7)}] ${mb(entry.sizeInBytes).padStart(7)} -> ${entry.key}`;
}

function cleanCache(cmd) {
  try {
    const msg = execSync(cmd, 'utf8');
    return msg.trim().length > 0 ? msg.trim() : '🪓';
  } catch (e) {
    // There can be race conditions between github cache cleanups and this script.
    if (/Could not find a cache matching/.test(e.message)) {
      return 'The cache entry no longer exists, skipping.';
    }
    return `Failed: '${e.message}', skipping.`;
  }
}

function main() {
  const cacheUsage = cleanData(
    execSync(
      'gh cache list --sort last_accessed_at --json id,key,createdAt,lastAccessedAt,sizeInBytes --limit 1000',
      'utf8',
    ),
  );

  let total = 0;
  let remove = [];
  let cleaned = 0;

  // Be aggressive with node cache entries. Ignore entries < 1MB and only keep most
  // recently created entry.
  const nodeCacheUsage = cacheUsage
    .filter(
      ({key, sizeInBytes}) =>
        // I've observed some noisy entries, ignore anything that isn't > 1MB
        key.startsWith(NODE_CACHE_KEY) && sizeInBytes > 1024 * 1024,
    )
    .sort((a, b) => b.createdAt - a.createdAt);
  // Find the oldest version of node-modules-*. It's still possible that we have legacy node-yarn-*
  // entries if there are commits on branches of RN < 0.75-stable, so guard for this:
  const idx = nodeCacheUsage.findLastIndex(({key}) =>
    key.startsWith(NODE_CACHE_KEY_FULL),
  );
  const keeping = (
    idx === -1 ? nodeCacheUsage : nodeCacheUsage.splice(idx, 1)
  ).pop();

  console.log(
    'TASK: clean up old node_modules cache entries.',
    keeping
      ? `\nkeeping ${cacheToString(keeping)}`
      : ' Skipping, no cache entries.',
  );
  for (const entry of nodeCacheUsage) {
    console.warn(`removing ${cacheToString(entry)}`);
    cleaned += entry.sizeInBytes;
    remove.push(entry.id);
  }

  // Cleanup everything else
  console.log(
    'TASK: clean up everything else that takes us over our threshold: ' +
      mb(CACHE_LIMIT),
  );
  for (let i = cacheUsage.length - 1; i > 0; i--) {
    const cache = cacheUsage[i];
    total += cache.sizeInBytes;

    // Are we in the danger zone?
    if (total > CACHE_LIMIT) {
      console.warn(cacheToString(cacheUsage[i]));
      cleaned += cache.sizeInBytes;
      remove.push(cache.id);
    } else {
      console.warn(
        `skip ${cacheUsage.length - i} ${mb(cache.sizeInBytes)} ${hrs(cache.msSinceLastAccessed)}`,
      );
    }
  }
  console.warn(
    `Identifed ${remove.length} cache keys for removal, reducing cache from ${mb(total)} -> ${mb(total - cleaned)}`,
  );

  const cleanup = remove.map(
    id => `gh cache delete ${id} --repo facebook/react-native`,
  );
  for (const cmd of cleanup) {
    if (dryRun) {
      console.warn(`Skip: ${cmd}`);
    } else {
      console.warn(`${cmd} → ${cleanCache(cmd)}`);
    }
  }
}

main();
