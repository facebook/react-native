/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModule.h"

using namespace facebook;

namespace facebook {
namespace react {

TurboModule::TurboModule(
    const std::string &name,
    std::shared_ptr<CallInvoker> jsInvoker)
    : name_(name), jsInvoker_(jsInvoker) {}

} // namespace react
} // namespace facebook
