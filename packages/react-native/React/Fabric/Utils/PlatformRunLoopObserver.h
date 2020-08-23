/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <CoreFoundation/CFRunLoop.h>
#include <CoreFoundation/CoreFoundation.h>

#include <react/utils/RunLoopObserver.h>

namespace facebook {
namespace react {

/*
 * Concrete iOS-specific implementation of `RunLoopObserver` using
 * `CFRunLoopObserver` under the hood.
 */
class PlatformRunLoopObserver : public RunLoopObserver {
 public:
  PlatformRunLoopObserver(
      RunLoopObserver::Activity activities,
      RunLoopObserver::WeakOwner const &owner,
      CFRunLoopRef runLoop);

  ~PlatformRunLoopObserver();

  virtual bool isOnRunLoopThread() const noexcept override;

 private:
  void startObserving() const noexcept override;
  void stopObserving() const noexcept override;

  CFRunLoopRef runLoop_;
  CFRunLoopObserverRef mainRunLoopObserver_;
};

/*
 * Convenience specialization of `PlatformRunLoopObserver` observing the main
 * run loop.
 */
class MainRunLoopObserver final : public PlatformRunLoopObserver {
 public:
  MainRunLoopObserver(
      RunLoopObserver::Activity activities,
      RunLoopObserver::WeakOwner const &owner)
      : PlatformRunLoopObserver(activities, owner, CFRunLoopGetMain()) {}
};

} // namespace react
} // namespace facebook
