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
import invariant from 'invariant';
import {NativeModules} from 'react-native';

// TODO
function get<T: TurboModule>(name: string): ?T {
  // Backward compatibility layer during migration.
  if (NativeModules[name] != null) {
    return ((NativeModules[name]: any): T);
  }

  const module: ?T = global.__turboModuleProxy(name);
  return module;
}

function getEnforcing<T: TurboModule>(name: string): T {
  const module = get(name);
  invariant(module != null, `${name} is not available in this app.`);
  return module;
}

export {get};
export {getEnforcing};
