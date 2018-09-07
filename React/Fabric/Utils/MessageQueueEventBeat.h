/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <CoreFoundation/CoreFoundation.h>
#include <CoreFoundation/CFRunLoop.h>
#include <cxxreact/MessageQueueThread.h>
#include <fabric/events/EventBeat.h>

namespace facebook {
namespace react {

/*
 * Event beat that associated with MessageQueueThread.
 */
class MessageQueueEventBeat:
  public EventBeat {

public:
  MessageQueueEventBeat(const std::shared_ptr<MessageQueueThread> &messageQueueThread);
  ~MessageQueueEventBeat();

  void induce() const override;

private:
  const std::shared_ptr<MessageQueueThread> messageQueueThread_;
  CFRunLoopObserverRef mainRunLoopObserver_;
  mutable std::atomic<bool> isBusy_ {false};
};

} // namespace react
} // namespace facebook
