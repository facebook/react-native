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

const fs = require('fs');
// $FlowFixMe[untyped-import]
const inquirer = require('inquirer');
const path = require('path');

/*::
type BuildType = 'dry-run' | 'release' | 'nightly';
*/

const SDKS_DIR = path.normalize(path.join(__dirname, '..', '..', 'sdks'));
const HERMES_TAG_FILE_PATH = path.join(SDKS_DIR, '.hermesversion');
const HERMES_V1_TAG_FILE_PATH = path.join(SDKS_DIR, '.hermesv1version');

function readHermesTag() /*: string */ {
  if (fs.existsSync(HERMES_TAG_FILE_PATH)) {
    const data = fs
      .readFileSync(HERMES_TAG_FILE_PATH, {
        encoding: 'utf8',
        flag: 'r',
      })
      .trim();

    if (data.length > 0) {
      return data;
    } else {
      throw new Error('[Hermes] .hermesversion file is empty.');
    }
  }

  throw new Error('[Hermes] .hermesversion does not exist.');
}

function readHermesV1Tag() /*: string */ {
  if (fs.existsSync(HERMES_V1_TAG_FILE_PATH)) {
    const data = fs
      .readFileSync(HERMES_V1_TAG_FILE_PATH, {
        encoding: 'utf8',
        flag: 'r',
      })
      .trim();

    if (data.length > 0) {
      return data;
    } else {
      throw new Error('[Hermes] .hermesv1version file is empty.');
    }
  }

  throw new Error('[Hermes] .hermesv1version does not exist.');
}

async function updateHermesTag(
  tagFile /*: string */,
  hermesTag /*: string */,
  prompt /*: string */,
) {
  if (!fs.existsSync(tagFile)) {
    fs.writeFileSync(tagFile, hermesTag.trim());
  } else {
    const previousHermesTag = fs.readFileSync(tagFile, {
      encoding: 'utf8',
      flag: 'r',
    });

    if (previousHermesTag.trim() !== hermesTag.trim()) {
      const {confirmHermesTag} = await inquirer.prompt({
        type: 'confirm',
        name: 'confirmHermesTag',
        message: `Do you want to use updtate release tag for ${prompt} from "${previousHermesTag}" to "${hermesTag}"?`,
      });

      if (confirmHermesTag) {
        fs.writeFileSync(tagFile, hermesTag.trim());
      } else {
        console.log(`[${prompt}] .hermesversion file is unchanged.`);
      }
    } else {
      console.log(`[${prompt}] .hermesversion file is unchanged.`);
    }
  }
}

async function setHermesTag(
  hermesTag /*: string */,
  hermesV1Tag /*: string */,
) {
  if (!fs.existsSync(SDKS_DIR)) {
    fs.mkdirSync(SDKS_DIR, {recursive: true});
  }

  await updateHermesTag(HERMES_TAG_FILE_PATH, hermesTag, 'Hermes');
  await updateHermesTag(HERMES_V1_TAG_FILE_PATH, hermesV1Tag, 'Hermes V1');
}

module.exports = {
  readHermesTag,
  readHermesV1Tag,
  setHermesTag,
};
