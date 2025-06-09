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

import DefaultBrowserLauncher from '../utils/DefaultBrowserLauncher';
import {fetchJson, requestLocal} from './FetchUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {withServerForEachTest} from './ServerUtils';

// Must be greater than PAGES_POLLING_INTERVAL in `Device.js`
const PAGES_POLLING_DELAY = 2100;

jest.useFakeTimers();

describe('enableStandaloneFuseboxShell experiment', () => {
  const BrowserLauncherWithFuseboxShell = {
    ...DefaultBrowserLauncher,
    unstable_showFuseboxShell: () => {
      throw new Error('Not implemented');
    },
  };
  const serverRef = withServerForEachTest({
    logger: undefined,
    projectRoot: '',
    unstable_browserLauncher: BrowserLauncherWithFuseboxShell,
    unstable_experiments: {
      enableStandaloneFuseboxShell: true,
    },
  });
  const autoCleanup = withAbortSignalForEachTest();
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/open-debugger endpoint', () => {
    test('launches the shell with a frontend URL and stable window key', async () => {
      // Connect a device to use when opening the debugger
      const device = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device.getPages.mockImplementation(() => [
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
          capabilities: {
            // Ensure the device target can be found when launching the debugger
            nativePageReloads: true,
            // Mark as Fusebox
            prefersFuseboxFrontend: true,
          },
        },
      ]);
      jest.advanceTimersByTime(PAGES_POLLING_DELAY);

      const launchDebuggerAppWindowSpy = jest
        .spyOn(BrowserLauncherWithFuseboxShell, 'launchDebuggerAppWindow')
        .mockResolvedValue();
      const showFuseboxShellSpy = jest
        .spyOn(BrowserLauncherWithFuseboxShell, 'unstable_showFuseboxShell')
        .mockResolvedValue();

      try {
        // Fetch the target information for the device
        const pageListResponse = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}/json`,
        );
        // Select the first target from the page list response
        expect(pageListResponse.length).toBeGreaterThanOrEqual(1);
        const firstPage = pageListResponse[0];

        // Build the URL for the debugger
        const openUrl = new URL('/open-debugger', serverRef.serverBaseUrl);
        openUrl.searchParams.set('launchId', 'launch1');
        openUrl.searchParams.set(
          'device',
          firstPage.reactNative.logicalDeviceId,
        );
        openUrl.searchParams.set('target', firstPage.id);
        // Request to open the debugger for the first device
        {
          const response = await requestLocal(openUrl.toString(), {
            method: 'POST',
          });
          // Ensure the request was handled properly
          expect(response.statusCode).toBe(200);
        }
        openUrl.searchParams.set('launchId', 'launch1');

        // Ensure the debugger was launched using the standalone shell API
        expect(showFuseboxShellSpy).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
        );
        const firstWindowKey = showFuseboxShellSpy.mock.calls[0][1];

        showFuseboxShellSpy.mockClear();
        openUrl.searchParams.set('launchId', 'launch2');

        {
          const response = await requestLocal(openUrl.toString(), {
            method: 'POST',
          });
          // Ensure the request was handled properly
          expect(response.statusCode).toBe(200);
        }
        // Ensure the debugger was launched using the standalone shell API and the same window key
        expect(showFuseboxShellSpy).toHaveBeenCalledWith(
          expect.any(String),
          firstWindowKey,
        );

        expect(launchDebuggerAppWindowSpy).not.toHaveBeenCalled();
      } finally {
        device.close();
      }
    });
  });
});
