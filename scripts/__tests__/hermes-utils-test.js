/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as path from 'path';

const {
  configureMakeForPrebuiltHermesC,
  copyBuildScripts,
  copyPodSpec,
  downloadHermesTarball,
  expandHermesTarball,
  getHermesTagSHA,
  readHermesTag,
  setHermesTag,
  shouldUsePrebuiltHermesC,
} = require('../hermes/hermes-utils');

const hermesTag =
  'hermes-2022-04-28-RNv0.69.0-15d07c2edd29a4ea0b8f15ab0588a0c1adb1200f';
const tarballContents = 'dummy string';
const hermescContents = 'dummy string';
const hermesTagSha = '5244f819b2f3949ca94a3a1bf75d54a8ed59d94a';

const ROOT_DIR = path.normalize(path.join(__dirname, '..', '..'));
const SDKS_DIR = path.join(ROOT_DIR, 'sdks');

const MemoryFs = require('metro-memory-fs');

let execCalls;
let fs;

jest.mock('child_process', () => ({
  execSync: jest.fn(command => {
    if (command.startsWith('curl')) {
      fs.writeFileSync(
        path.join(SDKS_DIR, 'download', `hermes-${hermesTagSha}.tgz`),
        tarballContents,
      );
      execCalls.curl = true;
      return {code: 0};
    }

    if (command.startsWith('git')) {
      execCalls.git = true;
      return hermesTagSha + '\n';
    }

    if (command.startsWith('tar')) {
      fs.mkdirSync(path.join(SDKS_DIR, 'hermes', 'utils'), {
        recursive: true,
      });
      fs.writeFileSync(path.join(SDKS_DIR, 'hermes', `package.json`), '{}');
      execCalls.tar = true;
      return {code: 0};
    }
  }),
}));

