/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/executors/QueuedImmediateExecutor.h>

#include "JsiIntegrationTest.h"
#include "engines/JsiIntegrationTestHermesEngineAdapter.h"

#include <jsinspector-modern/ConsoleTaskOrchestrator.h>

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

/**
 * A test fixture for the console.createTask API.
 */
class ConsoleCreateTaskTest : public JsiIntegrationPortableTestBase<
                                  JsiIntegrationTestHermesEngineAdapter,
                                  folly::QueuedImmediateExecutor> {};

TEST_F(ConsoleCreateTaskTest, Installed) {
  auto result = eval("typeof console.createTask");
  auto& runtime = engineAdapter_->getRuntime();
  EXPECT_EQ(result.asString(runtime).utf8(runtime), "function");
}

TEST_F(ConsoleCreateTaskTest, ReturnsTaskObject) {
  auto result = eval("typeof console.createTask('test-task')");
  auto& runtime = engineAdapter_->getRuntime();
  EXPECT_EQ(result.asString(runtime).utf8(runtime), "object");
}

TEST_F(ConsoleCreateTaskTest, TaskObjectHasRunMethod) {
  auto result = eval("typeof console.createTask('test-task').run");
  auto& runtime = engineAdapter_->getRuntime();
  EXPECT_EQ(result.asString(runtime).utf8(runtime), "function");
}

TEST_F(ConsoleCreateTaskTest, RunMethodExecutesFunction) {
  auto result = eval(R"(
    let executed = false;
    const task = console.createTask('test-task');
    task.run(() => { executed = true; });
    executed;
  )");
  EXPECT_TRUE(result.getBool());
}

TEST_F(ConsoleCreateTaskTest, RunMethodReturnsValue) {
  auto result = eval(R"(
    const task = console.createTask('test-task');
    task.run(() => 42);
  )");
  EXPECT_EQ(result.getNumber(), 42);
}

TEST_F(ConsoleCreateTaskTest, ThrowsOnNoArguments) {
  EXPECT_THROW(eval("console.createTask()"), facebook::jsi::JSError);
}

TEST_F(ConsoleCreateTaskTest, ThrowsOnEmptyString) {
  EXPECT_THROW(eval("console.createTask('')"), facebook::jsi::JSError);
}

TEST_F(ConsoleCreateTaskTest, ThrowsOnNonStringArgument) {
  EXPECT_THROW(eval("console.createTask(123)"), facebook::jsi::JSError);
  EXPECT_THROW(eval("console.createTask(null)"), facebook::jsi::JSError);
  EXPECT_THROW(eval("console.createTask(undefined)"), facebook::jsi::JSError);
  EXPECT_THROW(eval("console.createTask({})"), facebook::jsi::JSError);
}

TEST_F(ConsoleCreateTaskTest, RunMethodThrowsOnNoArguments) {
  EXPECT_THROW(
      eval(R"(
    const task = console.createTask('test-task');
    task.run();
  )"),
      facebook::jsi::JSError);
}

TEST_F(ConsoleCreateTaskTest, RunMethodThrowsOnNonFunction) {
  EXPECT_THROW(
      eval(R"(
    const task = console.createTask('test-task');
    task.run(123);
  )"),
      facebook::jsi::JSError);
  EXPECT_THROW(
      eval(R"(
    const task = console.createTask('test-task');
    task.run('not a function');
  )"),
      facebook::jsi::JSError);
  EXPECT_THROW(
      eval(R"(
    const task = console.createTask('test-task');
    task.run({});
  )"),
      facebook::jsi::JSError);
}

TEST_F(ConsoleCreateTaskTest, MultipleTasksCanBeCreated) {
  auto result = eval(R"(
    const task1 = console.createTask('task-1');
    const task2 = console.createTask('task-2');
    let count = 0;
    task1.run(() => { count++; });
    task2.run(() => { count++; });
    count;
  )");
  EXPECT_EQ(result.getNumber(), 2);
}

TEST_F(ConsoleCreateTaskTest, TaskCanBeRunMultipleTimes) {
  auto result = eval(R"(
    const task = console.createTask('test-task');
    let count = 0;
    task.run(() => { count++; });
    task.run(() => { count++; });
    task.run(() => { count++; });
    count;
  )");
  EXPECT_EQ(result.getNumber(), 3);
}

} // namespace facebook::react::jsinspector_modern
