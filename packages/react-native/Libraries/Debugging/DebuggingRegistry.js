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

export type DebuggingRegistrySubscriberProtocol = {
  rootViewRef: AppContainerRootViewRef,
};

class DebuggingRegistry {
  #registry: Set<DebuggingRegistrySubscriberProtocol> = new Set();

  subscribe(subscriber: DebuggingRegistrySubscriberProtocol) {
    this.#registry.add(subscriber);
  }

  unsubscribe(subscriber: DebuggingRegistrySubscriberProtocol) {
    const wasPresent = this.#registry.delete(subscriber);
    if (!wasPresent) {
      console.error(
        '[DebuggingRegistry] Unexpected argument for unsubscription, which was not previously subscribed:',
        subscriber,
      );
    }
  }
}

const debuggingRegistryInstance: DebuggingRegistry = new DebuggingRegistry();
export default debuggingRegistryInstance;
