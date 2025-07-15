/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "../TesterTurboModuleManagerDelegate.h"
#include <NativeCxxModuleExample/NativeCxxModuleExample.h>

namespace facebook::react {
/* static */ TurboModuleManagerDelegate
TesterTurboModuleManagerDelegate::getTurboModuleManagerDelegate() {
  return TurboModuleManagerDelegate{
      [](const std::string& name, const std::shared_ptr<CallInvoker>& jsInvoker)
          -> std::shared_ptr<TurboModule> {
        if (name == NativeCxxModuleExample::kModuleName) {
          return std::make_shared<NativeCxxModuleExample>(jsInvoker);
        } else {
          return nullptr;
        }
      }};
}
} // namespace facebook::react
