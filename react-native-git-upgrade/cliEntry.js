/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const shell = require('shelljs');
const Promise = require('promise');
const yeoman = require('yeoman-environment');
const TerminalAdapter = require('yeoman-environment/lib/adapter');
const log = require('npmlog');
const rimraf = require('rimraf');
const semver = require('semver');

const {
  checkDeclaredVersion,
  checkMatchingVersions,
  checkReactPeerDependency,
  checkGitAvailable,
  checkNewVersion
} = require('./checks');

log.heading = 'git-upgrade';

/**
 * Promisify the callback-based shelljs function exec
 * @param command
 * @param logOutput
 * @returns {Promise}
 */
function exec(command, logOutput) {
  return new Promise((resolve, reject) => {
    let stderr, stdout = '';
    const child = shell.exec(command, {async: true, silent: true});

    child.stdout.on('data', data => {
      stdout += data;
      if (logOutput) {
        process.stdout.write(data);
      }
    });

    child.stderr.on('data', data => {
      stderr += data;
      process.stderr.write(data);
    });

    child.on('exit', code => {
      (code === 0)
        ? resolve(stdout)
        : reject(new Error(`Command '${command}' exited with code ${code}:
stderr: ${stderr}
stdout: ${stdout}`));
    });
  })
}

function readPackageFiles() {
  const rnPakPath = path.resolve(
    process.cwd(),
    'node_modules',
    'react-native',
    'package.json'
  );

  const pakPath = path.resolve(
    process.cwd(),
    'package.json'
  );

  try {
    const rnPak = JSON.parse(fs.readFileSync(rnPakPath, 'utf8'));
    const pak = JSON.parse(fs.readFileSync(pakPath, 'utf8'));

    return {rnPak, pak};
  } catch (err) {
    throw new Error(
      'Unable to find "' + pakPath + '" or "' + rnPakPath + '". Make sure that you have run ' +
      '"npm install" and that you are inside a React Native project.'
    )
  }
}


function setupWorkingDir(tmpDir) {
  return new Promise((resolve, reject) => {
    rimraf(tmpDir, err => {
      if (err) {
        reject(err);
      } else {
        fs.mkdirSync(tmpDir);
        resolve();
      }
    });
  });
}

function configureGitEnv(tmpDir) {
  /*
   * The workflow inits a temporary Git repository. We don't want to interfere
   * with an existing user's Git repository.
   * Thanks to Git env vars, we could address an different directory from the
   * default ".git". See https://git-scm.com/book/tr/v2/Git-Internals-Environment-Variables
   */
  process.env.GIT_DIR = path.resolve(tmpDir, '.gitrn');
  process.env.GIT_WORK_TREE = '.';
}

function generateTemplates(generatorDir, appName, verbose) {
  try {
    const yeomanGeneratorEntryPoint = path.resolve(generatorDir, 'index.js');
    // Try requiring the index.js (entry-point of Yeoman generators)
    fs.accessSync(yeomanGeneratorEntryPoint);
    return runYeomanGenerators(generatorDir, appName, verbose);
  } catch(err) {
    return runCopyAndReplace(generatorDir, appName);
  }
}

function runCopyAndReplace(generatorDir, appName) {
  const copyProjectTemplateAndReplacePath = path.resolve(generatorDir, 'copyProjectTemplateAndReplace');
  /*
   * This module is required twice during the process: for both old and new version
   * of React Native.
   * This file could have changed between these 2 versions. When generating the new template,
   * we don't want to load the old version of the generator from the cache
   */
  delete require.cache[copyProjectTemplateAndReplacePath];
  const copyProjectTemplateAndReplace = require(copyProjectTemplateAndReplacePath);
  copyProjectTemplateAndReplace(
    path.resolve(generatorDir, '..', 'templates', 'HelloWorld'),
    process.cwd(),
    appName,
    {upgrade: true, force: true}
  );
}

function runYeomanGenerators(generatorDir, appName, verbose) {
  if (!verbose) {
    // Yeoman output needs monkey-patching (no silent option)
    TerminalAdapter.prototype.log = () => {};
    TerminalAdapter.prototype.log.force = () => {};
    TerminalAdapter.prototype.log.create = () => {};
  }

  const env = yeoman.createEnv();
  env.register(generatorDir, 'react:app');
  const generatorArgs = ['react:app', appName];
  return new Promise((resolve) => env.run(generatorArgs, {upgrade: true, force: true}, resolve));
}

