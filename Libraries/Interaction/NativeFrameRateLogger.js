/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
<<<<<<< HEAD
 * @flow
 */

import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';
import type {TurboModule} from '../TurboModule/RCTExport';
=======
 * @flow strict-local
 */

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';
>>>>>>> fb/0.62-stable

export interface Spec extends TurboModule {
  +setGlobalOptions: (options: {|
    +debug?: ?boolean,
    +reportStackTraces?: ?boolean,
  |}) => void;
  +setContext: (context: string) => void;
  +beginScroll: () => void;
  +endScroll: () => void;
}

<<<<<<< HEAD
export default TurboModuleRegistry.get<Spec>('FrameRateLogger');
=======
export default (TurboModuleRegistry.get<Spec>('FrameRateLogger'): ?Spec);
>>>>>>> fb/0.62-stable
