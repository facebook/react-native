/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

import fs from 'fs';
import os from 'os';
import path from 'path';
import shell from 'shelljs';
import Promise from 'promise';
import yeoman from 'yeoman-environment';
import TerminalAdapter from 'yeoman-environment/lib/adapter'
import log from 'npmlog';
import rimraf from 'rimraf';

import {
  checkDeclaredVersion,
  checkMatchingVersions,
  checkReactPeerDependency,
  checkGitAvailable,
  checkNewVersion
} from './checks';

/**
 * Promisify the callback-based shelljs function exec
 * @param command
 * @param opts
 * @returns {Promise}
 */
function exec(context, command, forceOutput) {
  return new Promise((resolve, reject) => {
    shell.exec(command, {silent: (forceOutput ? !forceOutput : !context.cliArgs.verbose)}, (code, stdout, stderr) => {
      code
        ? reject(new Error(`Command '${command}' exited with code ${code}:
stderr: ${stderr}
stdout: ${stdout}`))
        : resolve(stdout);
    });
  });
}

function setupWorkingDir(context) {
  return new Promise((resolve, reject) => {
    rimraf(context.tmpDir, err => {
      if (err) {
        reject(err);
      } else {
        fs.mkdirSync(context.tmpDir);
        resolve()
      }
    });
  });
}

function configureGitEnv(context) {
  process.env.GIT_DIR = path.resolve(context.tmpDir, '.gitrn');
  process.env.GIT_WORK_TREE = '.';
}

function runYeomanGenerators(context) {
  if (!context.cliArgs.verbose) {
    // Yeoman output needs monkey-patching (no silent option)
    TerminalAdapter.prototype.log = () => {};
    TerminalAdapter.prototype.log.force = () => {};
  }

  const env = yeoman.createEnv();
  const generatorPath = path.join(process.cwd(), 'node_modules', 'react-native', 'local-cli', 'generator');
  env.register(generatorPath, 'react:app');
  const generatorArgs = ['react:app', context.appName].concat(context.cliArgs._);
  return new Promise((resolve) => env.run(generatorArgs, {upgrade: true, force: true}, resolve));
}

async function run(cliVersion, cliArgs) {
  const installed = JSON.parse(fs.readFileSync('node_modules/react-native/package.json', 'utf8'));
  const pak = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const context = {
    appName: pak.name,
    currentVersion: installed.version,
    declaredVersion: pak.dependencies['react-native'],
    declaredReactVersion: pak.dependencies.react,
    tmpDir: path.resolve(os.tmpdir(), 'react-native-upgrader'),
    cliVersion,
    cliArgs
  };

  log.heading = 'upgrader';

  try {
    log.info('Check declared version...');
    checkDeclaredVersion(context);

    log.info('Check matching versions');
    checkMatchingVersions(context);

    log.info('Check React peer dependency');
    checkReactPeerDependency(context);

    log.info('Check Git installation');
    checkGitAvailable();

    log.info('Get react-native version from NPM registry');
    const versionOutput = await exec(context, 'npm view react-native@' + (context.cliVersion || 'latest') + ' version');

    log.info('Check new version');
    context.newVersion = checkNewVersion(context, versionOutput);

    log.info('Setup temporary working directory');
    await setupWorkingDir(context);

    log.info('Configure Git environment');
    configureGitEnv(context);

    log.info('Init Git repository');
    await exec(context, 'git init');

    log.info('Add all files to commit');
    await exec(context, 'git add .');

    log.info('Commit pristine sources');
    await exec(context, 'git commit -m "Project snapshot"');

    log.info ('Create a tag before updating sources');
    await exec(context, 'git tag project-snapshot');
    context.sourcesUpdated = true;

    log.info('Generate old version template');
    await runYeomanGenerators(context);

    log.info('Add updated files to commit');
    await exec(context, 'git add .');

    log.info('Commit old version template');
    await exec(context, 'git commit -m "Old version" --allow-empty');

    log.info('Install the new version');
    await exec(context, 'npm install --save react-native@' + context.newVersion);

    log.info('Generate new version template');
    await runYeomanGenerators(context);

    log.info('Add updated files to commit');
    await exec(context, 'git add .');

    log.info('Commit new version template');
    await exec(context, 'git commit -m "New version" --allow-empty');

    log.info('Generate the patch between the 2 versions');
    const diffOutput = await exec(context, 'git diff HEAD~1 HEAD');

    log.info('Write the patch on filesystem');
    context.patchPath = path.resolve(context.tmpDir, `upgrade_${context.currentVersion}_${context.newVersion}.patch`);
    fs.writeFileSync(context.patchPath, diffOutput);

    log.info('Reset the 2 temporary commits');
    await exec(context, 'git reset HEAD~2 --hard');

    try {
      log.info('Apply the patch');
      await exec(context, `git apply --3way ${context.patchPath}`, true);
    } catch (err) {
      log.warn('The upgrade process succeeded but you may have conflicts to solve');
    } finally {
      log.info('Upgrade done');
      if (context.cliArgs.verbose) {
        log.info(`Temporary working directory: ${context.tmpDir}`);
      }
    }

  } catch (err) {
    log.error('An error occurred during upgrade:');
    log.error(err.stack);
    if (context.sourcesUpdated) {
      log.error('Restore initial sources');
      await exec(context, 'git checkout project-snapshot', true);
    }
  }
}

module.exports = {
  run: run,
};
