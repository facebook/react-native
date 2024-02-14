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

import getDevToolsFrontendUrl from '../utils/getDevToolsFrontendUrl';

describe('getDevToolsFrontendUrl', () => {
  const webSocketDebuggerUrl =
    'ws://localhost:8081/inspector/debug?device=1a9372c&page=-1';

  describe('given an absolute devServerUrl', () => {
    const devServerUrl = 'http://localhost:8081';

    it('should return a valid url for all experiments off', async () => {
      const experiments = {
        enableNetworkInspector: false,
        enableNewDebugger: false,
        enableOpenDebuggerRedirect: false,
      };
      const actual = getDevToolsFrontendUrl(
        experiments,
        webSocketDebuggerUrl,
        devServerUrl,
      );
      const decoded = decodeURIComponent(actual);
      const doubleDecoded = decodeURIComponent(decoded);
      expect(decoded).toBe(doubleDecoded);
      expect(actual).toMatchInlineSnapshot(
        `"http://localhost:8081/debugger-frontend/rn_inspector.html?ws=localhost%3A8081%2Finspector%2Fdebug%3Fdevice%3D1a9372c%26page%3D-1&sources.hide_add_folder=true"`,
      );
    });

    it('should return a valid url for enableNetworkInspector experiment on', async () => {
      const experiments = {
        enableNetworkInspector: true,
        enableNewDebugger: true,
        enableOpenDebuggerRedirect: false,
      };
      const actual = getDevToolsFrontendUrl(
        experiments,
        webSocketDebuggerUrl,
        devServerUrl,
      );
      const decoded = decodeURIComponent(actual);
      const doubleDecoded = decodeURIComponent(decoded);
      expect(decoded).toBe(doubleDecoded);
      expect(actual).toMatchInlineSnapshot(
        `"http://localhost:8081/debugger-frontend/rn_inspector.html?ws=localhost%3A8081%2Finspector%2Fdebug%3Fdevice%3D1a9372c%26page%3D-1&sources.hide_add_folder=true&unstable_enableNetworkPanel=true"`,
      );
    });
  });

  describe('given a relative devServerUrl', () => {
    const devServerUrl = '';

    it('should return a valid url for all experiments off', async () => {
      const experiments = {
        enableNetworkInspector: false,
        enableNewDebugger: false,
        enableOpenDebuggerRedirect: false,
      };
      const actual = getDevToolsFrontendUrl(
        experiments,
        webSocketDebuggerUrl,
        devServerUrl,
      );
      const decoded = decodeURIComponent(actual);
      const doubleDecoded = decodeURIComponent(decoded);
      expect(decoded).toBe(doubleDecoded);
      expect(actual).toMatchInlineSnapshot(
        `"/debugger-frontend/rn_inspector.html?ws=localhost%3A8081%2Finspector%2Fdebug%3Fdevice%3D1a9372c%26page%3D-1&sources.hide_add_folder=true"`,
      );
    });

    it('should return a valid url for enableNetworkInspector experiment on', async () => {
      const experiments = {
        enableNetworkInspector: true,
        enableNewDebugger: true,
        enableOpenDebuggerRedirect: false,
      };
      const actual = getDevToolsFrontendUrl(
        experiments,
        webSocketDebuggerUrl,
        devServerUrl,
      );
      const decoded = decodeURIComponent(actual);
      const doubleDecoded = decodeURIComponent(decoded);
      expect(decoded).toBe(doubleDecoded);
      expect(actual).toMatchInlineSnapshot(
        `"/debugger-frontend/rn_inspector.html?ws=localhost%3A8081%2Finspector%2Fdebug%3Fdevice%3D1a9372c%26page%3D-1&sources.hide_add_folder=true&unstable_enableNetworkPanel=true"`,
      );
    });
  });
});
