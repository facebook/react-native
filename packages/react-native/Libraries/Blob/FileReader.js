/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const Blob = require('./Blob');
const EventTarget = require('event-target-shim');

import NativeFileReaderModule from './NativeFileReaderModule';

type ReadyState =
  | 0 // EMPTY
  | 1 // LOADING
  | 2; // DONE

type ReaderResult = string | ArrayBuffer;

const READER_EVENTS = [
  'abort',
  'error',
  'load',
  'loadstart',
  'loadend',
  'progress',
];

const EMPTY = 0;
const LOADING = 1;
const DONE = 2;

class FileReader extends (EventTarget(...READER_EVENTS): any) {
  static EMPTY: number = EMPTY;
  static LOADING: number = LOADING;
  static DONE: number = DONE;

  EMPTY: number = EMPTY;
  LOADING: number = LOADING;
  DONE: number = DONE;

  _readyState: ReadyState;
  _error: ?Error;
  _result: ?ReaderResult;
  _aborted: boolean = false;

  constructor() {
    super();
    this._reset();
  }

  _reset(): void {
    this._readyState = EMPTY;
    this._error = null;
    this._result = null;
  }

  _setReadyState(newState: ReadyState) {
    this._readyState = newState;
    this.dispatchEvent({type: 'readystatechange'});
    if (newState === DONE) {
      if (this._aborted) {
        this.dispatchEvent({type: 'abort'});
      } else if (this._error) {
        this.dispatchEvent({type: 'error'});
      } else {
        this.dispatchEvent({type: 'load'});
      }
      this.dispatchEvent({type: 'loadend'});
    }
  }

  readAsArrayBuffer() {
    throw new Error('FileReader.readAsArrayBuffer is not implemented');
  }

  readAsDataURL(blob: ?Blob) {
    this._aborted = false;

    if (blob == null) {
      throw new TypeError(
        "Failed to execute 'readAsDataURL' on 'FileReader': parameter 1 is not of type 'Blob'",
      );
    }

    NativeFileReaderModule.readAsDataURL(blob.data).then(
      (text: string) => {
        if (this._aborted) {
          return;
        }
        this._result = text;
        this._setReadyState(DONE);
      },
      error => {
        if (this._aborted) {
          return;
        }
        this._error = error;
        this._setReadyState(DONE);
      },
    );
  }

  readAsText(blob: ?Blob, encoding: string = 'UTF-8') {
    this._aborted = false;

    if (blob == null) {
      throw new TypeError(
        "Failed to execute 'readAsText' on 'FileReader': parameter 1 is not of type 'Blob'",
      );
    }

    NativeFileReaderModule.readAsText(blob.data, encoding).then(
      (text: string) => {
        if (this._aborted) {
          return;
        }
        this._result = text;
        this._setReadyState(DONE);
      },
      error => {
        if (this._aborted) {
          return;
        }
        this._error = error;
        this._setReadyState(DONE);
      },
    );
  }

  abort() {
    this._aborted = true;
    // only call onreadystatechange if there is something to abort, as per spec
    if (this._readyState !== EMPTY && this._readyState !== DONE) {
      this._reset();
      this._setReadyState(DONE);
    }
    // Reset again after, in case modified in handler
    this._reset();
  }

  get readyState(): ReadyState {
    return this._readyState;
  }

  get error(): ?Error {
    return this._error;
  }

  get result(): ?ReaderResult {
    return this._result;
  }
}

module.exports = FileReader;
