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

#include <folly/functional/Invoke.h>

#include <folly/portability/GTest.h>

class InvokeTest : public testing::Test {};

namespace {

struct from_any {
  template <typename T>
  /* implicit */ from_any(T&&) {}
};

struct Fn {
  char operator()(int, int) noexcept {
    return 'a';
  }
  int volatile&& operator()(int, char const*) {
    return std::move(x_);
  }
  float operator()(float, float) {
    return 3.14;
  }
  int volatile x_ = 17;
};

FOLLY_CREATE_MEMBER_INVOKE_TRAITS(test_invoke_traits, test);

struct Obj {
  char test(int, int) noexcept {
    return 'a';
  }
  int volatile&& test(int, char const*) {
    return std::move(x_);
  }
  float test(float, float) {
    return 3.14;
  }
  int volatile x_ = 17;
};

namespace x {
struct Obj {};
int go(Obj const&, int) noexcept {
  return 3;
}
} // namespace x

namespace y {
struct Obj {};
char go(Obj const&, char const*) {
  return 'a';
}
} // namespace y

namespace z {
struct Obj {};
} // namespace z
float go(z::Obj const&, int) {
  return 9;
}

namespace swappable {
struct Obj {
  int x_;
};
void swap(Obj&, Obj&) noexcept {} // no-op
} // namespace swappable

FOLLY_CREATE_FREE_INVOKE_TRAITS(go_invoke_traits, go);
FOLLY_CREATE_FREE_INVOKE_TRAITS(swap_invoke_traits, swap, std);
FOLLY_CREATE_FREE_INVOKE_TRAITS(unused_invoke_traits, definitely_unused_name_);

} // namespace

TEST_F(InvokeTest, invoke) {
  Fn fn;

  EXPECT_TRUE(noexcept(folly::invoke(fn, 1, 2)));
  EXPECT_FALSE(noexcept(folly::invoke(fn, 1, "2")));

  EXPECT_EQ('a', folly::invoke(fn, 1, 2));
  EXPECT_EQ(17, folly::invoke(fn, 1, "2"));

  using FnA = char (Fn::*)(int, int);
  using FnB = int volatile && (Fn::*)(int, char const*);
  EXPECT_EQ('a', folly::invoke(static_cast<FnA>(&Fn::operator()), fn, 1, 2));
  EXPECT_EQ(17, folly::invoke(static_cast<FnB>(&Fn::operator()), fn, 1, "2"));
}

TEST_F(InvokeTest, invoke_result) {
  EXPECT_TRUE(
      (std::is_same<char, folly::invoke_result_t<Fn, int, char>>::value));
  EXPECT_TRUE(
      (std::is_same<int volatile&&, folly::invoke_result_t<Fn, int, char*>>::
           value));
}

TEST_F(InvokeTest, is_invocable) {
  EXPECT_TRUE((folly::is_invocable<Fn, int, char>::value));
  EXPECT_TRUE((folly::is_invocable<Fn, int, char*>::value));
  EXPECT_FALSE((folly::is_invocable<Fn, int>::value));
}

TEST_F(InvokeTest, is_invocable_r) {
  EXPECT_TRUE((folly::is_invocable_r<int, Fn, int, char>::value));
  EXPECT_TRUE((folly::is_invocable_r<int, Fn, int, char*>::value));
  EXPECT_FALSE((folly::is_invocable_r<int, Fn, int>::value));
}

TEST_F(InvokeTest, is_nothrow_invocable) {
  EXPECT_TRUE((folly::is_nothrow_invocable<Fn, int, char>::value));
  EXPECT_FALSE((folly::is_nothrow_invocable<Fn, int, char*>::value));
  EXPECT_FALSE((folly::is_nothrow_invocable<Fn, int>::value));
}

TEST_F(InvokeTest, is_nothrow_invocable_r) {
  EXPECT_TRUE((folly::is_nothrow_invocable_r<int, Fn, int, char>::value));
  EXPECT_FALSE((folly::is_nothrow_invocable_r<int, Fn, int, char*>::value));
  EXPECT_FALSE((folly::is_nothrow_invocable_r<int, Fn, int>::value));
}

TEST_F(InvokeTest, free_invoke) {
  using traits = go_invoke_traits;

  x::Obj x_;
  y::Obj y_;

  EXPECT_TRUE(noexcept(traits::invoke(x_, 3)));
  EXPECT_FALSE(noexcept(traits::invoke(y_, "hello")));

  EXPECT_EQ(3, traits::invoke(x_, 3));
  EXPECT_EQ('a', traits::invoke(y_, "hello"));
}

TEST_F(InvokeTest, free_invoke_result) {
  using traits = go_invoke_traits;

  EXPECT_TRUE((std::is_same<int, traits::invoke_result_t<x::Obj, int>>::value));
  EXPECT_TRUE((
      std::is_same<char, traits::invoke_result_t<y::Obj, char const*>>::value));
}

