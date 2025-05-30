/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {EventCallback} from '../../src/private/webapis/dom/events/EventTarget';
import type Blob from './Blob';

import Event from '../../src/private/webapis/dom/events/Event';
import {
  getEventHandlerAttribute,
  setEventHandlerAttribute,
} from '../../src/private/webapis/dom/events/EventHandlerAttributes';
import EventTarget from '../../src/private/webapis/dom/events/EventTarget';
import NativeFileReaderModule from './NativeFileReaderModule';
import {toByteArray} from 'base64-js';

type ReadyState =
  | 0 // EMPTY
  | 1 // LOADING
  | 2; // DONE

type ReaderResult = string | ArrayBuffer;

const EMPTY = 0;
const LOADING = 1;
const DONE = 2;

type FileReaderEventMap = $ReadOnly<{
  readystatechange: Event,
  abort: Event,
  error: Event,
  load: Event,
  loadend: Event,
}>;

class FileReader extends EventTarget<FileReaderEventMap> {
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
    this.dispatchEvent(new Event('readystatechange'));
    if (newState === DONE) {
      if (this._aborted) {
        this.dispatchEvent(new Event('abort'));
      } else if (this._error) {
        this.dispatchEvent(new Event('error'));
      } else {
        this.dispatchEvent(new Event('load'));
      }
      this.dispatchEvent(new Event('loadend'));
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

  get onabort(): EventCallback<Event> | null {
    return getEventHandlerAttribute(this, 'abort');
  }

  set onabort(listener: ?EventCallback<Event>) {
    setEventHandlerAttribute(this, 'abort', listener);
  }

  get onerror(): EventCallback<Event> | null {
    return getEventHandlerAttribute(this, 'error');
  }

  set onerror(listener: ?EventCallback<Event>) {
    setEventHandlerAttribute(this, 'error', listener);
  }

  get onload(): EventCallback<Event> | null {
    return getEventHandlerAttribute(this, 'load');
  }

  set onload(listener: ?EventCallback<Event>) {
    setEventHandlerAttribute(this, 'load', listener);
  }

  get onloadstart(): EventCallback<Event> | null {
    return getEventHandlerAttribute(this, 'loadstart');
  }

  set onloadstart(listener: ?EventCallback<Event>) {
    setEventHandlerAttribute(this, 'loadstart', listener);
  }

  get onloadend(): EventCallback<Event> | null {
    return getEventHandlerAttribute(this, 'loadend');
  }

  set onloadend(listener: ?EventCallback<Event>) {
    setEventHandlerAttribute(this, 'loadend', listener);
  }

  get onprogress(): EventCallback<Event> | null {
    return getEventHandlerAttribute(this, 'progress');
  }

  set onprogress(listener: ?EventCallback<Event>) {
    setEventHandlerAttribute(this, 'progress', listener);
  }
}

export default FileReader;
