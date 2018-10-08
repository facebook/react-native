/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

#ifndef NDEBUG
  // We do a trick here.
  // If `wasExecuted` was destroyed before set to `true`,
  // it means that the execution block was deallocated not being executed.
  // This indicates that `messageQueueThread_` is being deallocated.
  auto wasExecuted = std::shared_ptr<bool>(new bool {false}, [this](bool *wasExecuted) {
    if (!*wasExecuted && failCallback_) {
      failCallback_();
    }
    delete wasExecuted;
  });
#endif

  isBusy_ = true;
  messageQueueThread_->runOnQueue([=]() mutable {
    this->beat();
    isBusy_ = false;
#ifndef NDEBUG
    *wasExecuted = true;
#endif
  });
}

} // namespace react
} // namespace facebook
