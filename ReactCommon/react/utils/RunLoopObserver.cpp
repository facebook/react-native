/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RunLoopObserver.h"

#include <react/debug/react_native_assert.h>

namespace facebook {
namespace react {

RunLoopObserver::RunLoopObserver(
    Activity activities,
    WeakOwner const &owner) noexcept
    : activities_(activities), owner_(owner) {}

void RunLoopObserver::setDelegate(Delegate const *delegate) const noexcept {
  // We need these constraints to ensure basic thread-safety.
  react_native_assert(delegate && "A delegate must not be `nullptr`.");
  react_native_assert(
      !delegate_ && "`RunLoopObserver::setDelegate` must be called once.");
  delegate_ = delegate;
}

void RunLoopObserver::enable() const noexcept {
  if (enabled_) {
    return;
  }
  enabled_ = true;

  startObserving();
}

void RunLoopObserver::disable() const noexcept {
  if (!enabled_) {
    return;
  }
  enabled_ = false;

  stopObserving();
}

void RunLoopObserver::activityDidChange(Activity activity) const noexcept {
  if (!enabled_) {
    return;
  }

  react_native_assert(
      !owner_.expired() &&
      "`owner_` is null. The caller must `lock` the owner and check it for being not null.");

  delegate_->activityDidChange(delegate_, activity);
}

RunLoopObserver::WeakOwner RunLoopObserver::getOwner() const noexcept {
  return owner_;
}

} // namespace react
} // namespace facebook