TEST_F(InvokeTest, free_is_invocable) {
  using traits = go_invoke_traits;

  EXPECT_TRUE((traits::is_invocable<x::Obj, int>::value));
  EXPECT_TRUE((traits::is_invocable<y::Obj, char const*>::value));
  EXPECT_FALSE((traits::is_invocable<z::Obj, int>::value));
  EXPECT_FALSE((traits::is_invocable<float>::value));
}

TEST_F(InvokeTest, free_is_invocable_r) {
  using traits = go_invoke_traits;

  EXPECT_TRUE((traits::is_invocable_r<int, x::Obj, int>::value));
  EXPECT_TRUE((traits::is_invocable_r<char, y::Obj, char const*>::value));
  EXPECT_FALSE((traits::is_invocable_r<float, z::Obj, int>::value));
  EXPECT_FALSE((traits::is_invocable_r<from_any, float>::value));
}

TEST_F(InvokeTest, free_is_nothrow_invocable) {
  using traits = go_invoke_traits;

  EXPECT_TRUE((traits::is_nothrow_invocable<x::Obj, int>::value));
  EXPECT_FALSE((traits::is_nothrow_invocable<y::Obj, char const*>::value));
  EXPECT_FALSE((traits::is_nothrow_invocable<z::Obj, int>::value));
  EXPECT_FALSE((traits::is_nothrow_invocable<float>::value));
}

TEST_F(InvokeTest, free_is_nothrow_invocable_r) {
  using traits = go_invoke_traits;

  EXPECT_TRUE((traits::is_nothrow_invocable_r<int, x::Obj, int>::value));
  EXPECT_FALSE(
      (traits::is_nothrow_invocable_r<char, y::Obj, char const*>::value));
  EXPECT_FALSE((traits::is_nothrow_invocable_r<float, z::Obj, int>::value));
  EXPECT_FALSE((traits::is_nothrow_invocable_r<from_any, float>::value));
}

TEST_F(InvokeTest, free_invoke_swap) {
  using traits = swap_invoke_traits;

  int a = 3;
  int b = 4;

  traits::invoke(a, b);
  EXPECT_EQ(4, a);
  EXPECT_EQ(3, b);

  swappable::Obj x{3};
  swappable::Obj y{4};

  traits::invoke(x, y);
  EXPECT_EQ(3, x.x_);
  EXPECT_EQ(4, y.x_);

  std::swap(x, y);
  EXPECT_EQ(4, x.x_);
  EXPECT_EQ(3, y.x_);
}

TEST_F(InvokeTest, member_invoke) {
  using traits = test_invoke_traits;

  Obj fn;

  EXPECT_TRUE(noexcept(traits::invoke(fn, 1, 2)));
  EXPECT_FALSE(noexcept(traits::invoke(fn, 1, "2")));

  EXPECT_EQ('a', traits::invoke(fn, 1, 2));
  EXPECT_EQ(17, traits::invoke(fn, 1, "2"));
}

TEST_F(InvokeTest, member_invoke_result) {
  using traits = test_invoke_traits;

  EXPECT_TRUE(
      (std::is_same<char, traits::invoke_result_t<Obj, int, char>>::value));
  EXPECT_TRUE(
      (std::is_same<int volatile&&, traits::invoke_result_t<Obj, int, char*>>::
           value));
}

TEST_F(InvokeTest, member_is_invocable) {
  using traits = test_invoke_traits;

  EXPECT_TRUE((traits::is_invocable<Obj, int, char>::value));
  EXPECT_TRUE((traits::is_invocable<Obj, int, char*>::value));
  EXPECT_FALSE((traits::is_invocable<Obj, int>::value));
}

TEST_F(InvokeTest, member_is_invocable_r) {
  using traits = test_invoke_traits;

  EXPECT_TRUE((traits::is_invocable_r<int, Obj, int, char>::value));
  EXPECT_TRUE((traits::is_invocable_r<int, Obj, int, char*>::value));
  EXPECT_FALSE((traits::is_invocable_r<int, Obj, int>::value));
}

TEST_F(InvokeTest, member_is_nothrow_invocable) {
  using traits = test_invoke_traits;

  EXPECT_TRUE((traits::is_nothrow_invocable<Obj, int, char>::value));
  EXPECT_FALSE((traits::is_nothrow_invocable<Obj, int, char*>::value));
  EXPECT_FALSE((traits::is_nothrow_invocable<Obj, int>::value));
}

TEST_F(InvokeTest, member_is_nothrow_invocable_r) {
  using traits = test_invoke_traits;

  EXPECT_TRUE((traits::is_nothrow_invocable_r<int, Obj, int, char>::value));
  EXPECT_FALSE((traits::is_nothrow_invocable_r<int, Obj, int, char*>::value));
  EXPECT_FALSE((traits::is_nothrow_invocable_r<int, Obj, int>::value));
}
