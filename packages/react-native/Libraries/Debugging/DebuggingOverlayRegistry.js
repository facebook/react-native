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

import type {AppContainerRootViewRef} from '../ReactNative/AppContainer-dev';

export type DebuggingOverlayRegistrySubscriberProtocol = {
  rootViewRef: AppContainerRootViewRef,
};

class DebuggingOverlayRegistry {
  #registry: Set<DebuggingOverlayRegistrySubscriberProtocol> = new Set();

  subscribe(subscriber: DebuggingOverlayRegistrySubscriberProtocol) {
    this.#registry.add(subscriber);
  }

  unsubscribe(subscriber: DebuggingOverlayRegistrySubscriberProtocol) {
    const wasPresent = this.#registry.delete(subscriber);
    if (!wasPresent) {
      console.error(
        '[DebuggingOverlayRegistry] Unexpected argument for unsubscription, which was not previously subscribed:',
        subscriber,
      );
    }
  }
}

const debuggingOverlayRegistryInstance: DebuggingOverlayRegistry =
  new DebuggingOverlayRegistry();
export default debuggingOverlayRegistryInstance;
