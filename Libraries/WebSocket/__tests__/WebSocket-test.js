/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

jest.unmock('WebSocket');
jest.setMock('NativeModules', {
  WebSocketModule: {
    connect: () => {}
  }
});

var WebSocket = require('WebSocket');

describe('WebSocket', function() {

  it('should have connection lifecycle constants defined on the class', () => {
    expect(WebSocket.CONNECTING).toEqual(0);
  });

  it('should have connection lifecycle constants defined on the instance', () => {
    expect(new WebSocket('wss://echo.websocket.org').CONNECTING).toEqual(0);
  });

  it('should throw an error if specify invalid url', () => {
    const url = 'invalid url';
    expect(() => new WebSocket(url)).toThrowError(`The URL '${url}' is invalid.`);
  });

});
