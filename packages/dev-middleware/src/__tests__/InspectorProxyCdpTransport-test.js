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
  JsonPagesListResponse,
  PageDescription,
} from '../inspector-proxy/types';

import {fetchJson} from './FetchUtils';
import {createDebuggerMock} from './InspectorDebuggerUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {sendFromDebuggerToTarget} from './InspectorProtocolUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {withServerForEachTest} from './ServerUtils';
import until from 'wait-for-expect';

// WebSocket is unreliable when using fake timers.
jest.useRealTimers();

jest.setTimeout(10000);

describe.each(['HTTP', 'HTTPS'])(
  'inspector proxy CDP transport over %s',
  protocol => {
    const serverRef = withServerForEachTest({
      logger: undefined,
      projectRoot: '',
      secure: protocol === 'HTTPS',
    });
    const autoCleanup = withAbortSignalForEachTest();
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('connection/disconnection and message from debugger to device', async () => {
      const device1 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      try {
        device1.getPages.mockImplementation(() => [
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        ]);

        let pageList: JsonPagesListResponse = [];
        await until(async () => {
          pageList = (await fetchJson(
            `${serverRef.serverBaseUrl}/json`,
            // $FlowIgnore[unclear-type]
          ): any);
          expect(pageList).toHaveLength(1);
        });
        const [{webSocketDebuggerUrl}] = pageList;
        expect(webSocketDebuggerUrl).toBeDefined();

        const debugger_ = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );
        try {
          await until(() => expect(device1.connect).toBeCalled());

          debugger_.send({
            method: 'Runtime.enable',
            id: 0,
          });

          await until(() => expect(device1.wrappedEvent).toBeCalled());

          expect(device1.wrappedEventParsed).toBeCalledWith({
            pageId: 'page1',
            wrappedEvent: {
              method: 'Runtime.enable',
              id: 0,
            },
          });

          debugger_.close();

          await until(() => expect(device1.disconnect).toBeCalled());
        } finally {
          debugger_.close();
        }
      } finally {
        device1.close();
      }
    });

    test('message and disconnection from device to debugger', async () => {
      const device1 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      try {
        device1.getPages.mockImplementation(() => [
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        ]);

        let pageList: Array<PageDescription> = [];
        await until(async () => {
          pageList = (await fetchJson(
            `${serverRef.serverBaseUrl}/json`,
            // $FlowIgnore[unclear-type]
          ): any);
          expect(pageList).toHaveLength(1);
        });
        const [{webSocketDebuggerUrl}] = pageList;
        expect(webSocketDebuggerUrl).toBeDefined();

        const debugger_ = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );
        let debuggerSocketClosed = false;
        debugger_.socket.once('close', () => {
          debuggerSocketClosed = true;
        });
        try {
          await until(() => expect(device1.connect).toBeCalled());

          device1.sendWrappedEvent('page1', {
            id: 0,
          });

          await until(() => expect(debugger_.handle).toBeCalledWith({id: 0}));

          device1.close();

          await until(() => expect(debuggerSocketClosed).toBe(true));
        } finally {
          debugger_.close();
        }
      } finally {
        device1.close();
      }
    });

    test('multiple debuggers to the same page on the same device', async () => {
      let device, debugger1, debugger2;
      try {
        // Connect a device to the proxy.
        device = await createDeviceMock(
          `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
          autoCleanup.signal,
        );
        // Capture a log of events so we can assert on their order later.
        const events: Array<
          | ConnectRequest
          | DisconnectRequest
          | {event: 'create-debugger-mock', name: string},
        > = [];
        device.disconnect.mockImplementation(message => {
          events.push(message);
        });
        device.connect.mockImplementation(message => {
          events.push(message);
        });
        // Set up the page.
        device.getPages.mockImplementation(() => [
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        ]);
        let pageList: Array<PageDescription> = [];
        await until(async () => {
          pageList = (await fetchJson(
            `${serverRef.serverBaseUrl}/json`,
            // $FlowIgnore[unclear-type]
          ): any);
          expect(pageList).toHaveLength(1);
        });
        const [{webSocketDebuggerUrl}] = pageList;

        // Connect the first debugger and send a message.
        events.push({event: 'create-debugger-mock', name: 'debugger1'});
        debugger1 = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );
        await sendFromDebuggerToTarget(debugger1, device, 'page1', {
          method: 'Runtime.enable',
          id: 0,
        });

        // Connect the second debugger.
        events.push({event: 'create-debugger-mock', name: 'debugger2'});
        debugger2 = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );

        // The first debugger gets disconnected. TODO: In the future, we should
        // amend the protocol to allow for multiple debuggers to connect at the
        // same time.
        await until(async () => {
          expect([
            // CLOSING
            3,
            // CLOSED
            4,
          ]).toContain(debugger1.socket.readyState);
        });

        // Send a message from the second debugger.
        await sendFromDebuggerToTarget(debugger2, device, 'page1', {
          method: 'Debugger.enable',
          id: 1,
        });

        // Check the order of `connect` and `disconnect` events received by the
        // device. `create-debugger-mock` events are included for convenience.
        expect(events).toEqual([
          {
            event: 'create-debugger-mock',
            name: 'debugger1',
          },
          {
            event: 'connect',
            payload: {
              pageId: 'page1',
            },
          },
          {
            event: 'create-debugger-mock',
            name: 'debugger2',
          },
          // FIXME: We currently send `connect` (for debugger2) before
          // `disconnect` (for debugger1), which is wrong - it leaves the
          // device thinking the connection is gone while the proxy keeps the
          // debugger connection open. The user of debugger2 sees the frontend
          // in a "zombie" state (not disconnected, but unresponsive).
          {
            event: 'connect',
            payload: {
              pageId: 'page1',
            },
          },
          {
            event: 'disconnect',
            payload: {
              pageId: 'page1',
            },
          },
        ]);
      } finally {
        device?.close();
        debugger1?.close();
        debugger2?.close();
      }
    });
  },
);
