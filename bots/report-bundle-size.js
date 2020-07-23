/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {GITHUB_REF, GITHUB_SHA} = process.env;
if (!GITHUB_REF || !GITHUB_SHA) {
  if (!GITHUB_REF) {
    console.error("Missing GITHUB_REF. This should've been set by the CI.");
  }
  if (!GITHUB_SHA) {
    console.error("Missing GITHUB_SHA. This should've been set by the CI.");
  }
  process.exit(1);
}

const fs = require('fs');
const datastore = require('./datastore');
const {createOrUpdateComment} = require('./make-comment');

/**
 * Generates and submits a comment. If this is run on master branch, data is
 * committed to the store instead.
 * @param {{
      'android-hermes-arm64-v8a'?: number;
      'android-hermes-armeabi-v7a'?: number;
      'android-hermes-x86'?: number;
      'android-hermes-x86_64'?: number;
      'android-jsc-arm64-v8a'?: number;
      'android-jsc-armeabi-v7a'?: number;
      'android-jsc-x86'?: number;
      'android-jsc-x86_64'?: number;
      'ios-universal'?: number;
    }} stats
 */
async function reportSizeStats(stats, replacePattern) {
  const {FIREBASE_APP_EMAIL, FIREBASE_APP_PASS} = process.env;
  const store = await datastore.initializeStore(
    FIREBASE_APP_EMAIL,
    FIREBASE_APP_PASS,
  );
  const collection = datastore.getBinarySizesCollection(store);

  if (GITHUB_REF === 'master') {
    // Ensure we only store numbers greater than zero.
    const validatedStats = Object.keys(stats).reduce((validated, key) => {
      const value = stats[key];
      if (typeof value !== 'number' || value <= 0) {
        return validated;
      }

      validated[key] = value;
      return validated;
    }, {});
    if (Object.keys(validatedStats).length > 0) {
      await datastore.createOrUpdateDocument(
        collection,
        GITHUB_SHA,
        validatedStats,
      );
    }
  } else {
    const document = await datastore.getLatestDocument(collection);

    const diffFormatter = new Intl.NumberFormat('en', {signDisplay: 'always'});
    const sizeFormatter = new Intl.NumberFormat('en', {});

    // | Platform | Engine | Arch        | Size (bytes) | Diff |
    // |:---------|:-------|:------------|-------------:|-----:|
    // | android  | hermes | arm64-v8a   |      9437184 |   ±0 |
    // | android  | hermes | armeabi-v7a |      9015296 |   ±0 |
    // | android  | hermes | x86         |      9498624 |   ±0 |
    // | android  | hermes | x86_64      |      9965568 |   ±0 |
    // | android  | jsc    | arm64-v8a   |      9236480 |   ±0 |
    // | android  | jsc    | armeabi-v7a |      8814592 |   ±0 |
    // | android  | jsc    | x86         |      9297920 |   ±0 |
    // | android  | jsc    | x86_64      |      9764864 |   ±0 |
    // | android  | jsc    | x86_64      |      9764864 |   ±0 |
    // | ios      | -      | universal   |     10715136 |   ±0 |
    const comment = [
      '| Platform | Engine | Arch | Size (bytes) | Diff |',
      '|:---------|:-------|:-----|-------------:|-----:|',
      ...Object.keys(stats).map(identifier => {
        const [size, diff] = (() => {
          const statSize = stats[identifier];
          if (!statSize) {
            return ['n/a', '--'];
          } else if (!(identifier in document)) {
            return [statSize, 'n/a'];
          } else {
            return [
              sizeFormatter.format(statSize),
              diffFormatter.format(statSize - document[identifier]),
            ];
          }
        })();

        const [platform, engineOrArch, ...archParts] = identifier.split('-');
        const arch = archParts.join('-') || engineOrArch;
        const engine = arch === engineOrArch ? '-' : engineOrArch; // e.g. 'ios-universal'
        return `| ${platform} | ${engine} | ${arch} | ${size} | ${diff} |`;
      }),
      '',
      `Base commit: ${document.commit}`,
    ].join('\n');
    createOrUpdateComment(comment, replacePattern);
  }

  // Documentation says that we don't need to call `terminate()` but the script
  // will just hang around until the connection times out if we don't.
  store.terminate();
}

/**
 * Returns the size of the file at specified path in bytes.
 * @param {fs.PathLike} path
 * @returns {number}
 */
function getFileSize(path) {
  try {
    const stats = fs.statSync(path);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Returns the size of the APK for specified JS engine and architecture.
 * @param {'hermes' | 'jsc'} engine
 * @param {'arm64-v8a' | 'armeabi-v7a' | 'x86' | 'x86_64'} arch
 */
function android_getApkSize(engine, arch) {
  return getFileSize(
    `RNTester/android/app/build/outputs/apk/${engine}/release/app-${engine}-${arch}-release.apk`,
  );
}

/**
 * Reports app bundle size.
 * @param {string} target
 */
function report(target) {
  switch (target) {
    case 'android':
      reportSizeStats(
        {
          'android-hermes-arm64-v8a': android_getApkSize('hermes', 'arm64-v8a'),
          'android-hermes-armeabi-v7a': android_getApkSize(
            'hermes',
            'armeabi-v7a',
          ),
          'android-hermes-x86': android_getApkSize('hermes', 'x86'),
          'android-hermes-x86_64': android_getApkSize('hermes', 'x86_64'),
          'android-jsc-arm64-v8a': android_getApkSize('jsc', 'arm64-v8a'),
          'android-jsc-armeabi-v7a': android_getApkSize('jsc', 'armeabi-v7a'),
          'android-jsc-x86': android_getApkSize('jsc', 'x86'),
          'android-jsc-x86_64': android_getApkSize('jsc', 'x86_64'),
        },
        '\\| android \\| hermes \\| arm',
      );
      break;

    case 'ios':
      reportSizeStats(
        {
          'ios-universal': getFileSize(
            'RNTester/build/Build/Products/Release-iphonesimulator/RNTester.app/RNTester',
          ),
        },
        '\\| ios \\| - \\| universal \\|',
      );
      break;

    default: {
      const path = require('path');
      console.log(`Syntax: ${path.basename(process.argv[1])} [android | ios]`);
      break;
    }
  }
}

const {[2]: target} = process.argv;
report(target);
