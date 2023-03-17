/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as path from 'path';

const os = require('os');

const {
  configureMakeForPrebuiltHermesC,
  copyBuildScripts,
  copyPodSpec,
  createHermesPrebuiltArtifactsTarball,
  createTarballFromDirectory,
  downloadHermesSourceTarball,
  expandHermesSourceTarball,
  getHermesTarballDownloadPath,
  getHermesPrebuiltArtifactsTarballName,
  getHermesTagSHA,
  readHermesTag,
  setHermesTag,
  shouldUsePrebuiltHermesC,
} = require('../hermes-utils');

const hermesTag =
  'hermes-2022-04-28-RNv0.69.0-15d07c2edd29a4ea0b8f15ab0588a0c1adb1200f';
const tarballContents = 'dummy string';
const hermescContents = 'dummy string';
const hermesTagSha = '5244f819b2f3949ca94a3a1bf75d54a8ed59d94a';

const ROOT_DIR = path.normalize(path.join(__dirname, '../../..'));
const SDKS_DIR = path.join(ROOT_DIR, 'sdks');

const MemoryFs = require('metro-memory-fs');

let execCalls, spawnCalls;
let fs;

jest.mock('child_process', () => ({
  execSync: jest.fn((command, options) => {
    // git is used in getHermesTagSHA to obtain the commit sha for the latest commit to Hermes main
    if (command.startsWith('git')) {
      execCalls.git = true;
      return hermesTagSha + '\n';
    }
  }),
  spawnSync: jest.fn((command, args, options) => {
    // curl is used in downloadHermesSourceTarball to fetch the source code from github.com/facebook/hermes for a specific Hermes commit sha
    if (command === 'curl') {
      const downloadPath = args[2];
      fs.writeFileSync(downloadPath, tarballContents);
      spawnCalls.curl = true;
      return {code: 0};
    }

    // tar is used in createTarballFromDirectory
    if (command === 'tar') {
      spawnCalls.tar = true;

      if (args[0] === '-zxf') {
        // We are expanding the tarball
        fs.mkdirSync(path.join(SDKS_DIR, 'hermes/utils'), {
          recursive: true,
        });
        fs.writeFileSync(path.join(SDKS_DIR, 'hermes/package.json'), '{}');
        return {code: 0};
      } else if (args[2] === '-czvf') {
        // We are creating the tarball
        const filename = args[3];
        fs.writeFileSync(filename, tarballContents);
        return {code: 0};
      }
    }

    // rsync is used in createHermesPrebuiltArtifactsTarball
    if (command === 'rsync') {
      spawnCalls.rsync = true;
      spawnCalls.rsyncArgs = args;
      const destination = args[args.length - 1];

      // Create destination directory
      fs.mkdirSync(path.join(options.cwd, destination), {
        recursive: true,
      });
    }
  }),
}));

