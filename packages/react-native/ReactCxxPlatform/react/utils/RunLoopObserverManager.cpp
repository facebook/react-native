/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RunLoopObserverManager.h"

#include <react/debug/react_native_assert.h>

namespace facebook::react {

/*
 * Event beat associated with JavaScript runtime. The beat is called on
 * RuntimeScheduler's thread induced by the UI thread event loop.
 */
class EventBeatImpl : public EventBeat, public RunLoopObserver::Delegate {
 public:
  EventBeatImpl(
      std::shared_ptr<OwnerBox> ownerBox,
      std::shared_ptr<const RunLoopObserver> uiRunLoopObserver,
      RuntimeScheduler& runtimeScheduler)
      : EventBeat(std::move(ownerBox), runtimeScheduler),
        uiRunLoopObserver_(std::move(uiRunLoopObserver)) {
    uiRunLoopObserver_->setDelegate(this);
    uiRunLoopObserver_->enable();
  }

#pragma mark - RunLoopObserver::Delegate

  void activityDidChange(
      const RunLoopObserver::Delegate* delegate,
      RunLoopObserver::Activity /*activity*/) const noexcept override {
    react_native_assert(delegate == this);
    induce();
  }

 private:
  std::shared_ptr<const RunLoopObserver> uiRunLoopObserver_;
};

std::unique_ptr<EventBeat> RunLoopObserverManager::createEventBeat(
    std::shared_ptr<EventBeat::OwnerBox> ownerBox,
    RuntimeScheduler& runtimeScheduler) {
  auto observer = std::make_shared<const PlatformRunLoopObserver>(
      RunLoopObserver::Activity::BeforeWaiting, ownerBox->owner);
  observer_ = observer;
  return std::make_unique<EventBeatImpl>(
      std::move(ownerBox), std::move(observer), runtimeScheduler);
}

void RunLoopObserverManager::onRender() const noexcept {
  if (auto observer = observer_.lock()) {
    observer->onRender();
  }
}

} // namespace facebook::react
