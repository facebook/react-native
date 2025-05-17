/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactCommon/RuntimeExecutor.h>

#include <jsi/jsi.h>

namespace facebook::react {

/*
 * Executes a `callback` in a *synchronous* manner on the same thread using
 * given `RuntimeExecutor`.
 * Use this method when the caller needs to *be blocked* by executing the
 * `callback` and requires that the callback will be executed on the same
 * thread.
 */
void executeSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor& runtimeExecutor,
    std::function<void(jsi::Runtime& runtime)>&& callback) noexcept;

template <typename DataT>
DataT executeSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor& runtimeExecutor,
    std::function<DataT(jsi::Runtime& runtime)>&& callback) noexcept {
  DataT data;

  executeSynchronouslyOnSameThread_CAN_DEADLOCK(
      runtimeExecutor,
      [&](jsi::Runtime& runtime) { data = callback(runtime); });

  return data;
}
} // namespace facebook::react
