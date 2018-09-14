// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <CoreFoundation/CoreFoundation.h>
#include <CoreFoundation/CFRunLoop.h>
#include <cxxreact/MessageQueueThread.h>
#include <fabric/events/EventBeat.h>

namespace facebook {
namespace react {

/*
 * Event beat associated with main run loop cycle.
 * The callback is always called on the main thread.
 */
class MainRunLoopEventBeat final:
  public EventBeat {

public:
  MainRunLoopEventBeat(std::shared_ptr<MessageQueueThread> messageQueueThread);
  ~MainRunLoopEventBeat();

  void induce() const override;

private:
  void blockMessageQueueAndThenBeat() const;

  std::shared_ptr<MessageQueueThread> messageQueueThread_;
  CFRunLoopObserverRef mainRunLoopObserver_;
};

} // namespace react
} // namespace facebook
