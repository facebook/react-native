/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// $FlowFixMe[prop-missing]
const {contextBridge, ipcRenderer} = require('electron');

contextBridge.executeInMainWorld({
  func: ipcDevTools => {
    let didDecorateInspectorFrontendHostInstance = false;
    // reactNativeDecorateInspectorFrontendHostInstance was introduced in
    // https://github.com/facebook/react-native-devtools-frontend/pull/168
    // $FlowIgnore[prop-missing]
    globalThis.reactNativeDecorateInspectorFrontendHostInstance = (
      InspectorFrontendHostInstance: $FlowFixMe,
    ) => {
      didDecorateInspectorFrontendHostInstance = true;
      InspectorFrontendHostInstance.bringToFront = () => {
        ipcDevTools.bringToFront();
      };
    };

    document.addEventListener('DOMContentLoaded', () => {
      if (!didDecorateInspectorFrontendHostInstance) {
        console.error(
          'reactNativeDecorateInspectorFrontendHostInstance was not called at startup. ' +
            'This version of the DevTools frontend may not be compatible with @react-native/debugger-shell.',
        );
      }
    });
  },
  args: [
    {
      bringToFront() {
        ipcRenderer.send('bringToFront');
      },
    },
  ],
});
