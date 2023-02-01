#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * This script walks a releaser through bumping the Hermes version for a release.
 * It needs be executed on a release branch.
 */
import {exit} from 'shelljs';
import yargs from 'yargs';
import inquirer from 'inquirer';
import {setHermesTag} from './hermes-utils';

const argv = yargs
  .option('tag', {
    alias: 't',
    type: 'string',
    describe:
      'Hermes release tag to use for this React Native release, ex. hermes-2022-02-21-RNv0.68.0',
    required: true,
  })
  .parseSync();

async function main() {
  const {tag: hermesTag} = argv;

  const {confirmHermesTag} = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmHermesTag',
    message: `Do you want to use the Hermes release tagged "${hermesTag}"?`,
  });

  if (!confirmHermesTag) {
    console.log('Aborting.');
    return;
  }

  setHermesTag(hermesTag);
}

main().then(() => {
  exit(0);
});
