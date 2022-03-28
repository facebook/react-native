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

/**
 * This script walks a releaser through bumping the Hermes version for a release.
 */
const {exit} = require('shelljs');
const yargs = require('yargs');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

const HERMES_TAG_FILE_DIR = 'sdks';
const HERMES_TAG_FILE_PATH = `${HERMES_TAG_FILE_DIR}/.hermesversion`;

let argv = yargs.option('t', {
  alias: 'tag',
  describe:
    'Hermes release tag to use for this React Native release, ex. hermes-2022-02-21-RNv0.68.0',
  required: true,
}).argv;

function readHermesTag() {
  if (fs.existsSync(path)) {
    const data = fs.readFileSync(HERMES_TAG_FILE_PATH, {
      encoding: 'utf8',
      flag: 'r',
    });
    return data.trim();
  } else {
    return '';
  }
}

function setHermesTag(hermesTag) {
  if (readHermesTag() === hermesTag) {
    // No need to update.
    return;
  }

  if (!fs.existsSync(HERMES_TAG_FILE_DIR)) {
    fs.mkdirSync(HERMES_TAG_FILE_DIR, {recursive: true});
  }

  fs.writeFileSync(HERMES_TAG_FILE_PATH, hermesTag.trim());
  console.log('Hermes tag has been updated. Please commit your changes.');
}

async function main() {
  const hermesTag = argv.tag;
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
