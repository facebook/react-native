/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest
  .disableAutomock()
  .dontMock('event-target-shim')
  .setMock('NativeModules', {
    Networking: {
      addListener: function() {},
      removeListeners: function() {},
      sendRequest(options, callback) {
        if (typeof callback === 'function') { // android does not pass a callback
          callback(1);
        }
      },
      abortRequest: function() {},
    }
  });

const XMLHttpRequest = require('XMLHttpRequest');

describe('XMLHttpRequest', function() {
  var xhr;
  var handleTimeout;
  var handleError;
  var handleLoad;
  var handleReadyStateChange;
  var handleLoadEnd;

  beforeEach(() => {
    xhr = new XMLHttpRequest();

    xhr.ontimeout = jest.fn();
    xhr.onerror = jest.fn();
    xhr.onload = jest.fn();
    xhr.onloadend = jest.fn();
    xhr.onreadystatechange = jest.fn();

    handleTimeout = jest.fn();
    handleError = jest.fn();
    handleLoad = jest.fn();
    handleLoadEnd = jest.fn();
    handleReadyStateChange = jest.fn();

    xhr.addEventListener('timeout', handleTimeout);
    xhr.addEventListener('error', handleError);
    xhr.addEventListener('load', handleLoad);
    xhr.addEventListener('loadend', handleLoadEnd);
    xhr.addEventListener('readystatechange', handleReadyStateChange);
  });

  afterEach(() => {
    xhr = null;
    handleTimeout = null;
    handleError = null;
    handleLoad = null;
    handleLoadEnd = null;
    handleReadyStateChange = null;
  });

  it('should transition readyState correctly', function() {
    expect(xhr.readyState).toBe(xhr.UNSENT);

    xhr.open('GET', 'blabla');

    expect(xhr.onreadystatechange.mock.calls.length).toBe(1);
    expect(handleReadyStateChange.mock.calls.length).toBe(1);
    expect(xhr.readyState).toBe(xhr.OPENED);
  });

  it('should expose responseType correctly', function() {
    expect(xhr.responseType).toBe('');

    // Setting responseType to an unsupported value has no effect.
    xhr.responseType = 'arrayblobbuffertextfile';
    expect(xhr.responseType).toBe('');

    xhr.responseType = 'arraybuffer';
    expect(xhr.responseType).toBe('arraybuffer');

    // Can't change responseType after first data has been received.
    xhr.open('GET', 'blabla');
    xhr.send();
    expect(() => { xhr.responseType = 'text'; }).toThrow();
  });

  it('should expose responseText correctly', function() {
    xhr.responseType = '';
    expect(xhr.responseText).toBe('');
    expect(xhr.response).toBe('');

    xhr.responseType = 'arraybuffer';
    expect(() => xhr.responseText).toThrow();
    expect(xhr.response).toBe(null);

    xhr.responseType = 'text';
    expect(xhr.responseText).toBe('');
    expect(xhr.response).toBe('');

    // responseText is read-only.
    expect(() => { xhr.responseText = 'hi'; }).toThrow();
    expect(xhr.responseText).toBe('');
    expect(xhr.response).toBe('');

    xhr.open('GET', 'blabla');
    xhr.send();
    xhr.__didReceiveData(1, 'Some data');
    expect(xhr.responseText).toBe('Some data');
  });

  it('should call ontimeout function when the request times out', function() {
    xhr.open('GET', 'blabla');
    xhr.send();
    xhr.__didCompleteResponse(1, 'Timeout', true);
    xhr.__didCompleteResponse(1, 'Timeout', true);

    expect(xhr.readyState).toBe(xhr.DONE);

    expect(xhr.ontimeout.mock.calls.length).toBe(1);
    expect(xhr.onloadend.mock.calls.length).toBe(1);
    expect(xhr.onerror).not.toBeCalled();
    expect(xhr.onload).not.toBeCalled();

    expect(handleTimeout.mock.calls.length).toBe(1);
    expect(handleLoadEnd.mock.calls.length).toBe(1);
    expect(handleError).not.toBeCalled();
    expect(handleLoad).not.toBeCalled();
  });

  it('should call onerror function when the request times out', function() {
    xhr.open('GET', 'blabla');
    xhr.send();
    xhr.__didCompleteResponse(1, 'Generic error');

    expect(xhr.readyState).toBe(xhr.DONE);

    expect(xhr.onreadystatechange.mock.calls.length).toBe(2);
    expect(xhr.onerror.mock.calls.length).toBe(1);
    expect(xhr.onloadend.mock.calls.length).toBe(1);
    expect(xhr.ontimeout).not.toBeCalled();
    expect(xhr.onload).not.toBeCalled();

    expect(handleReadyStateChange.mock.calls.length).toBe(2);
    expect(handleError.mock.calls.length).toBe(1);
    expect(handleLoadEnd.mock.calls.length).toBe(1);
    expect(handleTimeout).not.toBeCalled();
    expect(handleLoad).not.toBeCalled();
  });

  it('should call onload function when there is no error', function() {
    xhr.open('GET', 'blabla');
    xhr.send();
    xhr.__didCompleteResponse(1, null);

    expect(xhr.readyState).toBe(xhr.DONE);

    expect(xhr.onreadystatechange.mock.calls.length).toBe(2);
    expect(xhr.onload.mock.calls.length).toBe(1);
    expect(xhr.onloadend.mock.calls.length).toBe(1);
    expect(xhr.onerror).not.toBeCalled();
    expect(xhr.ontimeout).not.toBeCalled();

    expect(handleReadyStateChange.mock.calls.length).toBe(2);
    expect(handleLoad.mock.calls.length).toBe(1);
    expect(handleLoadEnd.mock.calls.length).toBe(1);
    expect(handleError).not.toBeCalled();
    expect(handleTimeout).not.toBeCalled();
  });

  it('should call upload onprogress', function() {
    xhr.open('GET', 'blabla');
    xhr.send();

    xhr.upload.onprogress = jest.fn();
    var handleProgress = jest.fn();
    xhr.upload.addEventListener('progress', handleProgress);

    xhr.__didUploadProgress(1, 42, 100);

    expect(xhr.upload.onprogress.mock.calls.length).toBe(1);
    expect(handleProgress.mock.calls.length).toBe(1);

    expect(xhr.upload.onprogress.mock.calls[0][0].loaded).toBe(42);
    expect(xhr.upload.onprogress.mock.calls[0][0].total).toBe(100);
    expect(handleProgress.mock.calls[0][0].loaded).toBe(42);
    expect(handleProgress.mock.calls[0][0].total).toBe(100);
  });

  it('should combine response headers with CRLF', function() {
    xhr.open('GET', 'blabla');
    xhr.send();
    xhr.__didReceiveResponse(1, 200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Length': '32',
    });

    expect(xhr.getAllResponseHeaders()).toBe(
      'Content-Type: text/plain; charset=utf-8\r\n' +
      'Content-Length: 32');
  });

});
