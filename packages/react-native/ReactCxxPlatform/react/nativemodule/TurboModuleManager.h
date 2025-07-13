/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/TurboModule.h>
#include <functional>
#include <string>
#include <vector>

namespace facebook::react {

using TurboModuleManagerDelegate = std::function<std::shared_ptr<TurboModule>(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker)>;

using TurboModuleManagerDelegates = std::vector<TurboModuleManagerDelegate>;

} // namespace facebook::react
