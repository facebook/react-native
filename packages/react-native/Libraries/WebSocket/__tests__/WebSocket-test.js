/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

jest.mock('../../EventEmitter/NativeEventEmitter');
jest.setMock('../../BatchedBridge/NativeModules', {
  WebSocketModule: {
    connect: () => {},
  },
  PlatformConstants: {},
});

const WebSocket = require('../WebSocket');

describe('WebSocket', function () {
  it('should have connection lifecycle constants defined on the class', () => {
    expect(WebSocket.CONNECTING).toEqual(0);
  });

  it('should have connection lifecycle constants defined on the instance', () => {
    expect(new WebSocket('wss://echo.websocket.org').CONNECTING).toEqual(0);
  });

  it('should have binaryType of undefined when BlobManager is not available', () => {
    expect(new WebSocket('wss://echo.websocket.org').binaryType).toEqual(
      undefined,
    );
  });

  // it('should have binaryType of blob when BlobManager is available', () => {
  //   jest.setMock('../../BatchedBridge/NativeModules', {
  //     WebSocketModule: {
  //       connect: () => {},
  //     },
  //     PlatformConstants: {},
  //     BlobModule: require('../../Blob/__mocks__/BlobModule'),
  //   });
  //   const BlobManager = require('../../Blob/BlobManager')
  //   expect(BlobManager.isAvailable).toEqual(true);
  //   expect(new WebSocket('wss://echo.websocket.org').binaryType).toEqual(
  //     'blob',
  //   );
  // });
});
