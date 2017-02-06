/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "RCTMessageThread.h"

#include <condition_variable>
#include <mutex>

#include <React/RCTUtils.h>
#include <jschelpers/JSCHelpers.h>

// A note about the implementation: This class is not used
// generically.  It's a thin wrapper around a run loop which
// implements a C++ interface, for use by the C++ xplat bridge code.
// This means it can make certain non-generic assumptions.  In
// particular, the sync functions are only used for bridge setup and
// teardown, and quitSynchronous is guaranteed to be called.

namespace facebook {
namespace react {

RCTMessageThread::RCTMessageThread(NSRunLoop *runLoop, RCTJavaScriptCompleteBlock errorBlock)
  : m_cfRunLoop([runLoop getCFRunLoop])
  , m_errorBlock(errorBlock)
  , m_shutdown(false) {
  CFRetain(m_cfRunLoop);
}

RCTMessageThread::~RCTMessageThread() {
  CFRelease(m_cfRunLoop);
}

// This is analogous to dispatch_async
void RCTMessageThread::runAsync(std::function<void()> func) {
  CFRunLoopPerformBlock(m_cfRunLoop, kCFRunLoopCommonModes, ^{ func(); });
  CFRunLoopWakeUp(m_cfRunLoop);
}

// This is analogous to dispatch_sync
void RCTMessageThread::runSync(std::function<void()> func) {
  if (m_cfRunLoop == CFRunLoopGetCurrent()) {
    func();
    return;
  }

  dispatch_semaphore_t sema = dispatch_semaphore_create(0);
  runAsync([func=std::make_shared<std::function<void()>>(std::move(func)), &sema] {
    (*func)();
    dispatch_semaphore_signal(sema);
  });
  dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);
}

void RCTMessageThread::tryFunc(const std::function<void()>& func) {
  try {
    @try {
      func();
    }
    @catch (NSException *exception) {
      NSString *message =
        [NSString stringWithFormat:@"Exception '%@' was thrown from JS thread", exception];
      m_errorBlock(RCTErrorWithMessage(message));
    }
    @catch (id exception) {
      // This will catch any other ObjC exception, but no C++ exceptions
      m_errorBlock(RCTErrorWithMessage(@"non-std ObjC Exception"));
    }
  } catch (const facebook::react::JSException &ex) {
    // This is a special case.  We want to extract the stack
    // information and pass it to the redbox.  This will lose the C++
    // stack, but it's of limited value.
    NSDictionary *errorInfo = @{
      RCTJSRawStackTraceKey: @(ex.getStack().c_str()),
      NSLocalizedDescriptionKey: [@"Unhandled JS Exception: " stringByAppendingString:@(ex.what())]
    };
    m_errorBlock([NSError errorWithDomain:RCTErrorDomain code:1 userInfo:errorInfo]);
  } catch (const std::exception &ex) {
    m_errorBlock(RCTErrorWithMessage(@(ex.what())));
  } catch (...) {
    // On a 64-bit platform, this would catch ObjC exceptions, too, but not on
    // 32-bit platforms, so we catch those with id exceptions above.
    m_errorBlock(RCTErrorWithMessage(@"non-std C++ exception"));
  }
}

void RCTMessageThread::runOnQueue(std::function<void()>&& func) {
  if (m_shutdown) {
    return;
  }

  runAsync([this, func=std::make_shared<std::function<void()>>(std::move(func))] {
    if (!m_shutdown) {
      tryFunc(*func);
    }
  });
}

void RCTMessageThread::runOnQueueSync(std::function<void()>&& func) {
  if (m_shutdown) {
    return;
  }
  runSync([this, func=std::move(func)] {
    if (!m_shutdown) {
      tryFunc(func);
    }
  });
}

void RCTMessageThread::quitSynchronous() {
  m_shutdown = true;
  runSync([]{});
  CFRunLoopStop(m_cfRunLoop);
}

}
}
