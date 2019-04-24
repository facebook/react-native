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

#include <folly/detail/StaticSingletonManager.h>

#include <folly/portability/GTest.h>

namespace folly {
namespace detail {

struct StaticSingletonManagerTest : public testing::Test {};

template <typename T>
struct Tag {};

TEST_F(StaticSingletonManagerTest, example) {
  auto make3 = [n = 3] { return new int(n); };
  auto i = createGlobal<int, Tag<char>>(make3);
  ASSERT_NE(nullptr, i);
  EXPECT_EQ(3, *i);

  auto const make4 = [n = 4] { return new int(n); };
  auto j = createGlobal<int, Tag<char>>(make4);
  ASSERT_NE(nullptr, j);
  EXPECT_EQ(i, j);
  EXPECT_EQ(3, *j);

  auto make5 = [n = 5] { return new int(n); };
  auto k = createGlobal<int, Tag<char*>>(std::move(make5));
  ASSERT_NE(nullptr, k);
  EXPECT_NE(i, k);
  EXPECT_EQ(5, *k);
}

} // namespace detail
} // namespace folly
