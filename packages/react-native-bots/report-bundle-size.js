/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_PR_NUMBER,
  GITHUB_REF,
  GITHUB_SHA,
} = process.env;

const fs = require('fs');
const datastore = require('./datastore');
const {
  createOrUpdateComment,
  validateEnvironment: validateEnvironmentForMakeComment,
} = require('./make-comment');

/**
 * Generates and submits a comment. If this is run on the main or release branch, data is
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

  if (!isPullRequest(GITHUB_REF)) {
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
      // Print out the new stats
      const document =
        (await datastore.getLatestDocument(collection, GITHUB_REF)) || {};
      const formattedStats = formatBundleStats(document, validatedStats);
      console.log(formattedStats);

      await datastore.createOrUpdateDocument(
        collection,
        GITHUB_SHA,
        validatedStats,
        GITHUB_REF,
      );
    }
  } else {
    const params = {
      auth: GITHUB_TOKEN,
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      issue_number: GITHUB_PR_NUMBER,
    };

    // For PRs, always compare vs main.
    const document =
      (await datastore.getLatestDocument(collection, 'main')) || {};
    const comment = formatBundleStats(document, stats);
    createOrUpdateComment(params, comment, replacePattern);
  }

  await datastore.terminateStore(store);
}

/**
 * Format the new bundle stats as compared to the latest stored entry.
 * @param {firebase.firestore.DocumentData} document the latest entry to compare against
 * @param {firebase.firestore.UpdateData} stats The stats to be formatted
 * @returns {string}
 */
function formatBundleStats(document, stats) {
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
  const formatted = [
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
    `Base commit: ${document.commit || '<unknown>'}`,
    `Branch: ${document.branch || '<unknown>'}`,
  ].join('\n');

  return formatted;
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
    `packages/rn-tester/android/app/build/outputs/apk/${engine}/release/app-${engine}-${arch}-release.apk`,
  );
}

/**
 * Returns whether the specified ref points to a pull request.
 */
function isPullRequest(ref) {
  return ref !== 'main' && !/^\d+\.\d+-stable$/.test(ref);
}

/**
 * Validates that required environment variables are set.
 * @returns {boolean} `true` if everything is in order; `false` otherwise.
 */
function validateEnvironment() {
  if (!GITHUB_REF) {
    console.error("Missing GITHUB_REF. This should've been set by the CI.");
    return false;
  }

  if (isPullRequest(GITHUB_REF)) {
    if (!validateEnvironmentForMakeComment()) {
      return false;
    }
  } else if (!GITHUB_SHA) {
    // To update the data store, we need the SHA associated with the build
    console.error("Missing GITHUB_SHA. This should've been set by the CI.");
    return false;
  }

  console.log(`  GITHUB_SHA=${GITHUB_SHA}`);

  return true;
}

/**
 * Reports app bundle size.
 * @param {string} target
 */
async function report(target) {
  switch (target) {
    case 'android':
      await reportSizeStats(
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
      await reportSizeStats(
        {
          'ios-universal': getFileSize(
            'packages/rn-tester/build/Build/Products/Release-iphonesimulator/RNTester.app/RNTester',
          ),
        },
        '\\| ios \\| - \\| universal \\|',
      );
      break;

    default: {
      const path = require('path');
      console.log(`Syntax: ${path.basename(process.argv[1])} [android | ios]`);
      process.exitCode = 2;
      break;
    }
  }
}

if (!validateEnvironment()) {
  process.exit(1);
}

const {[2]: target} = process.argv;
report(target).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
