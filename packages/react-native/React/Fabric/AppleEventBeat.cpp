/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AppleEventBeat.h"

#include <react/debug/react_native_assert.h>

namespace facebook::react {

AppleEventBeat::AppleEventBeat(
    std::shared_ptr<OwnerBox> ownerBox,
    RunLoopObserver::Unique uiRunLoopObserver,
    RuntimeExecutor runtimeExecutor)
    : EventBeat(std::move(ownerBox), std::move(runtimeExecutor)),
      uiRunLoopObserver_(std::move(uiRunLoopObserver)) {
  uiRunLoopObserver_->setDelegate(this);
  uiRunLoopObserver_->enable();
}

void AppleEventBeat::activityDidChange(
    const RunLoopObserver::Delegate* delegate,
    RunLoopObserver::Activity /*activity*/) const noexcept {
  react_native_assert(delegate == this);
  induce();
}

} // namespace facebook::react
