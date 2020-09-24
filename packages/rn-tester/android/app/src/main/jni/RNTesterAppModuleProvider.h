/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

namespace facebook {
namespace react {

std::shared_ptr<void> RNTesterAppModuleProvider(const std::string moduleName);

} // namespace react
} // namespace facebook