/**
 * If there's a newer version of react-native-git-upgrade in npm, suggest to the user to upgrade.
 */
async function checkForUpdates() {
  try {
    log.info('Check for react-native-git-upgrade updates');
    const lastGitUpgradeVersion = await exec('npm view react-native-git-upgrade@latest version');
    const current = require('./package').version;
    const latest = semver.clean(lastGitUpgradeVersion);
    if (semver.gt(latest, current)) {
      log.warn(
        'A more recent version of "react-native-git-upgrade" has been found.\n' +
        `Current: ${current}\n` +
        `Latest: ${latest}\n` +
        'Please run "npm install -g react-native-git-upgrade"'
      );
    }
  } catch (err) {
    log.warn('Check for latest version failed', err.message);
  }
}

async function run(requiredVersion, cliArgs) {
  const context = {
    tmpDir: path.resolve(os.tmpdir(), 'react-native-git-upgrade'),
    generatorDir: path.resolve(process.cwd(), 'node_modules', 'react-native', 'local-cli', 'generator'),
    requiredVersion,
    cliArgs,
  };

  try {
    await checkForUpdates();

    log.info('Read package.json files');
    const {rnPak, pak} = readPackageFiles();
    context.appName = pak.name;
    context.currentVersion = rnPak.version;
    context.declaredVersion = pak.dependencies['react-native'];
    context.declaredReactVersion = pak.dependencies.react;

    const verbose = context.cliArgs.verbose;

    log.info('Check declared version');
    checkDeclaredVersion(context.declaredVersion);

    log.info('Check matching versions');
    checkMatchingVersions(context.currentVersion, context.declaredVersion);

    log.info('Check React peer dependency');
    checkReactPeerDependency(context.currentVersion, context.declaredReactVersion);

    log.info('Check Git installation');
    checkGitAvailable();

    log.info('Get react-native version from NPM registry');
    const versionOutput = await exec('npm view react-native@' + (context.requiredVersion || 'latest') + ' version', verbose);
    context.newVersion = semver.clean(versionOutput);

    log.info('Check new version');
    checkNewVersion(context.newVersion, context.requiredVersion);

    log.info('Setup temporary working directory');
    await setupWorkingDir(context.tmpDir);

    log.info('Configure Git environment');
    configureGitEnv(context.tmpDir);

    log.info('Init Git repository');
    await exec('git init', verbose);

    log.info('Add all files to commit');
    await exec('git add .', verbose);

    log.info('Commit pristine sources');
    await exec('git commit -m "Project snapshot"', verbose);

    log.info ('Create a tag before updating sources');
    await exec('git tag project-snapshot', verbose);
    context.sourcesUpdated = true;

    log.info('Generate old version template');
    await generateTemplates(context.generatorDir, context.appName, verbose);

    log.info('Add updated files to commit');
    await exec('git add .', verbose);

    log.info('Commit old version template');
    await exec('git commit -m "Old version" --allow-empty', verbose);

    log.info('Install the new version');
    await exec('npm install --save react-native@' + context.newVersion + ' --color=always', verbose);

    log.info('Generate new version template');
    await generateTemplates(context.generatorDir, context.appName, verbose);

    log.info('Add updated files to commit');
    await exec('git add .', verbose);

    log.info('Commit new version template');
    await exec('git commit -m "New version" --allow-empty', verbose);

    log.info('Generate the patch between the 2 versions');
    const diffOutput = await exec('git diff HEAD~1 HEAD', verbose);

    log.info('Save the patch in temp directory');
    context.patchPath = path.resolve(context.tmpDir, `upgrade_${context.currentVersion}_${context.newVersion}.patch`);
    fs.writeFileSync(context.patchPath, diffOutput);

    log.info('Reset the 2 temporary commits');
    await exec('git reset HEAD~2 --hard', verbose);

    try {
      log.info('Apply the patch');
      await exec(`git apply --3way ${context.patchPath}`, true);
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
      await exec('git checkout project-snapshot', true);
    }
  }
}

module.exports = {
  run: run,
};
