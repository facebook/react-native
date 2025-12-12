/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +sendRequest: (
    query: {
      method: string,
      url: string,
      data: Object,
      headers: Object,
      responseType: string,
      incrementalUpdates: boolean,
      timeout: number,
      withCredentials: boolean,
      +unstable_devToolsRequestId?: string,
    },
    callback: (requestId: number) => void,
  ) => void;
  +abortRequest: (requestId: number) => void;
  +clearCookies: (callback: (result: boolean) => void) => void;

  // RCTEventEmitter
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>('Networking'): Spec);
