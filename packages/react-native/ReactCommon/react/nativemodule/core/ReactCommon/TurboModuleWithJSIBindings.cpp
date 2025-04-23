/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModuleWithJSIBindings.h"

#include <ReactCommon/TurboModule.h>

namespace facebook::react {

/* static */ void TurboModuleWithJSIBindings::installJSIBindings(
    const std::shared_ptr<TurboModule>& cxxModule,
    jsi::Runtime& runtime) {
  if (auto* cxxModuleWithJSIBindings =
          dynamic_cast<TurboModuleWithJSIBindings*>(cxxModule.get())) {
    cxxModuleWithJSIBindings->installJSIBindingsWithRuntime(runtime);
  }
}

} // namespace facebook::react
