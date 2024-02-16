/**
 * @format
 * @flow strict
 * @jsdoc
 */

import NativeXRModule from './NativeXRModule';

const XR = {
  requestSession: (sessionId?: string): Promise<void> => {
    if (NativeXRModule != null && NativeXRModule.requestSession != null) {
      return NativeXRModule.requestSession(sessionId);
    }
    return Promise.reject(new Error('NativeXRModule is not available'));
  },
  endSession: (): Promise<void> => {
    if (NativeXRModule != null && NativeXRModule.endSession != null) {
      return NativeXRModule.endSession();
    }
    return Promise.reject(new Error('NativeXRModule is not available'));
  },
  openWindow: (windowId: ?string, userInfo: ?Object): Promise<void> => {
    if (NativeXRModule != null && NativeXRModule.openWindow != null) {
      return NativeXRModule.openWindow(windowId, userInfo);
    }
    return Promise.reject(new Error('NativeXRModule is not available'));
  },
  closeWindow: (windowId: ?string): Promise<void> => {
    if (NativeXRModule != null && NativeXRModule.closeWindow != null) {
      return NativeXRModule.closeWindow(windowId);
    }
    return Promise.reject(new Error('NativeXRModule is not available'));
  },
  // $FlowIgnore[unsafe-getters-setters]
  get supportsMultipleScenes(): boolean {
    if (NativeXRModule == null) {
      return false;
    }

    const nativeConstants = NativeXRModule.getConstants();
    return nativeConstants.supportsMultipleScenes || false;
  },
};

module.exports = XR;
