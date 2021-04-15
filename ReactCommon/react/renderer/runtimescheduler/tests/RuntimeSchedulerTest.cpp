/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include "StubClock.h"

using namespace facebook::react;
using namespace std::chrono_literals;

TEST(RuntimeSchedulerTest, now) {
  facebook::jsi::Runtime *runtime;

  RuntimeExecutor runtimeExecutor =
      [&runtime](
          std::function<void(facebook::jsi::Runtime & runtime)> &&callback) {
        // TODO: This will crash if executed.
        callback(*runtime);
      };

  auto stubClock = StubClock();
  stubClock.setTimePoint(1ms);

  auto stubNow = [&stubClock]() -> RuntimeSchedulerTimePoint {
    return stubClock.getNow();
  };

  auto runtimeScheduler = RuntimeScheduler(runtimeExecutor, stubNow);
  EXPECT_EQ(runtimeScheduler.now(), RuntimeSchedulerTimePoint(1ms));

  stubClock.advanceTimeBy(10ms);

  EXPECT_EQ(runtimeScheduler.now(), RuntimeSchedulerTimePoint(11ms));

  stubClock.advanceTimeBy(6s);

  EXPECT_EQ(runtimeScheduler.now(), RuntimeSchedulerTimePoint(6011ms));
}
