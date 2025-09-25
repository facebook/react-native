/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/threading/TaskDispatchThread.h>
#include <atomic>
#include <chrono>
#include <thread>

namespace facebook::react {

class TaskDispatchThreadTest : public ::testing::Test {
 protected:
  std::unique_ptr<TaskDispatchThread> dispatcher{
      std::make_unique<TaskDispatchThread>()};
};

// Test: isOnThread returns true inside the looper thread
TEST_F(TaskDispatchThreadTest, IsOnThreadReturnsTrueInLooper) {
  bool result = false;
  dispatcher->runSync([&] { result = dispatcher->isOnThread(); });
  EXPECT_TRUE(result);
}

// Test: isRunning returns true before quit, false after
TEST_F(TaskDispatchThreadTest, IsRunningFlag) {
  EXPECT_TRUE(dispatcher->isRunning());
  dispatcher->quit();
  EXPECT_FALSE(dispatcher->isRunning());
}

// Test: runAsync executes the task
TEST_F(TaskDispatchThreadTest, RunAsyncExecutesTask) {
  std::atomic<int> counter{0};
  dispatcher->runAsync([&] { counter++; });
  // Wait for task to complete
  std::this_thread::sleep_for(std::chrono::milliseconds(50));
  EXPECT_EQ(counter.load(), 1);
}

// Test: runSync executes the task and blocks until done
TEST_F(TaskDispatchThreadTest, RunSyncExecutesTask) {
  std::atomic<int> counter{0};
  dispatcher->runSync([&] { counter++; });
  EXPECT_EQ(counter.load(), 1);
}

// Test: runAsync with delay
TEST_F(TaskDispatchThreadTest, RunAsyncWithDelay) {
  std::atomic<int> counter{0};
  dispatcher->runAsync([&] { counter++; }, std::chrono::milliseconds(100));
  std::this_thread::sleep_for(std::chrono::milliseconds(50));
  EXPECT_EQ(counter.load(), 0); // Not yet executed
  std::this_thread::sleep_for(std::chrono::milliseconds(70));
  EXPECT_EQ(counter.load(), 1); // Should be executed now
}

// Test: Multiple delayed tasks execute in order
TEST_F(TaskDispatchThreadTest, MultipleDelayedTasksOrder) {
  std::vector<int> results;
  dispatcher->runAsync(
      [&] { results.push_back(1); }, std::chrono::milliseconds(50));
  dispatcher->runAsync(
      [&] { results.push_back(2); }, std::chrono::milliseconds(100));
  std::this_thread::sleep_for(std::chrono::milliseconds(120));
  ASSERT_EQ(results.size(), 2);
  EXPECT_EQ(results[0], 1);
  EXPECT_EQ(results[1], 2);
}

// Test: runSync blocks until task is done
TEST_F(TaskDispatchThreadTest, RunSyncBlocksUntilDone) {
  std::atomic<bool> started{false};
  std::atomic<bool> finished{false};
  dispatcher->runAsync([&] {
    started = true;
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    finished = true;
  });
  dispatcher->runSync([&] {
    EXPECT_TRUE(started);
    EXPECT_TRUE(finished);
  });
}

// Test: quit prevents further tasks from running
TEST_F(TaskDispatchThreadTest, QuitPreventsFurtherTasks) {
  dispatcher->quit();
  std::atomic<int> counter{0};
  dispatcher->runAsync([&] { counter++; });
  std::this_thread::sleep_for(std::chrono::milliseconds(50));
  EXPECT_EQ(counter.load(), 0);
}

// Test: Multiple runSync tasks execute serially
TEST_F(TaskDispatchThreadTest, MultipleRunSyncSerialExecution) {
  std::vector<int> results;
  dispatcher->runSync([&] { results.push_back(1); });
  dispatcher->runSync([&] { results.push_back(2); });
  EXPECT_EQ(results.size(), 2);
  EXPECT_EQ(results[0], 1);
  EXPECT_EQ(results[1], 2);
}

// Test: Edge case - runSync after quit should not execute
TEST_F(TaskDispatchThreadTest, RunSyncAfterQuitDoesNotExecute) {
  dispatcher->quit();
  std::atomic<int> counter{0};
  dispatcher->runSync([&] { counter++; });
  EXPECT_EQ(counter.load(), 0);
}

// Test: Thread safety - runAsync from multiple threads
TEST_F(TaskDispatchThreadTest, RunAsyncFromMultipleThreads) {
  std::atomic<int> counter{0};
  auto task = [&] { dispatcher->runAsync([&] { counter++; }); };
  std::thread t1(task);
  std::thread t2(task);
  std::thread t3(task);
  t1.join();
  t2.join();
  t3.join();
  std::this_thread::sleep_for(std::chrono::milliseconds(100));
  EXPECT_EQ(counter.load(), 3);
}

TEST_F(TaskDispatchThreadTest, QuitInTaskShouldntBeBlockedForever) {
  dispatcher->runSync([&] { dispatcher->quit(); });
}

TEST_F(TaskDispatchThreadTest, QuitShouldWaitAlreadyRunningTask) {
  {
    std::unique_ptr<int> counter = std::make_unique<int>(0);
    dispatcher->runAsync([&] {
      std::this_thread::sleep_for(std::chrono::milliseconds(300));
      *counter = 1;
    });
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    // if quit doesn't wait for running task, then *counter will access already
    // deleted object
    dispatcher->quit();
  }
  // forcing dispatcher to join thread
  dispatcher.reset();
}
} // namespace facebook::react
