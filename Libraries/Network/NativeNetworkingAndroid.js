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

type Header = [string, string];

export interface Spec extends TurboModule {
  +sendRequest: (
    method: string,
    url: string,
    requestId: number,
    headers: Array<Header>,
    data: {[key: string]: mixed},
    responseType: NativeResponseType,
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

export default TurboModuleRegistry.getEnforcing<Spec>('Networking');
