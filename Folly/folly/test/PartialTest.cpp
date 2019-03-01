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

#include <memory>

#include <folly/Function.h>
#include <folly/Partial.h>

#include <folly/portability/GTest.h>

using folly::partial;

int add3(int x, int y, int z) {
  return 100 * x + 10 * y + z;
}

TEST(Partial, Simple) {
  auto p0 = partial(&add3);
  EXPECT_EQ(123, p0(1, 2, 3));

  auto p1 = partial(&add3, 2);
  EXPECT_EQ(234, p1(3, 4));

  auto p2 = partial(&add3, 3, 4);
  EXPECT_EQ(345, p2(5));

  auto p3 = partial(&add3, 4, 5, 6);
  EXPECT_EQ(456, p3());
}

struct Foo {
  int method(int& x, int& y, int& z) {
    return 1000 + 100 * x + 10 * y + z;
  }
  int constMethod(int const& x, int const& y, int const& z) const {
    return 2000 + 100 * x + 10 * y + z;
  }
  int tempMethod(int&& x, int&& y, int&& z) {
    return 3000 + 100 * x + 10 * y + z;
  }
};

TEST(Partial, ReferenceArguments) {
  auto p0 = partial(&Foo::method, Foo{}, 2, 3);
  int four = 4;
  EXPECT_EQ(1234, p0(four));

  auto const p1 = partial(&Foo::constMethod, Foo{}, 3, 4);
  EXPECT_EQ(2345, p1(5));

  auto p2 = partial(&Foo::tempMethod, Foo{}, 4, 5);
  EXPECT_EQ(3456, std::move(p2)(6));
}

struct RefQualifiers {
  int operator()(int x, int y, int z) & {
    return 1000 + 100 * x + 10 * y + z;
  }
  int operator()(int x, int y, int z) const& {
    return 2000 + 100 * x + 10 * y + z;
  }
  int operator()(int x, int y, int z) && {
    return 3000 + 100 * x + 10 * y + z;
  }
};

TEST(Partial, RefQualifiers) {
  auto p = partial(RefQualifiers{});
  auto const& pconst = p;

  EXPECT_EQ(1234, p(2, 3, 4));
  EXPECT_EQ(2345, pconst(3, 4, 5));
  EXPECT_EQ(3456, std::move(p)(4, 5, 6));
}

struct RefQualifiers2 {
  int operator()(int& x, int const& y, int z) & {
    return 1000 + 100 * x + 10 * y + z;
  }
  int operator()(int const& x, int y, int z) const& {
    return 2000 + 100 * x + 10 * y + z;
  }
  int operator()(int&& x, int const& y, int z) && {
    return 3000 + 100 * x + 10 * y + z;
  }
};

TEST(Partial, RefQualifiers2) {
  auto p = partial(RefQualifiers2{}, 9, 8);
  auto const& pconst = p;

  EXPECT_EQ(1984, p(4));
  EXPECT_EQ(2985, pconst(5));
  EXPECT_EQ(3986, std::move(p)(6));
}

std::unique_ptr<int> calc_uptr(std::unique_ptr<int> x, std::unique_ptr<int> y) {
  *x = 100 * *x + 10 * *y;
  return x;
}

TEST(Partial, MoveOnly) {
  auto five = std::make_unique<int>(5);
  auto six = std::make_unique<int>(6);

  // create a partial object which holds a pointer to the `calc_uptr` function
  // and a `unique_ptr<int>` for the first argument
  auto p = partial(&calc_uptr, std::move(five));

  // `five` should be moved out of
  EXPECT_FALSE(five);

  // call to the partial object as rvalue, which allows the call to consume
  // captured data (here: the `unique_ptr<int>` storing 5), and pass it
  // the other `unique_ptr`
  auto result = std::move(p)(std::move(six));

  // ...which now should be moved out of
  EXPECT_FALSE(six);

  EXPECT_EQ(560, *result);
}

TEST(Partial, WrapInStdFunction) {
  auto p1 = partial(&add3, 2);
  std::function<int(int, int)> func = p1;
  EXPECT_EQ(234, func(3, 4));
}

TEST(Partial, WrapInFollyFunction) {
  auto p1 = partial(&add3, 2);
  folly::Function<int(int, int)> func = p1;
  EXPECT_EQ(234, func(3, 4));
}
