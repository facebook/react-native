/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

jest.enableAutomock().unmock('WebSocket');
jest.setMock('NativeModules', {
  WebSocketModule: {
    connect: () => {},
  },
});

const WebSocket = require('WebSocket');

describe('WebSocket', function() {
  it('should have connection lifecycle constants defined on the class', () => {
    expect(WebSocket.CONNECTING).toEqual(0);
  });

  it('should have connection lifecycle constants defined on the instance', () => {
    expect(new WebSocket('wss://echo.websocket.org').CONNECTING).toEqual(0);
  });
});
