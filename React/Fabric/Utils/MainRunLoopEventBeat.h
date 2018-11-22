// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <CoreFoundation/CoreFoundation.h>
#include <CoreFoundation/CFRunLoop.h>
#include <react/uimanager/primitives.h>
#include <react/events/EventBeat.h>

namespace facebook {
namespace react {

/*
 * Event beat associated with main run loop cycle.
 * The callback is always called on the main thread.
 */
class MainRunLoopEventBeat final:
  public EventBeat {

public:
  MainRunLoopEventBeat(RuntimeExecutor runtimeExecutor);
  ~MainRunLoopEventBeat();

  void induce() const override;

private:
  void lockExecutorAndBeat() const;

  const RuntimeExecutor runtimeExecutor_;
  CFRunLoopObserverRef mainRunLoopObserver_;
};

} // namespace react
} // namespace facebook
