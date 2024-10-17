/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/core/EventBeat.h>
#include <react/utils/RunLoopObserver.h>

namespace facebook::react {

/*
 * Event beat associated with JavaScript runtime.
 * The beat is called on `RuntimeExecutor`'s thread induced by the UI thread
 * event loop.
 */
class AppleEventBeat : public EventBeat, public RunLoopObserver::Delegate {
 public:
  AppleEventBeat(
      std::shared_ptr<OwnerBox> ownerBox,
      RunLoopObserver::Unique uiRunLoopObserver,
      RuntimeExecutor runtimeExecutor);

#pragma mark - RunLoopObserver::Delegate

  void activityDidChange(
      const RunLoopObserver::Delegate* delegate,
      RunLoopObserver::Activity activity) const noexcept override;

 private:
  RunLoopObserver::Unique uiRunLoopObserver_;
};

} // namespace facebook::react
