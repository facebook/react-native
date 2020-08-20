/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const NativeModules = require('../BatchedBridge/NativeModules');
import type {TurboModule} from './RCTExport';
import invariant from 'invariant';

const turboModuleProxy = global.__turboModuleProxy;

function requireModule<T: TurboModule>(name: string, schema?: ?$FlowFixMe): ?T {
  // Bridgeless mode requires TurboModules
  if (!global.RN$Bridgeless) {
    // Backward compatibility layer during migration.
    const legacyModule = NativeModules[name];
    if (legacyModule != null) {
      return ((legacyModule: $FlowFixMe): T);
    }
  }

  if (turboModuleProxy != null) {
    const module: ?T =
      schema != null ? turboModuleProxy(name, schema) : turboModuleProxy(name);
    return module;
  }

  return null;
}

export function get<T: TurboModule>(name: string): ?T {
  /**
   * What is Schema?
   *
   * @react-native/babel-plugin-codegen will parse the NativeModule
   * spec, and pass in the generated schema as the second argument
   * to this function. The schem will then be used to perform method
   * dispatch on, and translate arguments/return to and from the Native
   * TurboModule object.
   */
  const schema = arguments.length === 2 ? arguments[1] : undefined;
  return requireModule<T>(name, schema);
}

export function getEnforcing<T: TurboModule>(name: string): T {
  /**
   * What is Schema?
   *
   * @react-native/babel-plugin-codegen will parse the NativeModule
   * spec, and pass in the generated schema as the second argument
   * to this function. The schem will then be used to perform method
   * dispatch on, and translate arguments/return to and from the Native
   * TurboModule object.
   */
  const schema = arguments.length === 2 ? arguments[1] : undefined;
  const module = requireModule<T>(name, schema);
  invariant(
    module != null,
    `TurboModuleRegistry.getEnforcing(...): '${name}' could not be found. ` +
      'Verify that a module by this name is registered in the native binary.',
  );
  return module;
}
