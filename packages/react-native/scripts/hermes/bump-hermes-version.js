#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {setHermesTag} = require('./hermes-utils');
// $FlowFixMe[untyped-import]
const inquirer = require('inquirer');
/**
 * This script walks a releaser through bumping the Hermes version for a release.
 * It needs be executed on a release branch.
 */
const {exit} = require('shelljs');
const yargs = require('yargs');

let argv = yargs
  .option('t', {
    alias: 'tag',
    describe:
      'Hermes release tag to use for this React Native release, ex. hermes-2022-02-21-RNv0.68.0',
    required: true,
  })
  .option('s', {
    alias: 'v1Tag',
    describe:
      'Hermes V1 release tag to use for this React Native release, ex. 250829098.0.0',
    required: true,
  }).argv;

async function main() {
  // $FlowFixMe[prop-missing]
  const hermesTag = argv.tag;
  // $FlowFixMe[prop-missing]
  const hermesV1Tag = argv.v1Tag;
  const {confirmHermesTag} = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmHermesTag',
    message: `Do you want to use the Hermes release tagged "${hermesTag}" and Hermes V1 release tagged "${hermesV1Tag}"?`,
  });

  if (!confirmHermesTag) {
    console.log('Aborting.');
    return;
  }

  setHermesTag(hermesTag, hermesV1Tag);
}

void main().then(() => {
  exit(0);
});
