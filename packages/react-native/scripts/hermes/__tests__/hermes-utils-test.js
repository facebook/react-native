/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as path from 'path';

const {
  readHermesTag,
  readHermesV1Tag,
  setHermesTag,
} = require('../hermes-utils');
// $FlowFixMe[untyped-import] (OSS) memfs
const {memfs} = require('memfs');

const hermesTag =
  'hermes-2022-04-28-RNv0.69.0-15d07c2edd29a4ea0b8f15ab0588a0c1adb1200f';
const hermesV1Tag = '250829098.0.0';
const ROOT_DIR = path.normalize(path.join(__dirname, '../../..'));
const SDKS_DIR = path.join(ROOT_DIR, 'sdks');

let fs: $FlowFixMe;

describe('hermes-utils', () => {
  beforeEach(() => {
    jest.resetModules();

    jest.mock('fs', () => memfs().fs);
    fs = require('fs');

    fs.mkdirSync(SDKS_DIR, {
      recursive: true,
    });

    // Silence logs.
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  describe('Versioning Hermes', () => {
    describe('readHermesTag', () => {
      it('should throw if .hermesversion does not exist', () => {
        expect(() => {
          readHermesTag();
        }).toThrow('[Hermes] .hermesversion does not exist.');
      });
      it('should fail if hermes tag is empty', () => {
        fs.writeFileSync(path.join(SDKS_DIR, '.hermesversion'), '');
        expect(() => {
          readHermesTag();
        }).toThrow('[Hermes] .hermesversion file is empty.');
      });
      it('should return tag from .hermesversion if file exists', () => {
        fs.writeFileSync(path.join(SDKS_DIR, '.hermesversion'), hermesTag);
        expect(readHermesTag()).toEqual(hermesTag);
      });
    });

    describe('readHermesV1Tag', () => {
      it('should throw if .hermesv1version does not exist', () => {
        expect(() => {
          readHermesV1Tag();
        }).toThrow('[Hermes] .hermesv1version does not exist.');
      });
      it('should fail if hermes v1 tag is empty', () => {
        fs.writeFileSync(path.join(SDKS_DIR, '.hermesv1version'), '');
        expect(() => {
          readHermesV1Tag();
        }).toThrow('[Hermes] .hermesv1version file is empty.');
      });
      it('should return tag from .hermesv1version if file exists', () => {
        fs.writeFileSync(path.join(SDKS_DIR, '.hermesv1version'), hermesV1Tag);
        expect(readHermesV1Tag()).toEqual(hermesV1Tag);
      });
    });

    describe('setHermesTag', () => {
      it('should write tag to .hermesversion file', async () => {
        await setHermesTag(hermesTag, hermesV1Tag);
        expect(
          fs.readFileSync(path.join(SDKS_DIR, '.hermesversion'), {
            encoding: 'utf8',
            flag: 'r',
          }),
        ).toEqual(hermesTag);

        expect(
          fs.readFileSync(path.join(SDKS_DIR, '.hermesv1version'), {
            encoding: 'utf8',
            flag: 'r',
          }),
        ).toEqual(hermesV1Tag);
      });
      it('should set Hermes tag and read it back', async () => {
        await setHermesTag(hermesTag, hermesV1Tag);
        expect(readHermesTag()).toEqual(hermesTag);
        expect(readHermesV1Tag()).toEqual(hermesV1Tag);
      });
    });
  });
});
