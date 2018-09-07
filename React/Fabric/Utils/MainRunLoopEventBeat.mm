// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import "MainRunLoopEventBeat.h"

#import <React/RCTUtils.h>

namespace facebook {
namespace react {

MainRunLoopEventBeat::MainRunLoopEventBeat() {
  mainRunLoopObserver_ =
    CFRunLoopObserverCreateWithHandler(
      NULL /* allocator */,
      kCFRunLoopBeforeWaiting /* activities */,
      true /* repeats */,
      0 /* order */,
      ^(CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
        this->beat();
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
    this->beat();
  });
}

} // namespace react
} // namespace facebook
