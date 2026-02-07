/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {JsonPagesListResponse} from '../inspector-proxy/types';
import type {DebuggerShellPreparationResult} from '../types/BrowserLauncher';

import DefaultBrowserLauncher from '../utils/DefaultBrowserLauncher';
import {fetchJson, requestLocal} from './FetchUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {withServerForEachTest} from './ServerUtils';

// Must be greater than PAGES_POLLING_INTERVAL in `Device.js`
const PAGES_POLLING_DELAY = 2100;

jest.useFakeTimers();

async function setupDevice(
  serverRef: {+serverBaseWsUrl: string, ...},
  signal: AbortSignal,
) {
  const device = await createDeviceMock(
    `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
    signal,
  );
  device.getPages.mockImplementation(() => [
    {
      app: 'bar-app',
      id: 'page1',
      title: 'bar-title',
      vm: 'bar-vm',
      capabilities: {
        nativePageReloads: true,
        prefersFuseboxFrontend: true,
      },
    },
  ]);
  jest.advanceTimersByTime(PAGES_POLLING_DELAY);

  return device;
}

describe('enableStandaloneFuseboxShell experiment', () => {
  const launchDebuggerAppWindow = jest.fn(async (_): Promise<void> => {});
  const unstable_showFuseboxShell = jest.fn(async (_, __): Promise<void> => {});

  const autoCleanup = withAbortSignalForEachTest();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/open-debugger endpoint', () => {
    describe('success', () => {
      const unstable_prepareFuseboxShell = jest.fn(
        async (): Promise<DebuggerShellPreparationResult> => ({
          code: 'not_implemented',
        }),
      );
      const successfulServer = withServerForEachTest({
        logger: undefined,
        unstable_browserLauncher: {
          ...DefaultBrowserLauncher,
          launchDebuggerAppWindow,
          unstable_showFuseboxShell,
          unstable_prepareFuseboxShell,
        },
        unstable_experiments: {
          enableStandaloneFuseboxShell: true,
        },
      });

      test('launches the shell with a frontend URL and stable window key', async () => {
        // Connect a device to use when opening the debugger
        const device = await setupDevice(successfulServer, autoCleanup.signal);

        try {
          // Fetch the target information for the device
          const pageListResponse = await fetchJson<JsonPagesListResponse>(
            `${successfulServer.serverBaseUrl}/json`,
          );
          // Select the first target from the page list response
          expect(pageListResponse.length).toBeGreaterThanOrEqual(1);
          const firstPage = pageListResponse[0];

          // Build the URL for the debugger
          const openUrl = new URL(
            '/open-debugger',
            successfulServer.serverBaseUrl,
          );
          openUrl.searchParams.set('launchId', 'launch1');
          openUrl.searchParams.set(
            'device',
            firstPage.reactNative.logicalDeviceId,
          );
          openUrl.searchParams.set('target', firstPage.id);
          // Request to open the debugger for the first device
          const response = await requestLocal(openUrl.toString(), {
            method: 'POST',
          });

          // Ensure the request was handled properly
          expect(response.statusCode).toBe(200);

          // Ensure the debugger preparation function was called
          expect(unstable_prepareFuseboxShell).toHaveBeenCalled();

          // Ensure the debugger was launched using the standalone shell API
          expect(unstable_showFuseboxShell).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
          );

          // No call to the regular browser launcher since standalone shell should be used
          expect(launchDebuggerAppWindow).not.toHaveBeenCalled();

          const firstWindowKey = unstable_showFuseboxShell.mock.calls[0][1];

          unstable_showFuseboxShell.mockClear();
          openUrl.searchParams.set('launchId', 'launch2');

          const anotherResponse = await requestLocal(openUrl.toString(), {
            method: 'POST',
          });

          // Ensure the request was handled properly
          expect(anotherResponse.statusCode).toBe(200);

          // Ensure the debugger was launched using the standalone shell API and the same window key
          expect(unstable_showFuseboxShell).toHaveBeenCalledWith(
            expect.any(String),
            firstWindowKey,
          );

          // No fallback needed
          expect(launchDebuggerAppWindow).not.toHaveBeenCalled();
        } finally {
          device.close();
        }
      });
    });

    describe('unstable_prepareFuseboxShell failures', () => {
      const unstable_prepareFuseboxShell = jest.fn(
        async (): Promise<DebuggerShellPreparationResult> => ({
          code: 'platform_not_supported',
        }),
      );
      const failingServerRef = withServerForEachTest({
        logger: undefined,
        unstable_browserLauncher: {
          ...DefaultBrowserLauncher,
          launchDebuggerAppWindow,
          unstable_showFuseboxShell,
          unstable_prepareFuseboxShell,
        },
        unstable_experiments: {
          enableStandaloneFuseboxShell: true,
        },
      });

      test('falls back to browser window when preparation fails', async () => {
        // Connect a device to use when opening the debugger
        const device = await setupDevice(failingServerRef, autoCleanup.signal);

        try {
          // Fetch the target information for the device
          const pageListResponse = await fetchJson<JsonPagesListResponse>(
            `${failingServerRef.serverBaseUrl}/json`,
          );
          // Select the first target from the page list response
          expect(pageListResponse.length).toBeGreaterThanOrEqual(1);
          const firstPage = pageListResponse[0];

          // Build the URL for the debugger
          const openUrl = new URL(
            '/open-debugger',
            failingServerRef.serverBaseUrl,
          );
          openUrl.searchParams.set('launchId', 'launch1');
          openUrl.searchParams.set(
            'device',
            firstPage.reactNative.logicalDeviceId,
          );
          openUrl.searchParams.set('target', firstPage.id);

          // Request to open the debugger for the first device
          const response = await requestLocal(openUrl.toString(), {
            method: 'POST',
          });

          // Ensure the request was handled properly
          expect(response.statusCode).toBe(200);

          // Debugger was launched but will fail to prepare standalone shell
          expect(unstable_prepareFuseboxShell).toHaveBeenCalled();

          // Debugger is not launched with standalone shell since preparation failed
          expect(unstable_showFuseboxShell).not.toHaveBeenCalled();

          // Debugger fallback
          expect(launchDebuggerAppWindow).toHaveBeenCalled();
        } finally {
          device.close();
        }
      });
    });
  });
});