function populateMockFilesystem() {
  fs.mkdirSync(path.join(SDKS_DIR, 'hermes-engine', 'utils'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(
      ROOT_DIR,
      'sdks',
      'hermes-engine',
      'utils',
      'build-apple-framework.sh',
    ),
    'Dummy file',
  );
  fs.writeFileSync(
    path.join(
      ROOT_DIR,
      'sdks',
      'hermes-engine',
      'utils',
      'build-ios-framework.sh',
    ),
    'Dummy file',
  );
  fs.writeFileSync(
    path.join(
      ROOT_DIR,
      'sdks',
      'hermes-engine',
      'utils',
      'build-mac-framework.sh',
    ),
    'Dummy file',
  );
  fs.writeFileSync(
    path.join(SDKS_DIR, 'hermes-engine', 'hermes-engine.podspec'),
    'Dummy file',
  );
}

describe('hermes-utils', () => {
  beforeEach(() => {
    jest.resetModules();

    jest.mock(
      'fs',
      () =>
        new MemoryFs({
          platform: process.platform === 'win32' ? 'win32' : 'posix',
        }),
    );
    fs = require('fs');
    fs.reset();

    populateMockFilesystem();

    execCalls = Object.create(null);
  });
  describe('readHermesTag', () => {
    it('should return main if .hermesversion does not exist', () => {
      expect(readHermesTag()).toEqual('main');
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
  describe('setHermesTag', () => {
    it('should write tag to .hermesversion file', () => {
      setHermesTag(hermesTag);
      expect(
        fs.readFileSync(path.join(SDKS_DIR, '.hermesversion'), {
          encoding: 'utf8',
          flag: 'r',
        }),
      ).toEqual(hermesTag);
    });
    it('should set Hermes tag and read it back', () => {
      setHermesTag(hermesTag);
      expect(readHermesTag()).toEqual(hermesTag);
    });
  });
  describe('getHermesTagSHA', () => {
    it('should return trimmed commit SHA for Hermes tag', () => {
      expect(getHermesTagSHA(hermesTag)).toEqual(hermesTagSha);
      expect(execCalls.git).toBe(true);
    });
  });
  describe('downloadHermesTarball', () => {
    it('should download Hermes tarball to download dir', () => {
      fs.writeFileSync(path.join(SDKS_DIR, '.hermesversion'), hermesTag);
      downloadHermesTarball();
      expect(execCalls.curl).toBe(true);
      expect(
        fs.readFileSync(
          path.join(SDKS_DIR, 'download', `hermes-${hermesTagSha}.tgz`),
          {
            encoding: 'utf8',
            flag: 'r',
          },
        ),
      ).toEqual(tarballContents);
    });
    it('should not re-download Hermes tarball if tarball exists', () => {
      fs.mkdirSync(path.join(SDKS_DIR, 'download'), {recursive: true});
      fs.writeFileSync(
        path.join(SDKS_DIR, 'download', `hermes-${hermesTagSha}.tgz`),
        tarballContents,
      );

      downloadHermesTarball();
      expect(execCalls.curl).toBeUndefined();
    });
  });
  describe('expandHermesTarball', () => {
    it('should expand Hermes tarball to Hermes source dir', () => {
      fs.mkdirSync(path.join(SDKS_DIR, 'download'), {recursive: true});
      fs.writeFileSync(
        path.join(SDKS_DIR, 'download', `hermes-${hermesTagSha}.tgz`),
        tarballContents,
      );
      expect(fs.existsSync(path.join(SDKS_DIR, 'hermes'))).toBeFalsy();
      expandHermesTarball();
      expect(execCalls.tar).toBe(true);
      expect(fs.existsSync(path.join(SDKS_DIR, 'hermes'))).toBe(true);
    });
    it('should fail if Hermes tarball does not exist', () => {
      expect(() => {
        expandHermesTarball();
      }).toThrow('[Hermes] Could not locate Hermes tarball.');
      expect(execCalls.tar).toBeUndefined();
    });
  });
  describe('copyBuildScripts', () => {
    it('should copy React Native Hermes build scripts to Hermes source directory', () => {
      copyBuildScripts();

      [
        'build-apple-framework.sh',
        'build-ios-framework.sh',
        'build-mac-framework.sh',
      ].forEach(buildScript => {
        expect(
          fs.readFileSync(
            path.join(ROOT_DIR, 'sdks', 'hermes', 'utils', buildScript),
            {
              encoding: 'utf8',
              flag: 'r',
            },
          ),
        ).toEqual(
          fs.readFileSync(
            path.join(ROOT_DIR, 'sdks', 'hermes-engine', 'utils', buildScript),
            {
              encoding: 'utf8',
              flag: 'r',
            },
          ),
        );
      });
    });
  });
  describe('copyPodSpec', () => {
    it('should copy React Native Hermes Podspec to Hermes source directory', () => {
      copyPodSpec();
      expect(
        fs.readFileSync(
          path.join(SDKS_DIR, 'hermes', 'hermes-engine.podspec'),
          {
            encoding: 'utf8',
            flag: 'r',
          },
        ),
      ).toEqual(
        fs.readFileSync(
          path.join(SDKS_DIR, 'hermes-engine', 'hermes-engine.podspec'),
          {
            encoding: 'utf8',
            flag: 'r',
          },
        ),
      );
    });
  });
  describe('shouldUsePrebuiltHermesC', () => {
    it('returns false if path to osx hermesc does not exist', () => {
      expect(shouldUsePrebuiltHermesC('macos')).toBeFalsy();
    });
    it('returns false for non-macOS', () => {
      expect(shouldUsePrebuiltHermesC('windows')).toBeFalsy();
    });
    it('return true only if path to hermesc exists', () => {
      fs.mkdirSync(path.join(SDKS_DIR, 'hermesc', 'osx-bin'), {
        recursive: true,
      });
      fs.writeFileSync(
        path.join(SDKS_DIR, 'hermesc', 'osx-bin', 'hermesc'),
        hermescContents,
      );
      expect(shouldUsePrebuiltHermesC('macos')).toBe(true);
    });
  });

  describe('configureMakeForPrebuiltHermesC', () => {
    it('creates ImportHermesC file', () => {
      fs.mkdirSync(path.join(SDKS_DIR, 'hermesc', 'osx-bin'), {
        recursive: true,
      });
      configureMakeForPrebuiltHermesC();
      expect(
        fs.existsSync(
          path.join(SDKS_DIR, 'hermesc', 'osx-bin', 'ImportHermesc.cmake'),
        ),
      ).toBe(true);
    });
  });
});
