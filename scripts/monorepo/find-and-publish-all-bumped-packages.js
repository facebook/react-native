/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const path = require('path');
const chalk = require('chalk');
const {exec} = require('shelljs');

const forEachPackage = require('./for-each-package');

const ROOT_LOCATION = path.join(__dirname, '..', '..');
const NPM_CONFIG_OTP = process.env.NPM_CONFIG_OTP;

const findAndPublishAllBumpedPackages = () => {
  console.log('Traversing all packages inside /packages...');

  forEachPackage(
    (packageAbsolutePath, packageRelativePathFromRoot, packageManifest) => {
      if (packageManifest.private) {
        console.log(
          `\u23ED Skipping private package ${chalk.dim(packageManifest.name)}`,
        );

        return;
      }

      const diff = exec(
        `git log -p --format="" HEAD~1..HEAD ${packageRelativePathFromRoot}/package.json`,
        {cwd: ROOT_LOCATION, silent: true},
      ).stdout;

      const previousVersionPatternMatches = diff.match(
        /- {2}"version": "([0-9]+.[0-9]+.[0-9]+)"/,
      );

      if (!previousVersionPatternMatches) {
        console.log(
          `\uD83D\uDD0E No version bump for ${chalk.green(
            packageManifest.name,
          )}`,
        );

        return;
      }

      const [, previousVersion] = previousVersionPatternMatches;
      const nextVersion = packageManifest.version;

      console.log(
        `\uD83D\uDCA1 ${chalk.yellow(
          packageManifest.name,
        )} was updated: ${chalk.red(previousVersion)} -> ${chalk.green(
          nextVersion,
        )}`,
      );

      if (!nextVersion.startsWith('0.')) {
        throw new Error(
          `Package version expected to be 0.x.y, but received ${nextVersion}`,
        );
      }

      const npmOTPFlag = NPM_CONFIG_OTP ? `--otp ${NPM_CONFIG_OTP}` : '';

      const {code, stderr} = exec(`npm publish ${npmOTPFlag}`, {
        cwd: packageAbsolutePath,
        silent: true,
      });
      if (code) {
        console.log(
          chalk.red(
            `\u274c Failed to publish version ${nextVersion} of ${packageManifest.name}. Stderr:`,
          ),
        );
        console.log(stderr);

        process.exit(1);
      } else {
        console.log(
          `\u2705 Successfully published new version of ${chalk.green(
            packageManifest.name,
          )}`,
        );
      }
    },
  );

  process.exit(0);
};

findAndPublishAllBumpedPackages();
