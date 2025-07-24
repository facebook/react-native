/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CxxTurboModuleUtils.h"

#include <utility>

namespace facebook::react {

std::unordered_map<
    std::string,
    std::function<
        std::shared_ptr<TurboModule>(std::shared_ptr<CallInvoker> jsInvoker)>>&
globalExportedCxxTurboModuleMap() {
  static std::unordered_map<
      std::string,
      std::function<std::shared_ptr<TurboModule>(
          std::shared_ptr<CallInvoker> jsInvoker)>>
      map;
  return map;
}

void registerCxxModuleToGlobalModuleMap(
    std::string name,
    std::function<std::shared_ptr<TurboModule>(
        std::shared_ptr<CallInvoker> jsInvoker)> moduleProviderFunc) {
  globalExportedCxxTurboModuleMap()[std::move(name)] =
      std::move(moduleProviderFunc);
}

} // namespace facebook::react
