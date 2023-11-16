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

import type {PageDescription} from '../inspector-proxy/types';

import {fetchJson} from './FetchUtils';
import {createDebuggerMock} from './InspectorDebuggerUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {withServerForEachTest} from './ServerUtils';
import until from 'wait-for-expect';

// WebSocket is unreliable when using fake timers.
jest.useRealTimers();

jest.setTimeout(10000);

// TODO T169943794
xdescribe.each(['HTTP', 'HTTPS'])(
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
  },
);
