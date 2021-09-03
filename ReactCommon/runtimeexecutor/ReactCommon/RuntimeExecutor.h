/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>
#include <thread>

#include <jsi/jsi.h>

namespace facebook {
namespace react {

/*
 * Takes a function and calls it with a reference to a Runtime. The function
 * will be called when it is safe to do so (i.e. it ensures non-concurrent
 * access) and may be invoked asynchronously, depending on the implementation.
 * If you need to access a Runtime, it's encouraged to use a RuntimeExecutor
 * instead of storing a pointer to the Runtime itself, which makes it more
 * difficult to ensure that the Runtime is being accessed safely.
 */
using RuntimeExecutor =
    std::function<void(std::function<void(jsi::Runtime &runtime)> &&callback)>;

/*
 * The caller can expect that the callback will be executed sometime later on an
 * unspecified thread.
 * Use this method when the caller prefers to not be blocked by executing the
 * `callback`.
 * Note that this method does not provide any guarantees
 * about when the `callback` will be executed (before returning to the caller,
 * after that, or in parallel), the only thing that is guaranteed is that there
 * is no synchronization.
 */
inline static void executeAsynchronously(
    RuntimeExecutor const &runtimeExecutor,
    std::function<void(jsi::Runtime &runtime)> &&callback) noexcept {
  std::thread([callback = std::move(callback), runtimeExecutor]() mutable {
    runtimeExecutor(std::move(callback));
  }).detach();
}

/*
 * Executes a `callback` in a *synchronous* manner using given
 * `RuntimeExecutor`.
 * Use this method when the caller needs to *be blocked* by executing the
 * callback but does not concerned about the particular thread on which the
 * `callback` will be executed.
 */
inline static void executeSynchronously_CAN_DEADLOCK(
    RuntimeExecutor const &runtimeExecutor,
    std::function<void(jsi::Runtime &runtime)> &&callback) noexcept {
  std::mutex mutex;
  mutex.lock();

  runtimeExecutor(
      [callback = std::move(callback), &mutex](jsi::Runtime &runtime) {
        callback(runtime);
        mutex.unlock();
      });

  mutex.lock();
}

/*
 * Executes a `callback` in a *synchronous* manner on the same thread using
 * given `RuntimeExecutor`.
 * Use this method when the caller needs to *be blocked* by executing the
 * `callback` and requires that the callback will be executed on the same
 * thread.
 */
inline static void executeSynchronouslyOnSameThread_CAN_DEADLOCK(
    RuntimeExecutor const &runtimeExecutor,
    std::function<void(jsi::Runtime &runtime)> &&callback) noexcept {
  // Note: We need the third mutex to get back to the main thread before
  // the lambda is finished (because all mutexes are allocated on the stack).

  std::mutex mutex1;
  std::mutex mutex2;
  std::mutex mutex3;

  mutex1.lock();
  mutex2.lock();
  mutex3.lock();

  jsi::Runtime *runtimePtr;

  auto threadId = std::this_thread::get_id();

  runtimeExecutor([&](jsi::Runtime &runtime) {
    runtimePtr = &runtime;

    if (threadId == std::this_thread::get_id()) {
      // In case of a synchronous call, we should unlock mutexes and return.
      mutex1.unlock();
      mutex3.unlock();
      return;
    }

    mutex1.unlock();
    // `callback` is called somewhere here.
    mutex2.lock();
    mutex3.unlock();
  });

  mutex1.lock();
  callback(*runtimePtr);
  mutex2.unlock();
  mutex3.lock();
}

template <typename DataT>
inline static DataT executeSynchronouslyOnSameThread_CAN_DEADLOCK(
    RuntimeExecutor const &runtimeExecutor,
    std::function<DataT(jsi::Runtime &runtime)> &&callback) noexcept {
  DataT data;

  executeSynchronouslyOnSameThread_CAN_DEADLOCK(
      runtimeExecutor,
      [&](jsi::Runtime &runtime) { data = callback(runtime); });

  return data;
}
} // namespace react
} // namespace facebook
