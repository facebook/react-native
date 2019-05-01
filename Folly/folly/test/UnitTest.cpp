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

#include <folly/Unit.h>

#include <folly/portability/GTest.h>

using namespace folly;

TEST(Unit, operatorEq) {
  EXPECT_TRUE(Unit{} == Unit{});
}

TEST(Unit, operatorNe) {
  EXPECT_FALSE(Unit{} != Unit{});
}

TEST(Unit, liftInt) {
  using lifted = lift_unit_t<int>;
  using actual = std::is_same<int, lifted>;
  EXPECT_TRUE(actual::value);
}

TEST(Unit, liftUnit) {
  using lifted = lift_unit_t<Unit>;
  using actual = std::is_same<Unit, lifted>;
  EXPECT_TRUE(actual::value);
}

TEST(Unit, liftVoid) {
  using lifted = lift_unit_t<void>;
  using actual = std::is_same<Unit, lifted>;
  EXPECT_TRUE(actual::value);
}

TEST(Unit, dropInt) {
  using dropped = drop_unit_t<int>;
  using actual = std::is_same<int, dropped>;
  EXPECT_TRUE(actual::value);
}

TEST(Unit, dropUnit) {
  using dropped = drop_unit_t<Unit>;
  using actual = std::is_same<void, dropped>;
  EXPECT_TRUE(actual::value);
}

TEST(Unit, dropVoid) {
  using dropped = drop_unit_t<void>;
  using actual = std::is_same<void, dropped>;
  EXPECT_TRUE(actual::value);
}
