/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .autoMockOff()
  .mock('ErrorUtils')
  .setMock('NativeModules', {
    WebSocketManager: {
      connect: jest.genMockFunction(),
      close: jest.genMockFunction(),
      send: jest.genMockFunction(),
    },
  });

var readyStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTWebSocketManager = require('NativeModules').WebSocketManager;

var WebSocket = require('WebSocket');

// Small utils to keep it DRY
var simulateEvent = (ws, event, data = {}) => {
  RCTDeviceEventEmitter.emit(event, {id: ws._socketId, ...data});
};
var expectOneCall = fn => expect(fn.mock.calls.length).toBe(1);
var getSocket = () => new WebSocket('ws://echo.websocket.org');

describe('WebSockets', () => {
  beforeEach(() => {
    // Reset RCTWebSocketManager calls
    Object.assign(RCTWebSocketManager, {
      connect: jest.genMockFunction(),
      close: jest.genMockFunction(),
      send: jest.genMockFunction(),
    });
  });

  it('should have readyState CONNECTING initialy', () => {
    var ws = getSocket();
    expect(ws.readyState).toBe(readyStates.CONNECTING);
  });

  // Open event
  it('Should call native connect when connecting', () => {
    var ws = getSocket();
    ws.onopen = jest.genMockFunction();

    expectOneCall(RCTWebSocketManager.connect);
  });

  it('should have readyState OPEN when connected', () => {
    var ws = getSocket();
    simulateEvent(ws, 'websocketOpen');
    expect(ws.readyState).toBe(readyStates.OPEN);
  });

  it('should call onopen when connected', () => {
    var ws = getSocket();
    ws.onopen = jest.genMockFunction();

    simulateEvent(ws, 'websocketOpen');

    expectOneCall(ws.onopen);
  });

  it('should trigger listener when connected', () => {
    var ws = getSocket();
    var listener = jest.genMockFunction();
    ws.addEventListener('open', listener);

    simulateEvent(ws, 'websocketOpen');

    expectOneCall(listener);
  });

  // Sending message
  it('should call native send when sending a message', () => {
    var ws = getSocket();
    simulateEvent(ws, 'websocketOpen');
    var message = 'Hello websocket!';

    ws.send(message);

    expectOneCall(RCTWebSocketManager.send);
    expect(RCTWebSocketManager.send.mock.calls[0])
      .toEqual([message, ws._socketId]);
  });

  it('should call onmessage when receiving a message', () => {
    var ws = getSocket();
    var message = 'Hello listener!';
    ws.onmessage = jest.genMockFunction();

    simulateEvent(ws, 'websocketOpen');
    simulateEvent(ws, 'websocketMessage', {data: message});

    expectOneCall(ws.onmessage);
    expect(ws.onmessage.mock.calls[0][0].data).toBe(message);
  });

  it('should trigger listeners when recieving a message', () => {
    var ws = getSocket();
    var message = 'Hello listener!';
    var listener = jest.genMockFunction();
    ws.addEventListener('message', listener);

    simulateEvent(ws, 'websocketOpen');
    simulateEvent(ws, 'websocketMessage', {data: message});

    expectOneCall(listener);
    expect(listener.mock.calls[0][0].data).toBe(message);
  });

  // Close event
  it('should have readyState CLOSED when closed', () => {
    var ws = getSocket();

    simulateEvent(ws, 'websocketOpen');
    simulateEvent(ws, 'websocketClosed');

    expect(ws.readyState).toBe(readyStates.CLOSED);
  });

  it('should call onclose when closed', () => {
    var ws = getSocket();
    ws.onclose = jest.genMockFunction();

    simulateEvent(ws, 'websocketOpen');
    simulateEvent(ws, 'websocketClosed');

    expectOneCall(ws.onclose);
  });

  it('should trigger listeners when closed', () => {
    var ws = getSocket();
    var listener = jest.genMockFunction();
    ws.addEventListener('close', listener);

    simulateEvent(ws, 'websocketOpen');
    simulateEvent(ws, 'websocketClosed');

    expectOneCall(listener);
  });

  it('should call native close when closed', () => {
    var ws = getSocket();

    simulateEvent(ws, 'websocketOpen');
    simulateEvent(ws, 'websocketClosed');

    expectOneCall(RCTWebSocketManager.close);
    expect(RCTWebSocketManager.close.mock.calls[0]).toEqual([ws._socketId]);
  });

  // Fail event
  it('should have readyState CLOSED when failed', () => {
    var ws = getSocket();
    simulateEvent(ws, 'websocketFailed');
    expect(ws.readyState).toBe(readyStates.CLOSED);
  });

  it('should call native close when failed', () => {
    var ws = getSocket();

    simulateEvent(ws, 'websocketFailed');

    expectOneCall(RCTWebSocketManager.close);
    expect(RCTWebSocketManager.close.mock.calls[0]).toEqual([ws._socketId]);
  });

  it('should call onerror and onclose when failed', () => {
    var ws = getSocket();
    ws.onclose = jest.genMockFunction();
    ws.onerror = jest.genMockFunction();

    simulateEvent(ws, 'websocketFailed');

    expectOneCall(ws.onclose);
    expectOneCall(ws.onerror);
  });

  it('should call onerror and onclose when failed', () => {
    var ws = getSocket();
    var onclose = jest.genMockFunction();
    var onerror = jest.genMockFunction();
    ws.addEventListener('close', onclose);
    ws.addEventListener('error', onerror);

    simulateEvent(ws, 'websocketFailed');

    expectOneCall(onclose);
    expectOneCall(onerror);
  });
});
