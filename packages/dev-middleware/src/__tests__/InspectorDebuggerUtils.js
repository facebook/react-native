/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {JSONSerializable} from '../inspector-proxy/types';

import nullthrows from 'nullthrows';
import WebSocket from 'ws';

export class DebuggerAgent {
  _ws: ?WebSocket;
  _readyPromise: Promise<void>;

  constructor(url: string, signal?: AbortSignal) {
    const ws = new WebSocket(url);
    this._ws = ws;
    ws.on('message', data => {
      this.__handle(JSON.parse(data.toString()));
    });
    if (signal != null) {
      signal.addEventListener('abort', () => {
        this.close();
      });
    }
    this._readyPromise = new Promise<void>((resolve, reject) => {
      ws.once('open', () => {
        resolve();
      });
      ws.once('error', error => {
        reject(error);
      });
    });
  }

  __handle(message: JSONSerializable): void {}

  send(message: JSONSerializable) {
    if (!this._ws) {
      return;
    }
    this._ws.send(JSON.stringify(message));
  }

  ready(): Promise<void> {
    return this._readyPromise;
  }

  close() {
    if (!this._ws) {
      return;
    }
    try {
      this._ws.terminate();
    } catch {}
    this._ws = null;
  }

  // $FlowIgnore[unsafe-getters-setters]
  get socket(): WebSocket {
    return nullthrows(this._ws);
  }
}

export class DebuggerMock extends DebuggerAgent {
  // Empty handlers
  +handle: JestMockFn<[message: JSONSerializable], void> = jest.fn();

  __handle(message: JSONSerializable): void {
    this.handle(message);
  }
}

export async function createDebuggerMock(
  url: string,
  signal: AbortSignal,
): Promise<DebuggerMock> {
  const debuggerMock = new DebuggerMock(url, signal);
  await debuggerMock.ready();
  return debuggerMock;
}
