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
  using lifted = Unit::Lift<int>;
  using actual = std::is_same<int, lifted::type>;
  EXPECT_TRUE(actual::value);
}

TEST(Unit, liftUnit) {
  using lifted = Unit::Lift<Unit>;
  using actual = std::is_same<Unit, lifted::type>;
  EXPECT_TRUE(actual::value);
}

TEST(Unit, liftVoid) {
  using lifted = Unit::Lift<void>;
  using actual = std::is_same<Unit, lifted::type>;
  EXPECT_TRUE(actual::value);
}

TEST(Unit, dropInt) {
  using dropped = Unit::Drop<int>;
  using actual = std::is_same<int, dropped::type>;
  EXPECT_TRUE(actual::value);
}

TEST(Unit, dropUnit) {
  using dropped = Unit::Drop<Unit>;
  using actual = std::is_same<void, dropped::type>;
  EXPECT_TRUE(actual::value);
}

TEST(Unit, dropVoid) {
  using dropped = Unit::Drop<void>;
  using actual = std::is_same<void, dropped::type>;
  EXPECT_TRUE(actual::value);
}
