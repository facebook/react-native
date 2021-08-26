/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 * @flow strict-local
 */

'use strict';

jest.mock('react-native/Libraries/Utilities/HMRClient');

const getDevServer = jest.fn(() => ({
  url: 'localhost:8042/',
  fullBundleUrl:
    'http://localhost:8042/EntryPoint.bundle?platform=' +
    jest.requireActual('react-native').Platform.OS +
    '&dev=true&minify=false&unusedExtraParam=42',
  bundleLoadedFromServer: true,
}));

jest.mock(
  'react-native/Libraries/Core/Devtools/getDevServer',
  () => getDevServer,
);

const sendRequest = jest.fn(
  (
    method,
    trackingName,
    url,
    headers,
    data,
    responseType,
    incrementalUpdates,
    timeout,
    callback,
    withCredentials,
  ) => {
    callback(1);
  },
);

jest.mock('react-native/Libraries/Network/RCTNetworking', () => ({
  sendRequest,
  addListener: jest.fn((name, fn) => {
    if (name === 'didReceiveNetworkData') {
      setImmediate(() => fn([1, mockDataResponse]));
    } else if (name === 'didCompleteNetworkResponse') {
      setImmediate(() => fn([1, null]));
    } else if (name === 'didReceiveNetworkResponse') {
      setImmediate(() => fn([1, null, mockHeaders]));
    }
    return {remove: () => {}};
  }),
}));

jest.mock(
  '12',
  () => ({
    isLoaded: true,
  }),
  {virtual: true},
);

jest.mock(
  '482018',
  () => ({
    exists: true,
  }),
  {virtual: true},
);

jest.mock(
  '555',
  () => ({
    exists: true,
  }),
  {virtual: true},
);

const asyncRequireForMetro = require('../asyncRequireForMetro');
let mockHeaders;
let mockDataResponse;

test('asyncRequireForMetro will throw for JSON responses', async () => {
  mockHeaders = {'Content-Type': 'application/json'};
  mockDataResponse = JSON.stringify({message: 'Error thrown from Metro'});

  asyncRequireForMetro.addImportBundleNames({
    '555': 'Fail',
  });

  await expect(asyncRequireForMetro(555, '**')).rejects.toThrow(
    'Error thrown from Metro',
  );
});

test('asyncRequireForMetro will request a bundle if import bundles are available', async () => {
  mockDataResponse = '"code";';
  mockHeaders = {'Content-Type:': 'application/javascript'};

  asyncRequireForMetro.addImportBundleNames({
    '12': 'Banana',
    '482018': 'Tiny/Apple',
  });

  const module12 = await asyncRequireForMetro(12, '**');
  expect(module12).toEqual({isLoaded: true});

  const module482018 = await asyncRequireForMetro(482018, '**');
  expect(module482018).toEqual({exists: true});

  // Assert on the actual URLs fetched.
  // NOTE: The cache isn't cleared between tests, so we can't do
  // sendRequest.clearMock() and test this in isolation. Instead, we do this
  // here, where we know the bundles must have been fetched at least once.
  expect(sendRequest.mock.calls).toContainEqual([
    'GET',
    expect.anything(),
    'localhost:8042/Banana.bundle?platform=ios&dev=true&minify=false&unusedExtraParam=42&modulesOnly=true&runModule=false&runtimeBytecodeVersion=',
    expect.anything(),
    expect.anything(),
    expect.anything(),
    expect.anything(),
    expect.anything(),
    expect.anything(),
    expect.anything(),
  ]);

  expect(sendRequest.mock.calls).toContainEqual([
    'GET',
    expect.anything(),
    'localhost:8042/Tiny/Apple.bundle?platform=ios&dev=true&minify=false&unusedExtraParam=42&modulesOnly=true&runModule=false&runtimeBytecodeVersion=',
    expect.anything(),
    expect.anything(),
    expect.anything(),
    expect.anything(),
    expect.anything(),
    expect.anything(),
    expect.anything(),
  ]);
});

it('asyncRequireForMetro throws if not connected to a Metro server', async () => {
  getDevServer.mockImplementationOnce(() => ({
    url: 'localhost:8042/',
    fullBundleUrl:
      'http://localhost:8042/EntryPoint.bundle?platform=' +
      jest.requireActual('react-native').Platform.OS +
      '&dev=true&minify=false&unusedExtraParam=42',
    bundleLoadedFromServer: false,
  }));
  asyncRequireForMetro.addImportBundleNames({
    '99': 'Banana',
  });

  const promise = asyncRequireForMetro(99, '**');
  await expect(promise).rejects.toThrow(
    'This bundle was compiled with transformer.experimentalImportBundleSupport and can only be used when connected to a Metro server.',
  );
});

describe('asyncRequireForMetro.resource', () => {
  it('should throw', async () => {
    expect(() => asyncRequireForMetro.resource(482018, 'MyModule')).toThrow();
  });
});
