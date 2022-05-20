/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModule.h"

namespace facebook {
namespace react {

TurboModule::TurboModule(
    std::string name,
    std::shared_ptr<CallInvoker> jsInvoker)
    : name_(std::move(name)), jsInvoker_(std::move(jsInvoker)) {}

} // namespace react
} // namespace facebook
