/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <CoreFoundation/CFRunLoop.h>
#include <CoreFoundation/CoreFoundation.h>
#include <react/core/EventBeat.h>
#include <react/utils/RuntimeExecutor.h>

namespace facebook {
namespace react {

/*
 * Event beat associated with JavaScript runtime.
 * The beat is called on `RuntimeExecutor`'s thread induced by the main thread
 * event loop.
 */
class RuntimeEventBeat : public EventBeat {
 public:
  RuntimeEventBeat(RuntimeExecutor runtimeExecutor);
  ~RuntimeEventBeat();

  void induce() const override;

 private:
  const RuntimeExecutor runtimeExecutor_;
  CFRunLoopObserverRef mainRunLoopObserver_;
  mutable std::atomic<bool> isBusy_{false};
};

} // namespace react
} // namespace facebook
