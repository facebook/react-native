/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/API/hermes/hermes.h>
#include <jsi/jsi.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <memory>
#include "StubClock.h"
#include "StubQueue.h"

namespace facebook::react {

using namespace std::chrono_literals;

class RuntimeSchedulerTest : public testing::Test {
 protected:
  void SetUp() override {
    hostFunctionCallCount_ = 0;
    runtime_ = facebook::hermes::makeHermesRuntime();
    stubQueue_ = std::make_unique<StubQueue>();

    RuntimeExecutor runtimeExecutor =
        [this](
            std::function<void(facebook::jsi::Runtime & runtime)> &&callback) {
          stubQueue_->runOnQueue([this, callback = std::move(callback)]() {
            callback(*runtime_);
          });
        };

    stubClock_ = std::make_unique<StubClock>(StubClock());

    auto stubNow = [this]() -> RuntimeSchedulerTimePoint {
      return stubClock_->getNow();
    };

    runtimeScheduler_ =
        std::make_unique<RuntimeScheduler>(runtimeExecutor, stubNow);
  }

  jsi::Function createHostFunctionFromLambda(
      std::function<void(bool)> callback) {
    return jsi::Function::createFromHostFunction(
        *runtime_,
        jsi::PropNameID::forUtf8(*runtime_, ""),
        3,
        [this, callback = std::move(callback)](
            jsi::Runtime &,
            jsi::Value const &,
            jsi::Value const *arguments,
            size_t) noexcept -> jsi::Value {
          ++hostFunctionCallCount_;
          auto didUserCallbackTimeout = arguments[0].getBool();
          callback(didUserCallbackTimeout);
          return jsi::Value::undefined();
        });
  }

  uint hostFunctionCallCount_;

  std::unique_ptr<facebook::hermes::HermesRuntime> runtime_;
  std::unique_ptr<StubClock> stubClock_;
  std::unique_ptr<StubQueue> stubQueue_;
  std::unique_ptr<RuntimeScheduler> runtimeScheduler_;
};

TEST_F(RuntimeSchedulerTest, now) {
  stubClock_->setTimePoint(1ms);

  EXPECT_EQ(runtimeScheduler_->now(), RuntimeSchedulerTimePoint(1ms));

  stubClock_->advanceTimeBy(10ms);

  EXPECT_EQ(runtimeScheduler_->now(), RuntimeSchedulerTimePoint(11ms));

  stubClock_->advanceTimeBy(6s);

  EXPECT_EQ(runtimeScheduler_->now(), RuntimeSchedulerTimePoint(6011ms));
}

TEST_F(RuntimeSchedulerTest, getShouldYield) {
  // Always returns false for now.
  EXPECT_FALSE(runtimeScheduler_->getShouldYield());
}

TEST_F(RuntimeSchedulerTest, scheduleSingleTask) {
  bool didRunTask = false;
  auto callback =
      createHostFunctionFromLambda([&didRunTask](bool didUserCallbackTimeout) {
        didRunTask = true;
        EXPECT_FALSE(didUserCallbackTimeout);
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  EXPECT_FALSE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, scheduleImmediatePriorityTask) {
  bool didRunTask = false;
  auto callback =
      createHostFunctionFromLambda([&didRunTask](bool didUserCallbackTimeout) {
        didRunTask = true;
        EXPECT_FALSE(didUserCallbackTimeout);
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::ImmediatePriority, std::move(callback));

  EXPECT_FALSE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, taskExpiration) {
  bool didRunTask = false;
  auto callback =
      createHostFunctionFromLambda([&didRunTask](bool didUserCallbackTimeout) {
        didRunTask = true;
        // Task has timed out but the parameter is deprecated and `false` is
        // hardcoded.
        EXPECT_FALSE(didUserCallbackTimeout);
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  // Task with normal priority has 5s timeout.
  stubClock_->advanceTimeBy(6s);

  EXPECT_FALSE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_TRUE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, scheduleTwoTasksWithSamePriority) {
  uint firstTaskCallOrder;
  auto callbackOne =
      createHostFunctionFromLambda([this, &firstTaskCallOrder](bool) {
        firstTaskCallOrder = hostFunctionCallCount_;
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callbackOne));

  uint secondTaskCallOrder;
  auto callbackTwo =
      createHostFunctionFromLambda([this, &secondTaskCallOrder](bool) {
        secondTaskCallOrder = hostFunctionCallCount_;
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callbackTwo));

  EXPECT_EQ(firstTaskCallOrder, 0);
  EXPECT_EQ(secondTaskCallOrder, 0);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_EQ(firstTaskCallOrder, 1);
  EXPECT_EQ(secondTaskCallOrder, 2);
  EXPECT_EQ(stubQueue_->size(), 0);
  EXPECT_EQ(hostFunctionCallCount_, 2);
}

TEST_F(RuntimeSchedulerTest, scheduleTwoTasksWithDifferentPriorities) {
  uint lowPriorityTaskCallOrder;
  auto callbackOne =
      createHostFunctionFromLambda([this, &lowPriorityTaskCallOrder](bool) {
        lowPriorityTaskCallOrder = hostFunctionCallCount_;
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::LowPriority, std::move(callbackOne));

  uint userBlockingPriorityTaskCallOrder;
  auto callbackTwo = createHostFunctionFromLambda(
      [this, &userBlockingPriorityTaskCallOrder](bool) {
        userBlockingPriorityTaskCallOrder = hostFunctionCallCount_;
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::UserBlockingPriority, std::move(callbackTwo));

  EXPECT_EQ(lowPriorityTaskCallOrder, 0);
  EXPECT_EQ(userBlockingPriorityTaskCallOrder, 0);
  EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  EXPECT_EQ(lowPriorityTaskCallOrder, 2);
  EXPECT_EQ(userBlockingPriorityTaskCallOrder, 1);
  EXPECT_EQ(stubQueue_->size(), 0);
  EXPECT_EQ(hostFunctionCallCount_, 2);
}

TEST_F(RuntimeSchedulerTest, cancelTask) {
  bool didRunTask = false;
  auto callback =
      createHostFunctionFromLambda([&didRunTask](bool) { didRunTask = true; });

  auto task = runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  EXPECT_FALSE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 1);

  runtimeScheduler_->cancelTask(task);

  stubQueue_->tick();

  EXPECT_FALSE(didRunTask);
  EXPECT_EQ(stubQueue_->size(), 0);
}

} // namespace facebook::react
