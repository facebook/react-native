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

import {TurboModuleRegistry, type TurboModule} from 'react-native';

export interface Spec extends TurboModule {
  +getBool: (a: ?boolean) => ?boolean;
  +getNumber: (a: ?number) => ?number;
  +getString: (a: ?number) => ?string;
  +getArray: (a: ?Array<any>) => ?Array<any>;
  +getObject: (a: ?Object) => ?Object;
  +getValueWithPromise: () => ?Promise<string>;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModule',
): Spec);
