/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from './RCTExport';

import invariant from 'invariant';

const NativeModules = require('../BatchedBridge/NativeModules');

const turboModuleProxy = global.__turboModuleProxy;

const moduleLoadHistory = {
  NativeModules: ([]: Array<string>),
  TurboModules: ([]: Array<string>),
  NotFound: ([]: Array<string>),
};

function isBridgeless() {
  return global.RN$Bridgeless === true;
}

function isTurboModuleInteropEnabled() {
  return global.RN$TurboInterop === true;
}

// TODO(154308585): Remove "module not found" debug info logging
function shouldReportDebugInfo() {
  return true;
}

// TODO(148943970): Consider reversing the lookup here:
// Lookup on __turboModuleProxy, then lookup on nativeModuleProxy
function requireModule<T: TurboModule>(name: string): ?T {
  if (!isBridgeless() || isTurboModuleInteropEnabled()) {
    // Backward compatibility layer during migration.
    const legacyModule = NativeModules[name];
    if (legacyModule != null) {
      if (shouldReportDebugInfo()) {
        moduleLoadHistory.NativeModules.push(name);
      }
      return ((legacyModule: $FlowFixMe): T);
    }
  }

  if (turboModuleProxy != null) {
    const module: ?T = turboModuleProxy(name);
    if (module != null) {
      if (shouldReportDebugInfo()) {
        moduleLoadHistory.TurboModules.push(name);
      }
      return module;
    }
  }

  if (shouldReportDebugInfo() && !moduleLoadHistory.NotFound.includes(name)) {
    moduleLoadHistory.NotFound.push(name);
  }
  return null;
}

export function get<T: TurboModule>(name: string): ?T {
  return requireModule<T>(name);
}

export function getEnforcing<T: TurboModule>(name: string): T {
  const module = requireModule<T>(name);
  let message =
    `TurboModuleRegistry.getEnforcing(...): '${name}' could not be found. ` +
    'Verify that a module by this name is registered in the native binary.';

  if (shouldReportDebugInfo()) {
    message +=
      ' Bridgeless mode: ' + (isBridgeless() ? 'true' : 'false') + '. ';
    message +=
      'TurboModule interop: ' +
      (isTurboModuleInteropEnabled() ? 'true' : 'false') +
      '. ';
    message += 'Modules loaded: ' + JSON.stringify(moduleLoadHistory);
  }

  invariant(module != null, message);
  return module;
}
