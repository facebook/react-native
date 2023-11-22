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
  JsonPagesListResponse,
  JsonVersionResponse,
} from '../inspector-proxy/types';

import {fetchJson} from './FetchUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {withServerForEachTest} from './ServerUtils';

// Must be greater than or equal to PAGES_POLLING_INTERVAL in `InspectorProxy.js`.
const PAGES_POLLING_DELAY = 1000;

jest.useFakeTimers();

// TODO T169943794
xdescribe('inspector proxy HTTP API', () => {
  const serverRef = withServerForEachTest({
    logger: undefined,
    projectRoot: '',
  });
  const autoCleanup = withAbortSignalForEachTest();
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/json/version endpoint', () => {
    test('returns version', async () => {
      const json = await fetchJson<JsonVersionResponse>(
        `${serverRef.serverBaseUrl}/json/version`,
      );
      expect(json).toMatchSnapshot();
    });
  });

  describe.each(['/json', '/json/list'])('%s endpoint', endpoint => {
    test('empty on start', async () => {
      const json = await fetchJson<JsonPagesListResponse>(
        `${serverRef.serverBaseUrl}${endpoint}`,
      );
      expect(json).toEqual([]);
    });

    test('updates page details through polling', async () => {
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

        jest.advanceTimersByTime(PAGES_POLLING_DELAY);

        const jsonBefore = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}${endpoint}`,
        );

        device1.getPages.mockImplementation(() => [
          {
            app: 'bar-app',
            id: 'page1-updated',
            title: 'bar-title-updated',
            vm: 'bar-vm-updated',
          },
        ]);

        jest.advanceTimersByTime(PAGES_POLLING_DELAY);

        const jsonAfter = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}${endpoint}`,
        );

        expect(jsonBefore).toEqual([
          expect.objectContaining({
            id: 'device1-page1',
            title: 'bar-title',
            vm: 'bar-vm',
          }),
        ]);

        expect(jsonAfter).toEqual([
          expect.objectContaining({
            id: 'device1-page1-updated',
            title: 'bar-title-updated',
            vm: 'bar-vm-updated',
          }),
        ]);
      } finally {
        device1.close();
      }
    });

    test('returns to empty on device disconnect', async () => {
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

        jest.advanceTimersByTime(PAGES_POLLING_DELAY);

        const jsonBefore = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}${endpoint}`,
        );

        device1.close();

        const jsonAfter = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}${endpoint}`,
        );

        expect(jsonBefore).toEqual([
          expect.objectContaining({
            id: 'device1-page1',
            title: 'bar-title',
            vm: 'bar-vm',
          }),
        ]);

        expect(jsonAfter).toEqual([]);
      } finally {
        device1.close();
      }
    });

    test('reports pages from two connected devices', async () => {
      const device1 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );

      device1.getPages.mockImplementation(() => [
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        },
      ]);

      const device2 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device2&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device2.getPages.mockImplementation(() => [
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        },
      ]);

      // Ensure polling has happened a few times
      jest.advanceTimersByTime(10 * PAGES_POLLING_DELAY);

      try {
        const json = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}${endpoint}`,
        );
        expect(json).toEqual([
          {
            description: 'bar-app',
            deviceName: 'foo',
            devtoolsFrontendUrl: expect.any(String),
            faviconUrl: 'https://reactjs.org/favicon.ico',
            id: 'device1-page1',
            reactNative: {
              logicalDeviceId: 'device1',
            },
            title: 'bar-title',
            type: 'node',
            vm: 'bar-vm',
            webSocketDebuggerUrl: expect.any(String),
          },
          {
            description: 'bar-app',
            deviceName: 'foo',
            devtoolsFrontendUrl: expect.any(String),
            faviconUrl: 'https://reactjs.org/favicon.ico',
            id: 'device2-page1',
            reactNative: {
              logicalDeviceId: 'device2',
            },
            title: 'bar-title',
            type: 'node',
            vm: 'bar-vm',
            webSocketDebuggerUrl: expect.any(String),
          },
        ]);
      } finally {
        device1.close();
        device2.close();
      }
    });

    describe('HTTP vs HTTPS', () => {
      const secureServerRef = withServerForEachTest({
        logger: undefined,
        projectRoot: '',
        secure: true,
      });

      test('uses `wss` scheme and param if server is HTTPS', async () => {
        const page = {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        };

        let deviceHttp, deviceHttps;

        try {
          deviceHttp = await createDeviceMock(
            `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
            autoCleanup.signal,
          );
          deviceHttp.getPages.mockImplementation(() => [page]);

          deviceHttps = await createDeviceMock(
            `${secureServerRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
            autoCleanup.signal,
          );
          deviceHttps.getPages.mockImplementation(() => [page]);

          jest.advanceTimersByTime(PAGES_POLLING_DELAY);

          const [pageHttp] = await fetchJson<JsonPagesListResponse>(
            `${serverRef.serverBaseUrl}${endpoint}`,
          );
          const [pageHttps] = await fetchJson<JsonPagesListResponse>(
            `${secureServerRef.serverBaseUrl}${endpoint}`,
          );

          expect(pageHttp.webSocketDebuggerUrl).toMatch(/^ws:\/\//);
          expect(pageHttps.webSocketDebuggerUrl).toMatch(/^wss:\/\//);
          expect(pageHttp.devtoolsFrontendUrl).toMatch(/[&?]ws=/);
          expect(pageHttps.devtoolsFrontendUrl).toMatch(/[&?]wss=/);
        } finally {
          deviceHttp?.close();
          deviceHttps?.close();
        }
      });
    });
  });
});
