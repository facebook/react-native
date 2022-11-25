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
const fs = require('fs');
const path = require('path');

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

function readPackageJSON(pathToPackage) {
  return JSON.parse(fs.readFileSync(path.join(pathToPackage, 'package.json')));
}

function install() {
  const yarnWorkspacesStdout = execSync('yarn --json workspaces info', {
    cwd: reactNativeRootPath,
    encoding: 'utf8',
  });
  const packages = JSON.parse(JSON.parse(yarnWorkspacesStdout).data);

  const VERDACCIO_PID = setupVerdaccio(
    reactNativeRootPath,
    VERDACCIO_CONFIG_PATH,
  );
  process.stdout.write('Bootstrapped Verdaccio \u2705\n');

  process.stdout.write('Starting to publish all the packages...\n');
  Object.entries(packages).forEach(([packageName, packageEntity]) => {
    const packageRelativePath = packageEntity.location;
    const packageAbsolutePath = `${reactNativeRootPath}/${packageRelativePath}`;

    const packageManifest = readPackageJSON(packageAbsolutePath);
    if (packageManifest.private) {
      return;
    }

    execSync('npm publish --registry http://localhost:4873 --access public', {
      cwd: `${reactNativeRootPath}/${packageEntity.location}`,
      stdio: [process.stdin, process.stdout, process.stderr],
    });

    process.stdout.write(`Published ${packageName} to proxy \u2705\n`);
  });
  process.stdout.write('Published all packages \u2705\n');

  execSync(
    `node cli.js init ${templateName} --directory ${directory} --template ${templateConfigPath} --verbose --skip-install`,
    {
      cwd: reactNativeRootPath,
      stdio: [process.stdin, process.stdout, process.stderr],
    },
  );
  process.stdout.write('Completed initialization of template app \u2705\n');

  process.stdout.write('Installing dependencies in template app folder...\n');
  spawnSync('yarn', ['install'], {
    cwd: directory,
    stdio: [process.stdin, process.stdout, process.stderr],
  });
  process.stdout.write('Installed dependencies via Yarn \u2705\n');

  process.stdout.write(`Killing verdaccio. PID — ${VERDACCIO_PID}...\n`);
  execSync(`kill -9 ${VERDACCIO_PID}`);
  process.stdout.write('Killed Verdaccio process \u2705\n');

  process.exit();
}

install();
