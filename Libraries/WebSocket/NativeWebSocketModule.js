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

// Native close method definition on Android
declare function close(code: number, reason: string, socketID: number): void;
// Native close method definition on iOS
declare function close(socketID: number): void;

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
  +close: typeof close;

  // Events
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('WebSocketModule');
