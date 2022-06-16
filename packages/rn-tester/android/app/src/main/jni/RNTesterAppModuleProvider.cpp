/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RNTesterAppModuleProvider.h"

#include <AppSpecs.h>
#include <ReactCommon/SampleTurboModuleSpec.h>
#include <rncore.h>

namespace facebook {
namespace react {

std::shared_ptr<TurboModule> RNTesterAppModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params) {
  auto module = AppSpecs_ModuleProvider(moduleName, params);
  if (module != nullptr) {
    return module;
  }

  module = SampleTurboModuleSpec_ModuleProvider(moduleName, params);
  if (module != nullptr) {
    return module;
  }

  return rncore_ModuleProvider(moduleName, params);
}

} // namespace react
} // namespace facebook
