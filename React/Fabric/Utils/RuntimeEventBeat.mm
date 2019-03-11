/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeEventBeat.h"

namespace facebook {
namespace react {

RuntimeEventBeat::RuntimeEventBeat(RuntimeExecutor runtimeExecutor):
  runtimeExecutor_(std::move(runtimeExecutor)) {

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

RuntimeEventBeat::~RuntimeEventBeat() {
  CFRunLoopRemoveObserver(CFRunLoopGetMain(), mainRunLoopObserver_, kCFRunLoopCommonModes);
  CFRelease(mainRunLoopObserver_);
}

void RuntimeEventBeat::induce() const {
  if (!isRequested_ || isBusy_) {
    return;
  }

#ifndef NDEBUG
  // We do a trick here.
  // If `wasExecuted` was destroyed before set to `true`,
  // it means that the execution block was deallocated not being executed.
  // This indicates that `messageQueueThread_` is being deallocated.
  // This trick is quite expensive due to deallocation and messing with atomic
  // counters. Seems we need this only for making hot-reloading mechanism
  // thread-safe. Hence, let's leave it to be DEBUG-only for now.
  auto wasExecuted = std::shared_ptr<bool>(new bool {false}, [this](bool *wasExecuted) {
    if (!*wasExecuted && failCallback_) {
      failCallback_();
    }
    delete wasExecuted;
  });
#endif

  isBusy_ = true;
  runtimeExecutor_([=](jsi::Runtime &runtime) mutable {
    this->beat(runtime);
    isBusy_ = false;
#ifndef NDEBUG
    *wasExecuted = true;
#endif
  });
}

} // namespace react
} // namespace facebook
