/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MessageQueueEventBeat.h"

namespace facebook {
namespace react {

MessageQueueEventBeat::MessageQueueEventBeat(const std::shared_ptr<MessageQueueThread> &messageQueueThread):
  messageQueueThread_(messageQueueThread) {

  mainRunLoopObserver_ =
    CFRunLoopObserverCreateWithHandler(
      NULL /* allocator */,
      kCFRunLoopBeforeWaiting /* activities */,
      true /* repeats */,
      0 /* order */,
      ^(CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
        // Note: We only `induce` beat here; actual beat will be performed on
        // a different thread.
        this->induce();
      }
  );

  assert(mainRunLoopObserver_);

  CFRunLoopAddObserver(CFRunLoopGetMain(), mainRunLoopObserver_, kCFRunLoopCommonModes);
}

MessageQueueEventBeat::~MessageQueueEventBeat() {
  CFRunLoopRemoveObserver(CFRunLoopGetMain(), mainRunLoopObserver_, kCFRunLoopCommonModes);
  CFRelease(mainRunLoopObserver_);
}

void MessageQueueEventBeat::induce() const {
  if (!isRequested_ || isBusy_) {
    return;
  }

  isBusy_ = true;
  messageQueueThread_->runOnQueue([this]() {
    this->beat();
    isBusy_ = false;
  });
}

} // namespace react
} // namespace facebook
