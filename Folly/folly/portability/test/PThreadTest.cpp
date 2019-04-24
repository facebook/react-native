/*
 * Copyright 2016-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <folly/portability/PThread.h>

#include <folly/portability/GTest.h>

#include <atomic>

TEST(PThreadTest, pthread_create_and_join) {
  static std::atomic<bool> hasRun{false};
  static std::atomic<int32_t> argPassedIn{0};
  auto mainFunc = [](void* arg) -> void* {
    hasRun = true;
    argPassedIn = (int32_t) reinterpret_cast<uintptr_t>(arg);
    return nullptr;
  };

  pthread_t thread;
  EXPECT_EQ(pthread_create(&thread, nullptr, mainFunc, (void*)53), 0);
  EXPECT_EQ(pthread_join(thread, nullptr), 0);
  EXPECT_TRUE(hasRun);
  EXPECT_EQ(argPassedIn, 53);
}

TEST(PThreadTest, pthread_join_return_value) {
  static std::atomic<bool> hasRun{false};
  auto mainFunc = [](void*) -> void* {
    hasRun = true;
    return (void*)5;
  };

  pthread_t thread;
  EXPECT_EQ(pthread_create(&thread, nullptr, mainFunc, nullptr), 0);
  void* exitCode = nullptr;
  EXPECT_EQ(pthread_join(thread, &exitCode), 0);
  EXPECT_EQ(exitCode, (void*)5);
  EXPECT_TRUE(hasRun);
}

TEST(PThreadTest, pthread_equal) {
  auto self = pthread_self();
  EXPECT_NE(pthread_equal(self, self), 0);

  auto mainFunc = [](void*) -> void* { return nullptr; };
  pthread_t thread;
  EXPECT_EQ(pthread_create(&thread, nullptr, mainFunc, nullptr), 0);
  EXPECT_EQ(pthread_equal(thread, self), 0);
}

TEST(PThreadTest, pthread_self_on_pthread_thread) {
  static std::atomic<bool> hasRun{false};
  static pthread_t otherSelf;
  auto mainFunc = [](void*) -> void* {
    hasRun = true;
    otherSelf = pthread_self();
    return nullptr;
  };

  pthread_t thread;
  EXPECT_EQ(pthread_create(&thread, nullptr, mainFunc, nullptr), 0);
  EXPECT_EQ(pthread_join(thread, nullptr), 0);
  EXPECT_NE(pthread_equal(otherSelf, thread), 0);
  EXPECT_TRUE(hasRun);
}
