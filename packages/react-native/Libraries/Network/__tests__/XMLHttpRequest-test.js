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

const createPerformanceLogger =
  require('../../Utilities/createPerformanceLogger').default;
const GlobalPerformanceLogger = require('../../Utilities/GlobalPerformanceLogger');
const Platform = require('../../Utilities/Platform');
const XMLHttpRequest = require('../XMLHttpRequest');

jest.unmock('../../Utilities/Platform');
jest.mock('../../Utilities/GlobalPerformanceLogger');
let requestId = 1;
function setRequestId(id) {
  if (Platform.OS === 'ios') {
    return;
  }
  requestId = id;
}
jest
  .dontMock('event-target-shim')
  .setMock('../../BatchedBridge/NativeModules', {
    __esModule: true,
    default: {
      Networking: {
        addListener: function () {},
        removeListeners: function () {},
        sendRequest(options, callback) {
          if (typeof callback === 'function') {
            // android does not pass a callback
            callback(requestId);
          }
        },
        abortRequest: function () {},
      },
      PlatformConstants: {
        getConstants() {
          return {};
        },
      },
    },
  });

describe('XMLHttpRequest', function () {
  let xhr;
  let handleTimeout;
  let handleError;
  let handleLoad;
  let handleReadyStateChange;
  let handleLoadEnd;

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

    jest.clearAllMocks();
  });

  afterEach(() => {
    xhr = null;
    handleTimeout = null;
    handleError = null;
    handleLoad = null;
    handleLoadEnd = null;
    handleReadyStateChange = null;
  });

  it('should transition readyState correctly', function () {
    expect(xhr.readyState).toBe(xhr.UNSENT);

    xhr.open('GET', 'blabla');

    expect(xhr.onreadystatechange.mock.calls.length).toBe(1);
    expect(handleReadyStateChange.mock.calls.length).toBe(1);
    expect(xhr.readyState).toBe(xhr.OPENED);
  });

  it('should expose responseType correctly', function () {
    expect(xhr.responseType).toBe('');

    jest.spyOn(console, 'warn').mockReturnValue(undefined);

    // Setting responseType to an unsupported value has no effect.
    xhr.responseType = 'arrayblobbuffertextfile';
    expect(xhr.responseType).toBe('');

    expect(console.warn).toBeCalledWith(
      "The provided value 'arrayblobbuffertextfile' is not a valid 'responseType'.",
    );
    console.warn.mockRestore();

    xhr.responseType = 'arraybuffer';
    expect(xhr.responseType).toBe('arraybuffer');

    // Can't change responseType after first data has been received.
    xhr.open('GET', 'blabla');
    xhr.send();
    expect(() => {
      xhr.responseType = 'text';
    }).toThrow();
  });

  it('should expose responseText correctly', function () {
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
    expect(() => {
      xhr.responseText = 'hi';
    }).toThrow();
    expect(xhr.responseText).toBe('');
    expect(xhr.response).toBe('');

    xhr.open('GET', 'blabla');
    xhr.send();
    setRequestId(2);
    xhr.__didReceiveData(requestId, 'Some data');
    expect(xhr.responseText).toBe('Some data');
  });

  it('should call ontimeout function when the request times out', function () {
    xhr.open('GET', 'blabla');
    xhr.send();
    setRequestId(3);
    xhr.__didCompleteResponse(requestId, 'Timeout', true);
    xhr.__didCompleteResponse(requestId, 'Timeout', true);

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

  it('should call onerror function when the request times out', function () {
    xhr.open('GET', 'blabla');
    xhr.send();
    setRequestId(4);
    xhr.__didCompleteResponse(requestId, 'Generic error');

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

  it('should call onload function when there is no error', function () {
    xhr.open('GET', 'blabla');
    xhr.send();
    setRequestId(5);
    xhr.__didCompleteResponse(requestId, null);

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

  it('should call upload onprogress', function () {
    xhr.open('GET', 'blabla');
    xhr.send();

    xhr.upload.onprogress = jest.fn();
    const handleProgress = jest.fn();
    xhr.upload.addEventListener('progress', handleProgress);
    setRequestId(6);
    xhr.__didUploadProgress(requestId, 42, 100);

    expect(xhr.upload.onprogress.mock.calls.length).toBe(1);
    expect(handleProgress.mock.calls.length).toBe(1);

    expect(xhr.upload.onprogress.mock.calls[0][0].loaded).toBe(42);
    expect(xhr.upload.onprogress.mock.calls[0][0].total).toBe(100);
    expect(handleProgress.mock.calls[0][0].loaded).toBe(42);
    expect(handleProgress.mock.calls[0][0].total).toBe(100);
  });

  it('should combine response headers with CRLF', function () {
    xhr.open('GET', 'blabla');
    xhr.send();
    setRequestId(7);
    xhr.__didReceiveResponse(requestId, 200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Length': '32',
    });

    expect(xhr.getAllResponseHeaders()).toBe(
      'content-length: 32\r\n' + 'content-type: text/plain; charset=utf-8\r\n',
    );
  });

  it('should log to GlobalPerformanceLogger if a custom performance logger is not set', () => {
    xhr.open('GET', 'blabla');
    xhr.send();

    expect(GlobalPerformanceLogger.startTimespan).toHaveBeenCalledWith(
      'network_XMLHttpRequest_blabla',
    );
    expect(GlobalPerformanceLogger.stopTimespan).not.toHaveBeenCalled();

    setRequestId(8);
    xhr.__didReceiveResponse(requestId, 200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Length': '32',
    });

    expect(GlobalPerformanceLogger.stopTimespan).toHaveBeenCalledWith(
      'network_XMLHttpRequest_blabla',
    );
  });

  it('should log to a custom performance logger if set', () => {
    const performanceLogger = createPerformanceLogger();
    jest.spyOn(performanceLogger, 'startTimespan');
    jest.spyOn(performanceLogger, 'stopTimespan');

    xhr.setPerformanceLogger(performanceLogger);

    xhr.open('GET', 'blabla');
    xhr.send();

    expect(performanceLogger.startTimespan).toHaveBeenCalledWith(
      'network_XMLHttpRequest_blabla',
    );
    expect(GlobalPerformanceLogger.startTimespan).not.toHaveBeenCalled();
    expect(performanceLogger.stopTimespan).not.toHaveBeenCalled();

    setRequestId(9);
    xhr.__didReceiveResponse(requestId, 200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Length': '32',
    });

    expect(performanceLogger.stopTimespan).toHaveBeenCalledWith(
      'network_XMLHttpRequest_blabla',
    );
    expect(GlobalPerformanceLogger.stopTimespan).not.toHaveBeenCalled();
  });

  it('should sort and lowercase response headers', function () {
    // Derived from XHR Web Platform Test: https://github.com/web-platform-tests/wpt/blob/master/xhr/getallresponseheaders.htm
    xhr.open('GET', 'blabla');
    xhr.send();
    setRequestId(10);
    xhr.__didReceiveResponse(requestId, 200, {
      'foo-TEST': '1',
      'FOO-test': '2',
      __Custom: 'token',
      'ALSO-here': 'Mr. PB',
      ewok: 'lego',
    });

    expect(xhr.getAllResponseHeaders()).toBe(
      'also-here: Mr. PB\r\newok: lego\r\nfoo-test: 1, 2\r\n__custom: token\r\n',
    );
  });
});
