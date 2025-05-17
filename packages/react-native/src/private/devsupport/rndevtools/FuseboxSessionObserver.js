/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

class FuseboxSessionObserver {
  #hasNativeSupport: boolean;

  constructor() {
    this.#hasNativeSupport = global.hasOwnProperty(
      '__DEBUGGER_SESSION_OBSERVER__',
    );
  }

  hasActiveSession(): boolean {
    if (!this.#hasNativeSupport) {
      return false;
    }

    return global.__DEBUGGER_SESSION_OBSERVER__.hasActiveSession;
  }

  subscribe(callback: (status: boolean) => void): () => void {
    if (!this.#hasNativeSupport) {
      return () => {};
    }

    global.__DEBUGGER_SESSION_OBSERVER__.subscribers.add(callback);
    return () => {
      global.__DEBUGGER_SESSION_OBSERVER__.subscribers.delete(callback);
    };
  }
}

const observerInstance: FuseboxSessionObserver = new FuseboxSessionObserver();
export default observerInstance;
