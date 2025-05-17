/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>
#include <thread>

#include <jsi/jsi.h>

namespace facebook::react {

/*
 * Takes a function and calls it with a reference to a Runtime. The function
 * will be called when it is safe to do so (i.e. it ensures non-concurrent
 * access) and may be invoked asynchronously, depending on the implementation.
 * If you need to access a Runtime, it's encouraged to use a RuntimeExecutor
 * instead of storing a pointer to the Runtime itself, which makes it more
 * difficult to ensure that the Runtime is being accessed safely.
 */
using RuntimeExecutor =
    std::function<void(std::function<void(jsi::Runtime& runtime)>&& callback)>;

/**
 * Example order of events (when not a sync call in runtimeExecutor
 * jsWork):
 * - [UI thread] Lock all mutexes at start
 * - [UI thread] Schedule "runtime capture block" on js thread
 * - [UI thread] Wait for runtime capture: runtimeCaptured.lock()
 * - [JS thread] Capture runtime by setting runtimePtr
 * - [JS thread] Signal runtime captured: runtimeCaptured.unlock()
 * - [UI thread] Call jsWork using runtimePtr
 * - [JS thread] Wait until jsWork done: jsWorkDone.lock()
 * - [UI thread] Signal jsWork done: jsWorkDone.unlock()
 * - [UI thread] Wait until runtime capture block finished:
 *               runtimeCaptureBlockDone.lock()
 * - [JS thread] Signal runtime capture block is finished:
 *               runtimeCaptureBlockDone.unlock()
 */
inline static void executeSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor& runtimeExecutor,
    std::function<void(jsi::Runtime& runtime)>&& jsWork) noexcept {
  // Note: We need the third mutex to get back to the main thread before
  // the lambda is finished (because all mutexes are allocated on the stack).

  std::mutex runtimeCaptured;
  std::mutex jsWorkDone;
  std::mutex runtimeCaptureBlockDone;

  runtimeCaptured.lock();
  jsWorkDone.lock();
  runtimeCaptureBlockDone.lock();

  jsi::Runtime* runtimePtr;

  auto threadId = std::this_thread::get_id();
  auto runtimeCaptureBlock = [&](jsi::Runtime& runtime) {
    runtimePtr = &runtime;

    if (threadId == std::this_thread::get_id()) {
      // In case of a synchronous call, we should unlock mutexes and return.
      runtimeCaptured.unlock();
      runtimeCaptureBlockDone.unlock();
      return;
    }

    runtimeCaptured.unlock();
    // `jsWork` is called somewhere here.
    jsWorkDone.lock();
    runtimeCaptureBlockDone.unlock();
  };
  runtimeExecutor(std::move(runtimeCaptureBlock));

  runtimeCaptured.lock();
  jsWork(*runtimePtr);
  jsWorkDone.unlock();
  runtimeCaptureBlockDone.lock();
}

template <typename DataT>
inline static DataT executeSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor& runtimeExecutor,
    std::function<DataT(jsi::Runtime& runtime)>&& callback) noexcept {
  DataT data;

  executeSynchronouslyOnSameThread_CAN_DEADLOCK(
      runtimeExecutor,
      [&](jsi::Runtime& runtime) { data = callback(runtime); });

  return data;
}
} // namespace facebook::react
