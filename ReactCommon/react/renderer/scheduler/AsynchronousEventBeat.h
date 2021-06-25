/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/core/EventBeat.h>
#include <react/utils/RunLoopObserver.h>

namespace facebook::react {

/*
 * Event beat associated with JavaScript runtime.
 * The beat is called on `RuntimeExecutor`'s thread induced by the UI thread
 * event loop.
 */
class AsynchronousEventBeat : public EventBeat,
                              public RunLoopObserver::Delegate {
 public:
  AsynchronousEventBeat(
      RunLoopObserver::Unique uiRunLoopObserver,
      RuntimeExecutor runtimeExecutor);

  void induce() const override;

#pragma mark - RunLoopObserver::Delegate

  void activityDidChange(
      RunLoopObserver::Delegate const *delegate,
      RunLoopObserver::Activity activity) const noexcept override;

 private:
  RunLoopObserver::Unique uiRunLoopObserver_;
  RuntimeExecutor runtimeExecutor_;

  mutable std::atomic<bool> isBeatCallbackScheduled_{false};
};

} // namespace facebook::react
