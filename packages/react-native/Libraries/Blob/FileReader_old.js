/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type Blob from './Blob';

import NativeFileReaderModule from './NativeFileReaderModule';
import {toByteArray} from 'base64-js';
import EventTarget from 'event-target-shim';

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

const EMPTY = 0 as const;
const LOADING = 1 as const;
const DONE = 2 as const;

class FileReader extends (EventTarget(...READER_EVENTS): typeof EventTarget) {
  static EMPTY: 0 = EMPTY;
  static LOADING: 1 = LOADING;
  static DONE: 2 = DONE;

  EMPTY: 0 = EMPTY;
  LOADING: 1 = LOADING;
  DONE: 2 = DONE;

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

  readAsArrayBuffer(blob: ?Blob): void {
    this._aborted = false;

    if (blob == null) {
      throw new TypeError(
        "Failed to execute 'readAsArrayBuffer' on 'FileReader': parameter 1 is not of type 'Blob'",
      );
    }

    NativeFileReaderModule.readAsDataURL(blob.data).then(
      (text: string) => {
        if (this._aborted) {
          return;
        }

        const base64 = text.split(',')[1];
        const typedArray = toByteArray(base64);

        this._result = typedArray.buffer;
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

  readAsDataURL(blob: ?Blob): void {
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

  readAsText(blob: ?Blob, encoding: string = 'UTF-8'): void {
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

export default FileReader;
