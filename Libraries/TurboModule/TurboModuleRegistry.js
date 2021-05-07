/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const NativeModules = require('../BatchedBridge/NativeModules');
import type {TurboModule} from './RCTExport';
import invariant from 'invariant';

const turboModuleProxy = global.__turboModuleProxy;

function requireModule<T: TurboModule>(name: string): ?T {
  // Bridgeless mode requires TurboModules
  if (!global.RN$Bridgeless) {
    // Backward compatibility layer during migration.
    const legacyModule = NativeModules[name];
    if (legacyModule != null) {
      return ((legacyModule: $FlowFixMe): T);
    }
  }

  if (turboModuleProxy != null) {
    const module: ?T = turboModuleProxy(name);
    if (module == null) {
      // Common fixes: Verify the TurboModule is registered in the native binary, and adopts the code generated type-safe Spec base class.
      // Safe to ignore when caused by importing legacy modules that are unused.
      console.info(
        'Unable to get TurboModule for ' +
          name +
          '. Safe to ignore if module works.',
      );
    }
    return module;
  }

  return null;
}

export function get<T: TurboModule>(name: string): ?T {
  return requireModule<T>(name);
}

export function getEnforcing<T: TurboModule>(name: string): T {
  const module = requireModule<T>(name);
  invariant(
    module != null,
    `TurboModuleRegistry.getEnforcing(...): '${name}' could not be found. ` +
      'Verify that a module by this name is registered in the native binary.',
  );
  return module;
}
