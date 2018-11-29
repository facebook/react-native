// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import "MainRunLoopEventBeat.h"

#import <mutex>
#import <React/RCTUtils.h>

namespace facebook {
namespace react {

MainRunLoopEventBeat::MainRunLoopEventBeat(RuntimeExecutor runtimeExecutor):
  runtimeExecutor_(std::move(runtimeExecutor)) {

  mainRunLoopObserver_ =
    CFRunLoopObserverCreateWithHandler(
      NULL /* allocator */,
      kCFRunLoopBeforeWaiting /* activities */,
      true /* repeats */,
      0 /* order */,
      ^(CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
        if (!this->isRequested_) {
          return;
        }

        this->lockExecutorAndBeat();
      }
  );

  assert(mainRunLoopObserver_);

  CFRunLoopAddObserver(CFRunLoopGetMain(), mainRunLoopObserver_, kCFRunLoopCommonModes);
}

MainRunLoopEventBeat::~MainRunLoopEventBeat() {
  CFRunLoopRemoveObserver(CFRunLoopGetMain(), mainRunLoopObserver_, kCFRunLoopCommonModes);
  CFRelease(mainRunLoopObserver_);
}

void MainRunLoopEventBeat::induce() const {
  if (!this->isRequested_) {
    return;
  }

  RCTExecuteOnMainQueue(^{
    this->lockExecutorAndBeat();
  });
}

void MainRunLoopEventBeat::lockExecutorAndBeat() const {
  // Note: We need the third mutex to get back to the main thread before
  // the lambda is finished (because all mutexes are allocated on the stack).

  std::mutex mutex1;
  std::mutex mutex2;
  std::mutex mutex3;

  mutex1.lock();
  mutex2.lock();
  mutex3.lock();

  jsi::Runtime *runtimePtr;

  runtimeExecutor_([&](jsi::Runtime &runtime) {
    runtimePtr = &runtime;
    mutex1.unlock();
    // `beat` is called somewhere here.
    mutex2.lock();
    mutex3.unlock();
  });

  mutex1.lock();
  beat(*runtimePtr);
  mutex2.unlock();
  mutex3.lock();
}

} // namespace react
} // namespace facebook
