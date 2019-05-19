/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';

export interface Spec extends TurboModule {
  +connect: (
    url: string,
    protocols: ?Array<string>,
    options: ?{headers?: {origin?: string}},
    socketID: number,
  ) => void;
  +send: (message: string, socketID: number) => void;
  +sendBinary: (base64String: string, socketID: number) => void;
  +ping: (socketID: number) => void;
  +close: (socketID: number) => void;

  // Events
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('WebSocketModule');
