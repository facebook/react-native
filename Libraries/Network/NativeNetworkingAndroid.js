/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

type Header = [string, string];

export interface Spec extends TurboModule {
  +sendRequest: (
    method: string,
    url: string,
    requestId: number,
    headers: Array<Header>,
    data: Object,
    responseType: string,
    useIncrementalUpdates: boolean,
    timeout: number,
    withCredentials: boolean,
  ) => void;
  +abortRequest: (requestId: number) => void;
  +clearCookies: (callback: (result: boolean) => void) => void;

  // RCTEventEmitter
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>('Networking'): Spec);
