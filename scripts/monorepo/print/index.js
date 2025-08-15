/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

const {getPackages} = require('../../utils/monorepo');
const {exit} = require('shelljs');
const yargs = require('yargs');

const {
  argv: {type, minor},
} = yargs
  .option('type', {
    type: 'string',
    describe: 'Choose which packages to list, default is all',
    choices: ['all', 'public', 'private'],
    default: 'all',
  })
  .option('minor', {
    type: 'number',
    describe:
      'List latest version for specified minor. Ex. 72, 73. Note this will make a network request to npm',
    default: 0,
  })
  .check(argv => {
    if (argv.minor > 0 && argv.minor < 70) {
      throw new Error('Invalid minor. No monorepo packages before 70');
    }
    return true;
  })
  .strict();

function reversePatchComp(semverA, semverB) {
  const patchA = parseInt(semverA.split('.')[2], 10);
  const patchB = parseInt(semverB.split('.')[2], 10);
  return patchB - patchA;
}

/**
 * `packageName`: name of npm package
 * `spec`: spec range ex. '^0.72.0'
 *
 * Return an array of versions of the specified spec range or throw an error
 */
function getVersionsBySpec(
  packageName /*: string */,
  spec /*: string */,
) /*: Array<string> */ {
  const npmString = `npm view ${packageName}@'${spec}' version --json`;
  const result = exec(npmString, {silent: true});

  if (result.code) {
    // Special handling if no such package spec exists
    if (result.stderr.includes('npm ERR! code E404')) {
      /**
       * npm ERR! code E404
       * npm ERR! 404 No match found for version ^0.72.0
       * npm ERR! 404
       * npm ERR! 404  '@react-native/community-cli-plugin@^0.72.0' is not in this registry.
       * npm ERR! 404
       * npm ERR! 404 Note that you can also install from a
       * npm ERR! 404 tarball, folder, http url, or git url.
       * {
       *   "error": {
       *     "code": "E404",
       *     "summary": "No match found for version ^0.72.0",
       *     "detail": "\n '@react-native/community-cli-plugin@^0.72.0' is not in this registry.\n\nNote that you can also install from a\ntarball, folder, http url, or git url."
       *   }
       * }
       */
      const error = JSON.parse(
        result.stderr
          .split('\n')
          .filter(line => !line.includes('npm ERR'))
          .join(''),
      ).error;
      throw new Error(error.summary);
    } else {
      throw new Error(`Failed: ${npmString}`);
    }
  }
  const versions = JSON.parse(result.stdout.trim());
  return !Array.isArray(versions) ? [versions] : versions;
}

async function main() {
  const data = [];
  const packages = await getPackages({
    includeReactNative: true,
    includePrivate: true,
  });

  for (const {packageJson} of Object.values(packages)) {
    const isPublic = !packageJson.private;
    if (
      type === 'all' ||
      (type === 'private' && !isPublic) ||
      (type === 'public' && isPublic)
    ) {
      const packageInfo = {
        'Public?': isPublic ? '\u{2705}' : '\u{274C}',
        Name: packageJson.name,
        'Version (main)': packageJson.version,
      };

      if (isPublic && minor !== 0) {
        try {
          const versions = getVersionsBySpec(
            packageJson.name,
            `^0.${minor}.0`,
          ).sort(reversePatchComp);
          packageInfo[`Version (${minor})`] = versions[0];
        } catch (e) {
          packageInfo[`Version (${minor})`] = e.message;
        }
      }
      data.push(packageInfo);
    }
  }

  console.table(data);
  exit(0);
}

if (require.main === module) {
  void main();
}
