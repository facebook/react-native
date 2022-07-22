/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <ReactCommon/JavaTurboModule.h>

namespace facebook {
namespace react {

std::shared_ptr<TurboModule> RNTesterAppModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params);

} // namespace react
} // namespace facebook
