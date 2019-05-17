/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow
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
      data: Object,
      headers: Object,
      responseType: NativeResponseType,
      incrementalUpdates: boolean,
      timeout: number,
      withCredentials: boolean,
    |},
    callback: (requestId: number) => mixed,
  ) => void;
  +abortRequest: (requestId: number) => void;
  +clearCookies: (callback: (result: boolean) => mixed) => void;

  // Events
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Networking');
