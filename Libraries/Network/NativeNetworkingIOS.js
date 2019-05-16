/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';
import type {NativeResponseType} from './XMLHttpRequest';

export interface Spec extends TurboModule {
  +sendRequest: (
    query: {|
      method: string,
      url: string,
      data: {[key: string]: mixed},
      headers: {[key: string]: mixed},
      responseType: NativeResponseType,
      incrementalUpdates: boolean,
      timeout: number,
      withCredentials: boolean,
    |},
    callback: (requestId: number) => void,
  ) => void;
  +abortRequest: (requestId: number) => void;
  +clearCookies: (callback: (result: boolean) => void) => void;

  // RCTEventEmitter
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Networking');
