/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {
  publishTemplate,
  verifyPublishedTemplate,
} = require('../publishTemplate');

const mockRun = jest.fn();
const mockSleep = jest.fn();
const mockGetNpmPackageInfo = jest.fn();
const silence = () => {};

jest.mock('../utils.js', () => ({
  log: silence,
  run: mockRun,
  sleep: mockSleep,
  getNpmPackageInfo: mockGetNpmPackageInfo,
}));

const getMockGithub = () => ({
  rest: {
    actions: {
      createWorkflowDispatch: jest.fn(),
    },
  },
});

describe('#publishTemplate', () => {
  beforeEach(jest.clearAllMocks);

  it('checks commits for magic #publish-package-to-npm&latest string and sets latest', async () => {
    mockRun.mockReturnValueOnce(`
      The commit message

    #publish-packages-to-npm&latest`);

    const github = getMockGithub();
    await publishTemplate(github, '0.76.0', true);
    expect(github.rest.actions.createWorkflowDispatch).toHaveBeenCalledWith({
      owner: 'react-native-community',
      repo: 'template',
      workflow_id: 'release.yml',
      ref: '0.76-stable',
      inputs: {
        dry_run: true,
        is_latest_on_npm: true,
        version: '0.76.0',
      },
    });
  });

  it('pubished as is_latest_on_npm = false if missing magic string', async () => {
    mockRun.mockReturnValueOnce(`
      The commit message without magic
    `);

    const github = getMockGithub();
    await publishTemplate(github, '0.76.0', false);
    expect(github.rest.actions.createWorkflowDispatch).toHaveBeenCalledWith({
      owner: 'react-native-community',
      repo: 'template',
      workflow_id: 'release.yml',
      ref: '0.76-stable',
      inputs: {
        dry_run: false,
        is_latest_on_npm: false,
        version: '0.76.0',
      },
    });
  });
});

describe('#verifyPublishedTemplate', () => {
  beforeEach(jest.clearAllMocks);

  it("waits on npm updating for version and not 'latest'", async () => {
    const NOT_LATEST = false;
    mockGetNpmPackageInfo
      // template@<version>
      .mockReturnValueOnce(Promise.reject('mock http/404'))
      .mockReturnValueOnce(Promise.resolve());
    mockSleep.mockReturnValueOnce(Promise.resolve()).mockImplementation(() => {
      throw new Error('Should not be called again!');
    });

    const version = '0.77.0';
    await verifyPublishedTemplate(version, NOT_LATEST);

    expect(mockGetNpmPackageInfo).toHaveBeenLastCalledWith(
      '@react-native-community/template',
      version,
    );
  });

  it('waits on npm updating version and latest tag', async () => {
    const IS_LATEST = true;
    const version = '0.77.0';
    mockGetNpmPackageInfo
      // template@latest → unknown tag
      .mockReturnValueOnce(Promise.reject('mock http/404'))
      // template@latest != version → old tag
      .mockReturnValueOnce(Promise.resolve({version: '0.76.5'}))
      // template@latest == version → correct tag
      .mockReturnValueOnce(Promise.resolve({version}));
    mockSleep
      .mockReturnValueOnce(Promise.resolve())
      .mockReturnValueOnce(Promise.resolve())
      .mockImplementation(() => {
        throw new Error('Should not be called again!');
      });

    await verifyPublishedTemplate(version, IS_LATEST);

    expect(mockGetNpmPackageInfo).toHaveBeenCalledWith(
      '@react-native-community/template',
      'latest',
    );
  });

  describe('timeouts', () => {
    let mockProcess;
    beforeEach(() => {
      mockProcess = jest.spyOn(process, 'exit').mockImplementation(code => {
        throw new Error(`process.exit(${code}) called!`);
      });
    });
    afterEach(() => mockProcess.mockRestore());
    it('will timeout if npm does not update package version after a set number of retries', async () => {
      const RETRIES = 2;
      mockGetNpmPackageInfo.mockReturnValue(Promise.reject('mock http/404'));
      mockSleep.mockReturnValue(Promise.resolve());
      await expect(() =>
        verifyPublishedTemplate('0.77.0', true, RETRIES),
      ).rejects.toThrowError('process.exit(1) called!');
      expect(mockGetNpmPackageInfo).toHaveBeenCalledTimes(RETRIES);
    });

    it('will timeout if npm does not update latest tag after a set number of retries', async () => {
      const RETRIES = 7;
      const IS_LATEST = true;
      mockGetNpmPackageInfo.mockReturnValue(
        Promise.resolve({version: '0.76.5'}),
      );
      mockSleep.mockReturnValue(Promise.resolve());
      await expect(async () => {
        await verifyPublishedTemplate('0.77.0', IS_LATEST, RETRIES);
      }).rejects.toThrowError('process.exit(1) called!');
      expect(mockGetNpmPackageInfo).toHaveBeenCalledTimes(RETRIES);
    });
  });
});
