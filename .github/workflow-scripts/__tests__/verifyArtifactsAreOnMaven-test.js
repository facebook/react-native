/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {verifyArtifactsAreOnMaven} = require('../verifyArtifactsAreOnMaven');

const mockSleep = jest.fn();
const silence = () => {};
const mockFetch = jest.fn();
const mockExit = jest.fn();

jest.mock('../utils.js', () => ({
  log: silence,
  sleep: mockSleep,
}));

process.exit = mockExit;
global.fetch = mockFetch;

describe('#verifyArtifactsAreOnMaven', () => {
  beforeEach(jest.clearAllMocks);

  it('waits for the packages to be published on maven when version has no v', async () => {
    mockSleep.mockReturnValueOnce(Promise.resolve()).mockImplementation(() => {
      throw new Error('Should not be called again!');
    });
    mockFetch
      .mockReturnValueOnce(Promise.resolve({status: 404}))
      .mockReturnValueOnce(Promise.resolve({status: 200}));

    const version = '0.78.1';
    await verifyArtifactsAreOnMaven(version);

    expect(mockSleep).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.78.1/react-native-artifacts-0.78.1.pom',
    );
  });

  it('waits for the packages to be published on maven, when version starts with v', async () => {
    mockSleep.mockReturnValueOnce(Promise.resolve()).mockImplementation(() => {
      throw new Error('Should not be called again!');
    });
    mockFetch
      .mockReturnValueOnce(Promise.resolve({status: 404}))
      .mockReturnValueOnce(Promise.resolve({status: 200}));

    const version = 'v0.78.1';
    await verifyArtifactsAreOnMaven(version);

    expect(mockSleep).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.78.1/react-native-artifacts-0.78.1.pom',
    );
  });

  it('passes immediately if packages are already on Maven', async () => {
    mockFetch.mockReturnValueOnce(Promise.resolve({status: 200}));

    const version = '0.78.1';
    await verifyArtifactsAreOnMaven(version);

    expect(mockSleep).toHaveBeenCalledTimes(0);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.78.1/react-native-artifacts-0.78.1.pom',
    );
  });

  it('tries 90 times and then exits', async () => {
    mockSleep.mockReturnValue(Promise.resolve());
    mockFetch.mockReturnValue(Promise.resolve({status: 404}));

    const version = '0.78.1';
    await verifyArtifactsAreOnMaven(version);

    expect(mockSleep).toHaveBeenCalledTimes(90);
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.78.1/react-native-artifacts-0.78.1.pom',
    );
  });
});
