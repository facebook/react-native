/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/executors/TimedDrivableExecutor.h>

#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>

using namespace folly;

TEST(TimedDrivableExecutor, runIsStable) {
  size_t count = 0;
  TimedDrivableExecutor x;
  auto f1 = [&]() { count++; };
  auto f2 = [&]() {
    x.add(f1);
    x.add(f1);
  };
  x.add(f2);
  x.run();
  EXPECT_EQ(count, 0);
}

TEST(TimedDrivableExecutor, drainIsNotStable) {
  size_t count = 0;
  TimedDrivableExecutor x;
  auto f1 = [&]() { count++; };
  auto f2 = [&]() {
    x.add(f1);
    x.add(f1);
  };
  x.add(f2);
  x.drain();
  EXPECT_EQ(count, 2);
}

TEST(TimedDrivableExecutor, try_drive) {
  size_t count = 0;
  TimedDrivableExecutor x;
  auto f1 = [&]() { count++; };
  x.try_drive();
  EXPECT_EQ(count, 0);
  x.add(f1);
  x.try_drive();
  EXPECT_EQ(count, 1);
}

TEST(TimedDrivableExecutor, try_drive_for) {
  size_t count = 0;
  TimedDrivableExecutor x;
  auto f1 = [&]() { count++; };
  x.try_drive_for(std::chrono::milliseconds(100));
  EXPECT_EQ(count, 0);
  x.add(f1);
  x.try_drive_for(std::chrono::milliseconds(100));
  EXPECT_EQ(count, 1);
}

TEST(TimedDrivableExecutor, try_drive_until) {
  size_t count = 0;
  TimedDrivableExecutor x;
  auto f1 = [&]() { count++; };
  x.try_drive_until(
      std::chrono::system_clock::now() + std::chrono::milliseconds(100));
  EXPECT_EQ(count, 0);
  x.add(f1);
  x.try_drive_until(
      std::chrono::system_clock::now() + std::chrono::milliseconds(100));
  EXPECT_EQ(count, 1);
}
