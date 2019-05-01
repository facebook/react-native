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
#include <unordered_set>

#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(Ensure, basic) {
  size_t count = 0;
  auto cob = [&] { count++; };
  auto f = makeFuture(42)
               .ensure(cob)
               .then([](int) { throw std::runtime_error("ensure"); })
               .ensure(cob);

  EXPECT_THROW(std::move(f).get(), std::runtime_error);
  EXPECT_EQ(2, count);
}

TEST(Ensure, mutableLambda) {
  auto set = std::make_shared<std::unordered_set<int>>();
  set->insert(1);
  set->insert(2);

  auto f = makeFuture(4)
               .ensure([set]() mutable { set->clear(); })
               .thenValue([](auto&&) { throw std::runtime_error("ensure"); });

  EXPECT_EQ(0, set->size());
  EXPECT_THROW(std::move(f).get(), std::runtime_error);
}
