/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/Singleton.h>
#include <folly/SingletonVault_c.h>

#include <folly/portability/GTest.h>

FOLLY_TLS long instance_counter_instances = 0;

class InstanceCounter {
 public:
  InstanceCounter() {
    instance_counter_instances++;
  }

  ~InstanceCounter() {
    instance_counter_instances--;
  }
};

TEST(SingletonVault, singletonReturnsSingletonInstance) {
  SingletonVault_t *c = SingletonVault_singleton();
  auto *cpp = folly::SingletonVault::singleton();
  EXPECT_EQ(c, cpp);
}

struct TestTag {};
template <typename T, typename Tag = folly::detail::DefaultTag>
using SingletonTest = folly::Singleton <T, Tag, TestTag>;

TEST(SingletonVault, singletonsAreCreatedAndDestroyed) {
  auto vault = folly::SingletonVault::singleton<TestTag>();
  SingletonTest<InstanceCounter> counter_singleton;
  SingletonVault_registrationComplete((SingletonVault_t*) vault);
  SingletonTest<InstanceCounter>::try_get();
  EXPECT_EQ(instance_counter_instances, 1);
  SingletonVault_destroyInstances((SingletonVault_t*) vault);
  EXPECT_EQ(instance_counter_instances, 0);
}
