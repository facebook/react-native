/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const yargs = require('yargs');
const {execSync, spawnSync} = require('child_process');

const forEachPackage = require('../monorepo/for-each-package');
const setupVerdaccio = require('../setup-verdaccio');

const {argv} = yargs
  .option('r', {
    alias: 'reactNativeRootPath',
    describe: 'Path to root folder of react-native',
    required: true,
  })
  .option('n', {
    alias: 'templateName',
    describe: 'Template App name',
    required: true,
  })
  .option('tcp', {
    alias: 'templateConfigPath',
    describe: 'Path to folder containing template config',
    required: true,
  })
  .option('d', {
    alias: 'directory',
    describe: 'Path to template application folder',
    required: true,
  })
  .strict();

const {reactNativeRootPath, templateName, templateConfigPath, directory} = argv;

const VERDACCIO_CONFIG_PATH = `${reactNativeRootPath}/.circleci/verdaccio.yml`;
const MAX_ATTEMPT = 5;
const RETRY_ATTEMPT = 500;

function installYarn() {
  for (let attempt = 1; attempt < MAX_ATTEMPT; attempt++) {
    const result = spawnSync('yarn', ['install'], {
      cwd: directory,
      stdio: [process.stdin, process.stdout, process.stderr],
    });
    if (result.status === 0) {
      break;
    }
    if (attempt >= MAX_ATTEMPT) {
      logError(`Failed to install yarn after ${MAX_ATTEMPT} tries`);
      process.exit(1);
    }

    setTimeout(
      logError(
        `Retyring installation of yarn after ${MAX_ARETRY_ATTEMPTTTEMPT} ms.`,
      ),
      RETRY_ATTEMPT,
    );
  }
}

function install() {
  const VERDACCIO_PID = setupVerdaccio(
    reactNativeRootPath,
    VERDACCIO_CONFIG_PATH,
  );
  process.stdout.write('Bootstrapped Verdaccio \u2705\n');

  process.stdout.write('Starting to publish every package...\n');
  forEachPackage(
    (packageAbsolutePath, packageRelativePathFromRoot, packageManifest) => {
      if (packageManifest.private) {
        return;
      }

      execSync('npm publish --registry http://localhost:4873 --access public', {
        cwd: packageAbsolutePath,
        stdio: [process.stdin, process.stdout, process.stderr],
      });

      process.stdout.write(
        `Published ${packageManifest.name} to proxy \u2705\n`,
      );
    },
  );

  process.stdout.write('Published every package \u2705\n');

  execSync(
    `node cli.js init ${templateName} --directory ${directory} --template ${templateConfigPath} --verbose --skip-install`,
    {
      cwd: `${reactNativeRootPath}/packages/react-native`,
      stdio: [process.stdin, process.stdout, process.stderr],
    },
  );
  process.stdout.write('Completed initialization of template app \u2705\n');

  process.stdout.write('Installing dependencies in template app folder...\n');
  installYarn();

  process.stdout.write('Installed dependencies via Yarn \u2705\n');

  process.stdout.write(`Killing verdaccio. PID — ${VERDACCIO_PID}...\n`);
  execSync(`kill -9 ${VERDACCIO_PID}`);
  process.stdout.write('Killed Verdaccio process \u2705\n');

  process.exit();
}

install();
