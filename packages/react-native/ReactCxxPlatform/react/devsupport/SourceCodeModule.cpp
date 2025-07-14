/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SourceCodeModule.h"

#include <react/devsupport/DevServerHelper.h>
#include <string>

namespace facebook::react {

SourceCodeConstants SourceCodeModule::getConstants(jsi::Runtime& /*rt*/) {
  std::string scriptURL;
  if (auto devServerHelper = devServerHelper_.lock()) {
    scriptURL = devServerHelper->getBundleUrl();
  }
  return SourceCodeConstants{.scriptURL = scriptURL};
}

} // namespace facebook::react
