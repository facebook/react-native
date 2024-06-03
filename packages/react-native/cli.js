#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {name, version: currentVersion} = require('./package.json');
const cli = require('@react-native-community/cli');
const chalk = require('chalk');
const {get} = require('https');
const {URL} = require('url');

const isNpxRuntime = process.env.npm_lifecycle_event === 'npx';
const isInitCommand = process.argv[2] === 'init';
const DEFAULT_REGISTRY_HOST =
  process.env.npm_config_registry ?? 'https://registry.npmjs.org/';
const HEAD = '1000.0.0';

async function getLatestVersion(registryHost = DEFAULT_REGISTRY_HOST) {
  return new Promise((res, rej) => {
    const url = new URL(registryHost);
    url.pathname = 'react-native/latest';
    get(url.toString(), resp => {
      const buffer = [];
      resp.on('data', data => buffer.push(data));
      resp.on('end', () => {
        try {
          res(JSON.parse(Buffer.concat(buffer).toString('utf8')).version);
        } catch (e) {
          rej(e);
        }
      });
    }).on('error', e => rej(e));
  });
}

/**
 * Warn when users are using `npx react-native init`, to raise awareness of the changes from RFC 0759.
 * @see https://github.com/react-native-community/discussions-and-proposals/tree/main/proposals/0759-react-native-frameworks.md
 */
function warnWhenRunningInit() {
  if (isInitCommand) {
    console.warn(
      `\nRunning: ${chalk.grey.bold('npx @react-native-community/cli init')}\n`,
    );
  }
}

/**
 * npx react-native -> @react-native-community/cli
 *
 * Will perform a version check and warning if you're not running the latest community cli when executed using npx. If
 * you know what you're doing, you can skip this check:
 *
 *  SKIP=true npx react-native ...
 *
 */
async function main() {
  if (
    isNpxRuntime &&
    !process.env.SKIP &&
    currentVersion !== HEAD &&
    isInitCommand
  ) {
    try {
      const latest = await getLatestVersion();
      if (latest !== currentVersion) {
        const msg = `
  ${chalk.bold.yellow('WARNING:')} You should run ${chalk.white.bold(
    'npx react-native@latest',
  )} to ensure you're always using the most current version of the CLI. NPX has cached version (${chalk.bold.yellow(
    currentVersion,
  )}) != current release (${chalk.bold.green(latest)})
  `;
        console.warn(msg);
      }
    } catch (_) {
      // Ignore errors, since it's a nice to have warning
    }
  }

  warnWhenRunningInit();

  return cli.run(name);
}

if (require.main === module) {
  main();
}

module.exports = cli;
