/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AsynchronousEventBeatV2.h"

#include <react/debug/react_native_assert.h>

namespace facebook::react {

AsynchronousEventBeatV2::AsynchronousEventBeatV2(
    RunLoopObserver::Unique uiRunLoopObserver,
    RuntimeExecutor runtimeExecutor)
    : EventBeat({}),
      uiRunLoopObserver_(std::move(uiRunLoopObserver)),
      runtimeExecutor_(std::move(runtimeExecutor)) {
  uiRunLoopObserver_->setDelegate(this);
  uiRunLoopObserver_->enable();
}

void AsynchronousEventBeatV2::activityDidChange(
    RunLoopObserver::Delegate const *delegate,
    RunLoopObserver::Activity) const noexcept {
  react_native_assert(delegate == this);
  induce();
}

void AsynchronousEventBeatV2::induce() const {
  if (!isRequested_ || isBeatCallbackScheduled_) {
    return;
  }

  isRequested_ = false;

  // Here we know that `this` object exists because the caller has a strong
  // pointer to `owner`. To ensure the object will exist inside
  // `runtimeExecutor_` callback, we need to copy the  pointer there.
  auto weakOwner = uiRunLoopObserver_->getOwner();

  isBeatCallbackScheduled_ = true;

  runtimeExecutor_([this, weakOwner](jsi::Runtime &runtime) {
    isBeatCallbackScheduled_ = false;

    auto owner = weakOwner.lock();
    if (!owner) {
      return;
    }

    if (beatCallback_) {
      beatCallback_(runtime);
    }
  });
}
} // namespace facebook::react
