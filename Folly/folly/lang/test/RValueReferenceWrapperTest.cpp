/*
 * Copyright 2017-present Facebook, Inc.
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

#include <utility>

#include <folly/lang/RValueReferenceWrapper.h>
#include <folly/portability/GTest.h>

TEST(RvalueReferenceWrapper, MoveAndConvert) {
  using folly::rvalue_reference_wrapper;

  // Destructive moves.
  int i1 = 0;
  rvalue_reference_wrapper<int> rref1(std::move(i1));
  ASSERT_TRUE(rref1.valid());
  rvalue_reference_wrapper<int> rref0(std::move(rref1));
  ASSERT_TRUE(rref0.valid());
  ASSERT_FALSE(rref1.valid());
  rref1 = std::move(rref0);
  ASSERT_FALSE(rref0.valid());
  ASSERT_TRUE(rref1.valid());
  const int& r1 = std::move(rref1);
  ASSERT_FALSE(rref1.valid());
  ASSERT_EQ(&r1, &i1);

  // Destructive unwrap to T&&.
  int i2 = 0;
  rvalue_reference_wrapper<int> rref2(std::move(i2));
  int&& r2 = std::move(rref2);
  ASSERT_EQ(&r2, &i2);

  // Destructive unwrap to const T&.
  const int i3 = 0;
  rvalue_reference_wrapper<const int> rref3(std::move(i3));
  const int& r3 = std::move(rref3);
  ASSERT_EQ(&r3, &i3);

  // Destructive unwrap to const T&&.
  const int i4 = 0;
  rvalue_reference_wrapper<const int> rref4(std::move(i4));
  const int&& r4 = std::move(rref4);
  ASSERT_EQ(&r4, &i4);

  /*
   * Things that intentionally do not compile. Copy construction, copy
   * assignment, unwrap of lvalue reference to wrapper, const violations.
   *
  int i5;
  const int i6 = 0;
  rvalue_reference_wrapper<int> rref5(i5);
  rvalue_reference_wrapper<const int> rref6(i6);
  rref1 = rref5;
  int& r5 = rref5;
  const int& r6 = rref6;
  int i7;
  const rvalue_reference_wrapper<int> rref7(std::move(i7));
  int& r7 = std::move(rref7);
  */
}

TEST(RvalueReferenceWrapper, Call) {
  int a = 4711, b, c;
  auto callMe = [&](int x, const int& y, int&& z) -> int {
    EXPECT_EQ(a, x);
    EXPECT_EQ(&b, &y);
    EXPECT_EQ(&c, &z);
    return a;
  };
  int result = folly::rref(std::move(callMe))(a, b, std::move(c));
  EXPECT_EQ(a, result);
}
