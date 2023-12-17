/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeComponentRegistryBinding.h"

#include <react/bridging/Bridging.h>
#include <stdexcept>
#include <string>

namespace facebook::react {

/**
 * Public API to install the Native Component Registry bindings.
 */
void bindHasComponentProvider(
    jsi::Runtime& runtime,
    HasComponentProviderFunctionType&& provider) {
  runtime.global().setProperty(
      runtime,
      "__nativeComponentRegistry__hasComponent",
      bridging::toJs(runtime, provider, {}));
}

} // namespace facebook::react
