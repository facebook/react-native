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

import type {
  ConnectRequest,
  DisconnectRequest,
  GetPagesRequest,
  GetPagesResponse,
  JSONSerializable,
  MessageFromDevice,
  MessageToDevice,
  WrappedEvent,
} from '../inspector-proxy/types';

import WebSocket from 'ws';

export class DeviceAgent {
  _ws: ?WebSocket;
  _readyPromise: Promise<void>;

  constructor(url: string, signal?: AbortSignal) {
    const ws = new WebSocket(url, {
      // The mock server uses a self-signed certificate.
      rejectUnauthorized: false,
    });
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

  __handle(message: MessageToDevice): void {}

  send(message: MessageFromDevice) {
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

  sendWrappedEvent(pageId: string, event: JSONSerializable) {
    this.send({
      event: 'wrappedEvent',
      payload: {
        pageId,
        wrappedEvent: JSON.stringify(event),
      },
    });
  }
}

export class DeviceMock extends DeviceAgent {
  // Empty handlers
  +connect: JestMockFn<[message: ConnectRequest], void> = jest.fn();
  +disconnect: JestMockFn<[message: DisconnectRequest], void> = jest.fn();
  +getPages: JestMockFn<
    [message: GetPagesRequest],
    | GetPagesResponse['payload']
    | Promise<GetPagesResponse['payload'] | void>
    | void,
  > = jest.fn();
  +wrappedEvent: JestMockFn<[message: WrappedEvent], void> = jest.fn();
  +wrappedEventParsed: JestMockFn<
    [payload: {...WrappedEvent['payload'], wrappedEvent: JSONSerializable}],
    void,
  > = jest.fn();

  __handle(message: MessageToDevice): void {
    switch (message.event) {
      case 'connect':
        this.connect(message);
        break;
      case 'disconnect':
        this.disconnect(message);
        break;
      case 'getPages':
        const result = this.getPages(message);
        this._sendPayloadIfNonNull('getPages', result);
        break;
      case 'wrappedEvent':
        this.wrappedEvent(message);
        this.wrappedEventParsed({
          ...message.payload,
          wrappedEvent: JSON.parse(message.payload.wrappedEvent),
        });
        break;
      default:
        (message: empty);
        throw new Error(`Unhandled event ${message.event}`);
    }
  }

  _sendPayloadIfNonNull<Event: MessageFromDevice['event']>(
    event: Event,
    maybePayload:
      | MessageFromDevice['payload']
      | Promise<MessageFromDevice['payload'] | void>
      | void,
  ) {
    if (maybePayload == null) {
      return;
    }
    if (maybePayload instanceof Promise) {
      // eslint-disable-next-line no-void
      void maybePayload.then(payload => {
        if (!payload) {
          return;
        }
        // $FlowFixMe[incompatible-call] TODO(moti) Figure out the right way to type maybePayload generically
        this.send({event, payload});
      });
      return;
    }
    // $FlowFixMe[incompatible-call] TODO(moti) Figure out the right way to type maybePayload generically
    this.send({event, payload: maybePayload});
  }
}

export async function createDeviceMock(
  url: string,
  signal: AbortSignal,
): Promise<DeviceMock> {
  const device = new DeviceMock(url, signal);
  await device.ready();
  return device;
}
