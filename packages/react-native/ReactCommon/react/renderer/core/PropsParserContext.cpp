/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PropsParserContext.h"

#include <react/config/ReactNativeConfig.h>

namespace facebook::react {

bool PropsParserContext::treatAutoAsYGValueUndefined() const {
  if (treatAutoAsYGValueUndefined_ == std::nullopt) {
    auto config =
        contextContainer.find<std::shared_ptr<const ReactNativeConfig>>(
            "ReactNativeConfig");
    treatAutoAsYGValueUndefined_ = config && *config != nullptr
        ? (*config)->getBool("react_fabric:treat_auto_as_undefined")
        : false;
  }

  return *treatAutoAsYGValueUndefined_;
}

} // namespace facebook::react
