/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import nullthrows from 'nullthrows';

const DEBUGGER_STARTUP_TIMEOUT_MS = 30_000;

export default async function openDebugger<T>(
  testerDone: Promise<T>,
): Promise<void> {
  const serverBaseUrl = `http://localhost:${nullthrows(process.env.__FANTOM_METRO_PORT__)}`;
  const controller = new AbortController();
  let abortReason = 'Fantom tester exited before DevTools finished opening';
  void testerDone.then(() => {
    controller.abort();
  });
  const timeout = setTimeout(() => {
    abortReason = 'Timed out waiting for Fantom DevTools to open';
    controller.abort();
  }, DEBUGGER_STARTUP_TIMEOUT_MS);

  try {
    while (!controller.signal.aborted) {
      const response = await fetch(`${serverBaseUrl}/json/list`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(
          `Could not list Fantom debugger targets: HTTP ${response.status}`,
        );
      }
      const targets: Array<{id: string, appId: string, ...}> =
        await response.json();
      const target = targets.find(
        candidate => candidate.appId === 'com.meta.reactnative.fantom',
      );
      if (target != null) {
        const url = new URL('/open-debugger', serverBaseUrl);
        url.searchParams.set('target', target.id);
        const launchResponse = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
        });
        if (!launchResponse.ok) {
          throw new Error(
            `Could not open Fantom DevTools: HTTP ${launchResponse.status}`,
          );
        }
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(abortReason);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(abortReason);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
