/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RCTMessageThread.h"

#include <condition_variable>
#include <mutex>

#import <React/RCTCxxUtils.h>
#import <React/RCTUtils.h>

// A note about the implementation: This class is not used
// generically.  It's a thin wrapper around a run loop which
// implements a C++ interface, for use by the C++ xplat bridge code.
// This means it can make certain non-generic assumptions.  In
// particular, the sync functions are only used for bridge setup and
// teardown, and quitSynchronous is guaranteed to be called.

namespace facebook::react {

RCTMessageThread::RCTMessageThread(NSRunLoop *runLoop, RCTJavaScriptCompleteBlock errorBlock)
    : m_cfRunLoop([runLoop getCFRunLoop]), m_errorBlock(errorBlock), m_shutdown(false)
{
  CFRetain(m_cfRunLoop);
}

RCTMessageThread::~RCTMessageThread()
{
  RCTAssert(m_shutdown, @"RCTMessageThread: quitSynchronous() not called before destructor");
  CFRelease(m_cfRunLoop);
}

// This is analogous to dispatch_async
void RCTMessageThread::runAsync(std::function<void()> func)
{
  CFRunLoopPerformBlock(m_cfRunLoop, kCFRunLoopCommonModes, ^{
    // Create an autorelease pool each run loop to prevent memory footprint from growing too large, which can lead to
    // performance problems.
    @autoreleasepool {
      func();
    }
  });
  CFRunLoopWakeUp(m_cfRunLoop);
}

// This is analogous to dispatch_sync
void RCTMessageThread::runSync(std::function<void()> func)
{
  if (m_cfRunLoop == CFRunLoopGetCurrent()) {
    func();
    return;
  }

  dispatch_semaphore_t sema = dispatch_semaphore_create(0);
  runAsync([func = std::make_shared<std::function<void()>>(std::move(func)), &sema] {
    (*func)();
    dispatch_semaphore_signal(sema);
  });
  dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);
}

void RCTMessageThread::tryFunc(const std::function<void()> &func)
{
  NSError *error = tryAndReturnError(func);
  if (error != nullptr) {
    m_errorBlock(error);
  }
}

void RCTMessageThread::runOnQueue(std::function<void()> &&func)
{
  if (m_shutdown) {
    return;
  }
  runAsync([sharedThis = shared_from_this(), func = std::make_shared<std::function<void()>>(std::move(func))] {
    if (!sharedThis->m_shutdown) {
      sharedThis->tryFunc(*func);
    }
  });
}

void RCTMessageThread::runOnQueueSync(std::function<void()> &&func)
{
  if (m_shutdown) {
    return;
  }
  runSync([sharedThis = shared_from_this(), func = std::move(func)] {
    if (!sharedThis->m_shutdown) {
      sharedThis->tryFunc(func);
    }
  });
}

void RCTMessageThread::quitSynchronous()
{
  m_shutdown = true;
  runSync([] {});
  CFRunLoopStop(m_cfRunLoop);
}

void RCTMessageThread::setRunLoop(NSRunLoop *runLoop)
{
  CFRelease(m_cfRunLoop);
  m_cfRunLoop = [runLoop getCFRunLoop];
  CFRetain(m_cfRunLoop);
}

} // namespace facebook::react
