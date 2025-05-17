/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  GetPagesResponse,
  JsonPagesListResponse,
} from '../inspector-proxy/types';
import type {DeviceMock} from './InspectorDeviceUtils';

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

const PAGE_DEFAULTS = {
  app: 'bar-app',
  id: 'page1',
  title: 'bar-title',
  vm: 'bar-vm',
};

describe('inspector-proxy device socket handoff', () => {
  const serverRef = withServerForEachTest({
    logger: undefined,
    projectRoot: '',
  });
  const autoCleanup = withAbortSignalForEachTest();
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('device ID collision with no debugger connected', async () => {
    let device1, device2;
    try {
      ({device: device1} = await connectDevice(
        '/inspector/device?device=device&name=foo&app=bar',
        [
          {
            ...PAGE_DEFAULTS,
            vm: 'bar-vm',
          },
        ],
      ));

      ({device: device2} = await connectDevice(
        '/inspector/device?device=device&name=foo&app=bar',
        [
          {
            ...PAGE_DEFAULTS,
            vm: 'bar-vm-updated',
          },
        ],
      ));

      // There's no debugger-->page connection to disconnect.
      expect(device1.disconnect).not.toBeCalled();

      // NOTE: It seems arbitrary that we don't close device1's socket here,
      // but that is the current behavior.
      expect(device1.socket.readyState).toBe(/* OPEN */ 1);
    } finally {
      device1?.close();
      device2?.close();
    }
  });

  test('device ID collision with a debugger connected', async () => {
    let device1, device2, debugger_, webSocketDebuggerUrl;
    try {
      ({
        device: device1,
        pageList: [{webSocketDebuggerUrl}],
      } = await connectDevice(
        '/inspector/device?device=device&name=foo&app=bar',
        [
          {
            ...PAGE_DEFAULTS,
            vm: 'bar-vm',
          },
        ],
      ));

      debugger_ = await createDebuggerMock(
        webSocketDebuggerUrl,
        autoCleanup.signal,
      );

      ({device: device2} = await connectDevice(
        '/inspector/device?device=device&name=foo&app=bar',
        [
          {
            ...PAGE_DEFAULTS,
            vm: 'bar-vm-updated',
          },
        ],
      ));

      // Even having handed off the debugger connection to device2, we don't
      // send a `disconnect` event for it to device1. We may want to change
      // this behavior in the future.
      expect(device1.disconnect).not.toBeCalled();

      expect([
        // CLOSING
        3,
        // CLOSED
        4,
      ]).toContain(device1.socket.readyState);

      // We can successfully send a message from the debugger to device2, even
      // though the initial debugger connection was to device1.
      device1.wrappedEventParsed.mockClear();
      const receivedByDevice2 = await sendFromDebuggerToTarget(
        debugger_,
        device2,
        'page1',
        {
          method: 'Console.enable',
          id: 0,
        },
      );
      expect(receivedByDevice2).toEqual({
        method: 'Console.enable',
        id: 0,
      });
      expect(device1.wrappedEventParsed).not.toBeCalled();
    } finally {
      device1?.close();
      device2?.close();
      debugger_?.close();
    }
  });

  test.each([
    ['app', 'name'],
    ['name', 'app'],
  ])(
    'device ID collision with no debugger connected, same %s and differing %s',
    async (sameParam, differingParam) => {
      let device1, device2, debugger_, webSocketDebuggerUrl;
      try {
        ({device: device1} = await connectDevice(
          `/inspector/device?device=device&${sameParam}=foo&${differingParam}=bar`,
          [
            {
              ...PAGE_DEFAULTS,
              vm: 'bar-vm',
            },
          ],
        ));

        ({
          device: device2,
          pageList: [{webSocketDebuggerUrl}],
        } = await connectDevice(
          `/inspector/device?device=device&${sameParam}=foo&${differingParam}=BAZ`,
          [
            {
              ...PAGE_DEFAULTS,
              vm: 'bar-vm-updated',
            },
          ],
        ));

        expect([
          // CLOSING
          3,
          // CLOSED
          4,
        ]).toContain(device1.socket.readyState);

        debugger_ = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );

        device1.wrappedEventParsed.mockClear();
        const receivedByDevice2 = await sendFromDebuggerToTarget(
          debugger_,
          device2,
          'page1',
          {
            method: 'Console.enable',
            id: 0,
          },
        );
        expect(receivedByDevice2).toEqual({
          method: 'Console.enable',
          id: 0,
        });
        expect(device1.wrappedEventParsed).not.toBeCalled();
      } finally {
        device1?.close();
        device2?.close();
        debugger_?.close();
      }
    },
  );

  test.each([
    ['app', 'name'],
    ['name', 'app'],
  ])(
    'device ID collision with a debugger connected, same %s and differing %s',
    async (sameParam, differingParam) => {
      let device1, device2, debugger_, webSocketDebuggerUrl;
      try {
        ({
          device: device1,
          pageList: [{webSocketDebuggerUrl}],
        } = await connectDevice(
          `/inspector/device?device=device&${sameParam}=foo&${differingParam}=bar`,
          [
            {
              ...PAGE_DEFAULTS,
              vm: 'bar-vm',
            },
          ],
        ));
        debugger_ = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );
        ({
          device: device2,
          pageList: [{webSocketDebuggerUrl}],
        } = await connectDevice(
          `/inspector/device?device=device&${sameParam}=foo&${differingParam}=BAZ`,
          [
            {
              ...PAGE_DEFAULTS,
              vm: 'bar-vm-updated',
            },
          ],
        ));

        expect([
          // CLOSING
          3,
          // CLOSED
          4,
        ]).toContain(debugger_.socket.readyState);

        // NOTE: It seems arbitrary that we don't send a `disconnect` message to
        // device1.
        expect(device1.disconnect).not.toBeCalled();

        expect([
          // CLOSING
          3,
          // CLOSED
          4,
        ]).toContain(device1.socket.readyState);

        debugger_ = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );
        device1.wrappedEventParsed.mockClear();
        const receivedByDevice2 = await sendFromDebuggerToTarget(
          debugger_,
          device2,
          'page1',
          {
            method: 'Console.enable',
            id: 0,
          },
        );
        expect(receivedByDevice2).toEqual({
          method: 'Console.enable',
          id: 0,
        });
        expect(device1.wrappedEventParsed).not.toBeCalled();
      } finally {
        device1?.close();
        device2?.close();
        debugger_?.close();
      }
    },
  );

  // Helper function to create a DeviceMock and wait for its pages to be
  // reported by /json.
  async function connectDevice(
    wsUrlPath: string,
    pageListSpec: GetPagesResponse['payload'],
  ): Promise<{
    device: DeviceMock,
    pageList: JsonPagesListResponse,
  }> {
    let device;
    try {
      device = await createDeviceMock(
        serverRef.serverBaseWsUrl + wsUrlPath,
        autoCleanup.signal,
      );
      device.getPages.mockImplementation(() => pageListSpec);
      let pageList: JsonPagesListResponse = [];
      await until(async () => {
        pageList = (await fetchJson(
          `${serverRef.serverBaseUrl}/json`,
          // $FlowIgnore[unclear-type]
        ): any);
        expect(pageList).toEqual(
          expect.arrayContaining(
            pageListSpec.map(pageSpec =>
              expect.objectContaining({
                description: pageSpec.app,
                id: expect.stringContaining(pageSpec.id),
                title: pageSpec.title,
                vm: pageSpec.vm,
              }),
            ),
          ),
        );
      });
      return {
        device,
        pageList,
      };
    } catch (e) {
      device?.close();
      throw e;
    }
  }
});
