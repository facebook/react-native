/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CallInvokerHolder.h"

namespace facebook::react {

CallInvokerHolder::CallInvokerHolder(std::shared_ptr<CallInvoker> callInvoker)
    : callInvoker_(std::move(callInvoker)) {}

} // namespace facebook::react
