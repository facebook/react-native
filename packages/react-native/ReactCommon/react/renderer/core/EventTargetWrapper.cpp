/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventTargetWrapper.h"

namespace facebook::react {

EventTargetWrapper::EventTargetWrapper(
    SharedEventTarget eventTarget,
    jsi::Runtime &runtime)
    : eventTarget_(std::move(eventTarget)), runtime_(runtime) {
  eventTarget_->retain(runtime_);
}

EventTargetWrapper::~EventTargetWrapper() {
  eventTarget_->release(runtime_);
}

} // namespace facebook::react
