/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DefaultTurboModules.h"
#include <react/nativemodule/dom/NativeDOM.h>
#include <react/nativemodule/featureflags/NativeReactNativeFeatureFlags.h>
#include <react/nativemodule/idlecallbacks/NativeIdleCallbacks.h>
#include <react/nativemodule/microtasks/NativeMicrotasks.h>

namespace facebook::react {

/* static */ std::shared_ptr<TurboModule> DefaultTurboModules::getTurboModule(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker) {
  if (name == NativeReactNativeFeatureFlags::kModuleName) {
    return std::make_shared<NativeReactNativeFeatureFlags>(jsInvoker);
  }

  if (name == NativeMicrotasks::kModuleName) {
    return std::make_shared<NativeMicrotasks>(jsInvoker);
  }

  if (name == NativeIdleCallbacks::kModuleName) {
    return std::make_shared<NativeIdleCallbacks>(jsInvoker);
  }

  if (name == NativeDOM::kModuleName) {
    return std::make_shared<NativeDOM>(jsInvoker);
  }

  return nullptr;
}

} // namespace facebook::react
