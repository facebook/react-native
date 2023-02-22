/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use-strict';

const {parseArgs, filterJSFile} = require('../combine-utils.js');

describe('parseArgs', () => {
  const nodeBin = 'node';
  const combineApp = 'app';
  const schemaJson = 'schema.json';
  const specFile1 = 'NativeSpec.js';
  const specFile2 = 'SpecNativeComponent.js';

  describe('when no platform provided', () => {
    it('returns null platform, schema and fileList', () => {
      const {platform, outfile, fileList} = parseArgs([
        nodeBin,
        combineApp,
        schemaJson,
        specFile1,
        specFile2,
      ]);

      expect(platform).toBeNull();
      expect(outfile).toBe(schemaJson);
      expect(fileList).toStrictEqual([specFile1, specFile2]);
    });
  });

  describe('when platform passed with --platform', () => {
    it('returns the platform, the schema and the fileList', () => {
      const {platform, outfile, fileList} = parseArgs([
        nodeBin,
        combineApp,
        '--platform',
        'ios',
        schemaJson,
        specFile1,
        specFile2,
      ]);

      expect(platform).toBe('ios');
      expect(outfile).toBe(schemaJson);
      expect(fileList).toStrictEqual([specFile1, specFile2]);
    });
  });

  describe('when platform passed with -p', () => {
    it('returns the platform, the schema and the fileList', () => {
      const {platform, outfile, fileList} = parseArgs([
        nodeBin,
        combineApp,
        '-p',
        'android',
        schemaJson,
        specFile1,
        specFile2,
      ]);

      expect(platform).toBe('android');
      expect(outfile).toBe(schemaJson);
      expect(fileList).toStrictEqual([specFile1, specFile2]);
    });
  });
});

describe('filterJSFile', () => {
  describe('When the file is not a Spec file', () => {
    it('when no platform is passed, return false', () => {
      const file = 'anyJSFile.js';
      const result = filterJSFile(file);
      expect(result).toBeFalsy();
    });

    it('when ios is passed and the file is iOS specific, return false', () => {
      const file = 'anyJSFile.ios.js';
      const result = filterJSFile(file);
      expect(result).toBeFalsy();
    });

    it('when android is passed and the file is android specific, return false', () => {
      const file = 'anyJSFile.android.js';
      const result = filterJSFile(file);
      expect(result).toBeFalsy();
    });
  });

  describe('When the file is NativeUIManager', () => {
    it('returns false', () => {
      const file = 'NativeUIManager.js';
      const result = filterJSFile(file);
      expect(result).toBeFalsy();
    });
  });

  describe('When the file is NativeSampleTurboModule', () => {
    it('returns false', () => {
      const file = 'NativeSampleTurboModule.js';
      const result = filterJSFile(file);
      expect(result).toBeFalsy();
    });
  });

  describe('When the file is a test file', () => {
    it('returns false', () => {
      const file = '__tests__/NativeModule-test.js';
      const result = filterJSFile(file);
      expect(result).toBeFalsy();
    });
  });

  describe('When the file is a TS type def', () => {
    it('returns false', () => {
      const file = 'NativeModule.d.ts';
      const result = filterJSFile(file);
      expect(result).toBeFalsy();
    });
  });

  describe('When the file is valid and it is platform agnostic', () => {
    const file = 'NativeModule.js';
    it('if the platform is null, returns true', () => {
      const result = filterJSFile(file);
      expect(result).toBeTruthy();
    });
    it('if the platform is ios, returns true', () => {
      const result = filterJSFile(file, 'ios');
      expect(result).toBeTruthy();
    });
    it('if the platform is android, returns true', () => {
      const result = filterJSFile(file, 'android');
      expect(result).toBeTruthy();
    });
    it('if the platform is windows, returns false', () => {
      const result = filterJSFile(file, 'windows');
      expect(result).toBeTruthy();
    });
  });

  describe('When the file is valid and it is iOS specific', () => {
    const file = 'MySampleNativeComponent.ios.js';
    it('if the platform is null, returns false', () => {
      const result = filterJSFile(file);
      expect(result).toBeFalsy();
    });
    it('if the platform is ios, returns true', () => {
      const result = filterJSFile(file, 'ios');
      expect(result).toBeTruthy();
    });
    it('if the platform is android, returns false', () => {
      const result = filterJSFile(file, 'android');
      expect(result).toBeFalsy();
    });
    it('if the platform is windows, returns false', () => {
      const result = filterJSFile(file, 'windows');
      expect(result).toBeFalsy();
    });
  });

  describe('When the file is valid and it is Android specific', () => {
    const file = 'MySampleNativeComponent.android.js';
    it('if the platform is null, returns false', () => {
      const result = filterJSFile(file);
      expect(result).toBeFalsy();
    });
    it('if the platform is ios, returns false', () => {
      const result = filterJSFile(file, 'ios');
      expect(result).toBeFalsy();
    });
    it('if the platform is android, returns true', () => {
      const result = filterJSFile(file, 'android');
      expect(result).toBeTruthy();
    });
    it('if the platform is windows, returns false', () => {
      const result = filterJSFile(file, 'windows');
      expect(result).toBeFalsy();
    });
  });

  describe('When the file is valid and it is Windows specific', () => {
    const file = 'MySampleNativeComponent.windows.js';
    it('if the platform is null, returns false', () => {
      const result = filterJSFile(file);
      expect(result).toBeFalsy();
    });
    it('if the platform is ios, returns false', () => {
      const result = filterJSFile(file, 'ios');
      expect(result).toBeFalsy();
    });
    it('if the platform is android, returns false', () => {
      const result = filterJSFile(file, 'android');
      expect(result).toBeFalsy();
    });
    it('if the platform is windows, returns true', () => {
      const result = filterJSFile(file, 'windows');
      expect(result).toBeTruthy();
    });
  });
});