function populateMockFilesystemWithHermesBuildScripts() {
  fs.mkdirSync(path.join(SDKS_DIR, 'hermes-engine/utils'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(SDKS_DIR, 'hermes-engine/utils/build-apple-framework.sh'),
    'Dummy file',
  );
  fs.writeFileSync(
    path.join(SDKS_DIR, 'hermes-engine/utils/build-ios-framework.sh'),
    'Dummy file',
  );
  fs.writeFileSync(
    path.join(SDKS_DIR, 'hermes-engine/utils/build-mac-framework.sh'),
    'Dummy file',
  );
  fs.writeFileSync(
    path.join(SDKS_DIR, 'hermes-engine/hermes-engine.podspec'),
    'Dummy file',
  );
  fs.writeFileSync(
    path.join(SDKS_DIR, 'hermes-engine/hermes-utils.rb'),
    'Dummy file',
  );
}

function populateMockFilesystemWithHermesBuildArtifacts() {
  fs.mkdirSync(os.tmpdir(), {recursive: true});
  const frameworksDir = path.join(
    SDKS_DIR,
    'hermes/destroot/Library/Frameworks',
  );
  fs.mkdirSync(path.join(frameworksDir, 'macosx/hermes.framework'), {
    recursive: true,
  });
  fs.mkdirSync(path.join(frameworksDir, 'universal/hermes.xcframework'), {
    recursive: true,
  });

  const dsymsDirs = [
    'macosx',
    'universal/hermes.xcframework/ios-arm64/dSYMs',
    'universal/hermes.xcframework/ios-arm64_x86_64-simulator/dSYMs',
    'universal/hermes.xcframework/ios-arm64_x86_64-maccatalyst/dSYMs',
  ];

  for (const dsymsDir of dsymsDirs) {
    fs.mkdirSync(path.join(frameworksDir, dsymsDir, 'hermes.framework.dSYM'), {
      recursive: true,
    });
  }
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

    populateMockFilesystemWithHermesBuildScripts();

    execCalls = Object.create(null);
    spawnCalls = Object.create(null);
  });

  describe('Versioning Hermes', () => {
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
  });

  describe('Downloading Hermes', () => {
    describe('getHermesTarballDownloadPath', () => {
      it('returns download path with Hermes tag sha', () => {
        const hermesTarballDownloadPath =
          getHermesTarballDownloadPath(hermesTag);
        expect(hermesTarballDownloadPath).toEqual(
          path.join(
            SDKS_DIR,
            'download',
            `hermes-${getHermesTagSHA(hermesTag)}.tgz`,
          ),
        );
      });
    });
    describe('downloadHermesSourceTarball', () => {
      it('should download Hermes source tarball to download dir', () => {
        fs.writeFileSync(path.join(SDKS_DIR, '.hermesversion'), hermesTag);
        const hermesTarballDownloadPath =
          getHermesTarballDownloadPath(hermesTag);
        downloadHermesSourceTarball();
        expect(spawnCalls.curl).toBe(true);
        expect(
          fs.readFileSync(hermesTarballDownloadPath, {
            encoding: 'utf8',
            flag: 'r',
          }),
        ).toEqual(tarballContents);
      });
      it('should not re-download Hermes source tarball if tarball exists', () => {
        fs.mkdirSync(path.join(SDKS_DIR, 'download'), {recursive: true});
        fs.writeFileSync(
          path.join(SDKS_DIR, 'download', `hermes-${hermesTagSha}.tgz`),
          tarballContents,
        );

        downloadHermesSourceTarball();
        expect(spawnCalls.curl).toBeUndefined();
      });
    });

    describe('expandHermesSourceTarball', () => {
      it('should expand Hermes source tarball to Hermes source dir', () => {
        fs.mkdirSync(path.join(SDKS_DIR, 'download'), {recursive: true});
        fs.writeFileSync(
          path.join(SDKS_DIR, 'download', `hermes-${hermesTagSha}.tgz`),
          tarballContents,
        );
        expect(fs.existsSync(path.join(SDKS_DIR, 'hermes'))).toBeFalsy();
        expandHermesSourceTarball();
        expect(fs.existsSync(path.join(SDKS_DIR, 'hermes'))).toBe(true);
      });
      it('should fail if Hermes source tarball does not exist', () => {
        expect(() => {
          expandHermesSourceTarball();
        }).toThrow('[Hermes] Could not locate Hermes tarball.');
      });
    });
  });

  describe('Configuring Hermes Build', () => {
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
              path.join(ROOT_DIR, 'sdks/hermes/utils', buildScript),
              {
                encoding: 'utf8',
                flag: 'r',
              },
            ),
          ).toEqual(
            fs.readFileSync(
              path.join(ROOT_DIR, 'sdks/hermes-engine/utils', buildScript),
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
          fs.readFileSync(path.join(SDKS_DIR, 'hermes/hermes-engine.podspec'), {
            encoding: 'utf8',
            flag: 'r',
          }),
        ).toEqual(
          fs.readFileSync(
            path.join(SDKS_DIR, 'hermes-engine/hermes-engine.podspec'),
            {
              encoding: 'utf8',
              flag: 'r',
            },
          ),
        );
      });
      it('should copy hermes-utils.rb to Hermes source directory', () => {
        copyPodSpec();
        expect(
          fs.readFileSync(path.join(SDKS_DIR, 'hermes/hermes-utils.rb'), {
            encoding: 'utf8',
            flag: 'r',
          }),
        ).toEqual(
          fs.readFileSync(
            path.join(SDKS_DIR, 'hermes-engine/hermes-utils.rb'),
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
        fs.mkdirSync(path.join(SDKS_DIR, 'hermesc/osx-bin'), {
          recursive: true,
        });
        fs.writeFileSync(
          path.join(SDKS_DIR, 'hermesc/osx-bin/hermesc'),
          hermescContents,
        );
        expect(shouldUsePrebuiltHermesC('macos')).toBe(true);
      });
    });

    describe('configureMakeForPrebuiltHermesC', () => {
      it('creates ImportHermesC file', () => {
        fs.mkdirSync(path.join(SDKS_DIR, 'hermesc/osx-bin'), {
          recursive: true,
        });
        configureMakeForPrebuiltHermesC();
        expect(
          fs.existsSync(
            path.join(SDKS_DIR, 'hermesc/osx-bin/ImportHermesc.cmake'),
          ),
        ).toBe(true);
      });
    });
  });

  describe('Packaging Hermes', () => {
    beforeEach(() => {
      populateMockFilesystemWithHermesBuildArtifacts();
    });

    describe('createTarballFromDirectory', () => {
      it('should create the tarball', () => {
        fs.mkdirSync(path.join(SDKS_DIR, 'downloads'), {recursive: true});
        const tarballFilename = path.join(
          SDKS_DIR,
          'downloads/hermes-runtime-darwin.tar.gz',
        );
        createTarballFromDirectory(
          path.join(SDKS_DIR, 'hermes/destroot'),
          tarballFilename,
        );
        expect(spawnCalls.tar).toBe(true);
        expect(fs.existsSync(tarballFilename)).toBe(true);
      });
    });

    describe('getHermesPrebuiltArtifactsTarballName', () => {
      it('should return Hermes prebuilts tarball name', () => {
        expect(getHermesPrebuiltArtifactsTarballName('Debug')).toEqual(
          'hermes-ios-debug.tar.gz',
        );
      });
      it('should throw if build type is undefined', () => {
        expect(() => {
          getHermesPrebuiltArtifactsTarballName();
        }).toThrow('Did not specify build type.');
      });
    });

    describe('createHermesPrebuiltArtifactsTarball', () => {
      it('creates tarball', () => {
        const tarballOutputDir = fs.mkdtempSync(
          path.join(os.tmpdir(), 'hermes-prebuilts-'),
        );
        fs.mkdirSync(tarballOutputDir, {
          recursive: true,
        });

        const excludeDebugSymbols = false;
        const tarballOutputPath = createHermesPrebuiltArtifactsTarball(
          path.join(SDKS_DIR, 'hermes'),
          'Debug',
          tarballOutputDir,
          excludeDebugSymbols,
        );
        expect(fs.existsSync(tarballOutputPath)).toBe(true);
        expect(spawnCalls.rsync).toBe(true);
        // rsync -a src dest
        expect(spawnCalls.rsyncArgs.length).toEqual(3);
      });

      it('creates tarball with debug symbols excluded', () => {
        const tarballOutputDir = fs.mkdtempSync(
          path.join(os.tmpdir(), 'hermes-prebuilts-'),
        );
        fs.mkdirSync(tarballOutputDir, {
          recursive: true,
        });

        const excludeDebugSymbols = true;
        const tarballOutputPath = createHermesPrebuiltArtifactsTarball(
          path.join(SDKS_DIR, 'hermes'),
          'Debug',
          tarballOutputDir,
          excludeDebugSymbols,
        );
        expect(fs.existsSync(tarballOutputPath)).toBe(true);
        expect(spawnCalls.rsync).toBe(true);

        // When the debug symbols are excluded, we pass an additional two parameters to rsync:
        // rsync -a --exclude=dSYMs/ --exclude=*.dSYM/ src dest
        expect(spawnCalls.rsyncArgs.length).toEqual(5);
        expect(spawnCalls.rsyncArgs[1]).toEqual('--exclude=dSYMs/');
        expect(spawnCalls.rsyncArgs[2]).toEqual('--exclude=*.dSYM/');
      });
    });
  });
});
