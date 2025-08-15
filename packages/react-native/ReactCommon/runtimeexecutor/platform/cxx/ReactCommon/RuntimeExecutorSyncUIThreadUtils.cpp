/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactCommon/RuntimeExecutorSyncUIThreadUtils.h>
#include <future>
#include <thread>

namespace facebook::react {

/*
 * Schedules `runtimeWork` to be executed on the same thread using the
 * `RuntimeExecutor`, and blocks on its completion.
 *
 * Example:
 * - [UI thread] Schedule `runtimeCaptureBlock` on js thread
 * - [UI thread] Wait for runtime capture: await(runtime)
 * - [JS thread] Capture runtime for ui thread: resolve(runtime, &rt);
 * - [JS thread] Wait until runtimeWork done: await(runtimeWorkDone)
 * - [UI thread] Call runtimeWork: runtimeWork(*runtimePrt);
 * - [UI thread] Signal runtimeWork done: resolve(runtimeWorkDone)
 * - [UI thread] Wait until runtime capture block finished:
 *               await(runtimeCaptureBlockDone);
 * - [JS thread] Signal runtime capture block is finished:
 *               resolve(runtimeCaptureBlockDone);
 */
void executeSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor& runtimeExecutor,
    std::function<void(jsi::Runtime&)>&& runtimeWork) {
  std::promise<jsi::Runtime*> runtime;
  std::promise<void> runtimeCaptureBlockDone;
  std::promise<void> runtimeWorkDone;

  auto callingThread = std::this_thread::get_id();

  auto runtimeCaptureBlock = [&](jsi::Runtime& rt) {
    runtime.set_value(&rt);

    auto runtimeThread = std::this_thread::get_id();
    if (callingThread != runtimeThread) {
      // Block `runtimeThread` on execution of `runtimeWork` on `callingThread`.
      runtimeWorkDone.get_future().wait();
    }

    // TODO(T225331233): This is likely unnecessary. Remove it.
    runtimeCaptureBlockDone.set_value();
  };
  runtimeExecutor(std::move(runtimeCaptureBlock));

  jsi::Runtime* runtimePtr = runtime.get_future().get();
  runtimeWork(*runtimePtr);
  runtimeWorkDone.set_value();

  // TODO(T225331233): This is likely unnecessary. Remove it.
  runtimeCaptureBlockDone.get_future().wait();
}

} // namespace facebook::react
