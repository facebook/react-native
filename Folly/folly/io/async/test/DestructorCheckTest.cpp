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

#include <folly/io/async/DestructorCheck.h>
#include <folly/Memory.h>
#include <folly/portability/GTest.h>

using namespace folly;
using namespace testing;

class Derived : public DestructorCheck {};

TEST(DestructorCheckTest, WithoutGuard) {
  Derived d;
}

TEST(DestructorCheckTest, SingleGuard) {
  Derived d;
  Derived::Safety s(d);
  ASSERT_FALSE(s.destroyed());
}

TEST(DestructorCheckTest, SingleGuardDestroyed) {
  auto d = std::make_unique<Derived>();
  Derived::Safety s(*d);
  ASSERT_FALSE(s.destroyed());
  d.reset();
  ASSERT_TRUE(s.destroyed());
}

TEST(DestructorCheckTest, MultipleGuards) {
  Derived d;
  auto s1 = std::make_unique<Derived::Safety>(d);
  auto s2 = std::make_unique<Derived::Safety>(d);
  auto s3 = std::make_unique<Derived::Safety>(d);

  // Remove the middle of the list.
  ASSERT_FALSE(s2->destroyed());
  s2.reset();

  // Add in a link after a removal has occurred.
  auto s4 = std::make_unique<Derived::Safety>(d);

  // Remove the beginning of the list.
  ASSERT_FALSE(s1->destroyed());
  s1.reset();
  // Remove the end of the list.
  ASSERT_FALSE(s4->destroyed());
  s4.reset();
  // Remove the last remaining of the list.
  ASSERT_FALSE(s3->destroyed());
  s3.reset();
}

TEST(DestructorCheckTest, MultipleGuardsDestroyed) {
  auto d = std::make_unique<Derived>();
  auto s1 = std::make_unique<Derived::Safety>(*d);
  auto s2 = std::make_unique<Derived::Safety>(*d);
  auto s3 = std::make_unique<Derived::Safety>(*d);
  auto s4 = std::make_unique<Derived::Safety>(*d);

  // Remove something from the list.
  ASSERT_FALSE(s2->destroyed());
  s2.reset();

  ASSERT_FALSE(s1->destroyed());
  ASSERT_FALSE(s3->destroyed());
  ASSERT_FALSE(s4->destroyed());

  d.reset();

  ASSERT_TRUE(s1->destroyed());
  ASSERT_TRUE(s3->destroyed());
  ASSERT_TRUE(s4->destroyed());
}
