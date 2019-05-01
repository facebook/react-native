/*
 * Copyright 2015-present Facebook, Inc.
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

#include <memory>
#include <vector>

#include <folly/Benchmark.h>
#include <folly/Singleton.h>
#include <folly/portability/GTest.h>
#include <folly/test/SingletonTestStructs.h>

/*
 * This test needs to be in its own file, as a standalone program.
 * We want to ensure no other singletons are registered, so we can
 * rely on some expectations about registered and living counts, etc.
 * All other tests should go in `SingletonTest.cpp`.
 */

using namespace folly;

namespace {
Singleton<GlobalWatchdog> global_watchdog;
} // namespace

// Test basic global usage (the default way singletons will generally
// be used).
TEST(Singleton, BasicGlobalUsage) {
  EXPECT_EQ(Watchdog::creation_order().size(), 0);
  EXPECT_GE(SingletonVault::singleton()->registeredSingletonCount(), 1);
  EXPECT_EQ(SingletonVault::singleton()->livingSingletonCount(), 0);

  {
    std::shared_ptr<GlobalWatchdog> wd1 = Singleton<GlobalWatchdog>::try_get();
    EXPECT_NE(wd1, nullptr);
    EXPECT_EQ(Watchdog::creation_order().size(), 1);
    std::shared_ptr<GlobalWatchdog> wd2 = Singleton<GlobalWatchdog>::try_get();
    EXPECT_NE(wd2, nullptr);
    EXPECT_EQ(wd1.get(), wd2.get());
    EXPECT_EQ(Watchdog::creation_order().size(), 1);
  }

  SingletonVault::singleton()->destroyInstances();
  EXPECT_EQ(Watchdog::creation_order().size(), 0);
}
