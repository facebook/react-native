/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +connect: (
    url: string,
    protocols: ?Array<string>,
    options: {|headers?: Object|},
    socketID: number,
  ) => void;
  +send: (message: string, forSocketID: number) => void;
  +sendBinary: (base64String: string, forSocketID: number) => void;
  +ping: (socketID: number) => void;
  +close: (code: number, reason: string, socketID: number) => void;

  // RCTEventEmitter
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'WebSocketModule',
): Spec);
