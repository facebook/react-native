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

#include <type_traits>

#include <folly/Utility.h>
#include <folly/portability/GTest.h>

namespace {

class UtilityTest : public testing::Test {};
} // namespace

TEST_F(UtilityTest, copy) {
  struct MyData {};
  struct Worker {
    size_t rrefs = 0, crefs = 0;
    void something(MyData&&) {
      ++rrefs;
    }
    void something(const MyData&) {
      ++crefs;
    }
  };

  MyData data;
  Worker worker;
  worker.something(folly::copy(data));
  worker.something(std::move(data));
  worker.something(data);
  EXPECT_EQ(2, worker.rrefs);
  EXPECT_EQ(1, worker.crefs);
}

TEST_F(UtilityTest, copy_noexcept_spec) {
  struct MyNoexceptCopyable {};
  MyNoexceptCopyable noe;
  EXPECT_TRUE(noexcept(folly::copy(noe)));
  EXPECT_TRUE(noexcept(folly::copy(std::move(noe))));

  struct MyThrowingCopyable {
    MyThrowingCopyable() {}
    MyThrowingCopyable(const MyThrowingCopyable&) noexcept(false) {}
    MyThrowingCopyable(MyThrowingCopyable&&) = default;
  };
  MyThrowingCopyable thr;
  EXPECT_FALSE(noexcept(folly::copy(thr)));
  EXPECT_TRUE(noexcept(folly::copy(std::move(thr)))); // note: does not copy
}

TEST_F(UtilityTest, as_const) {
  struct S {
    bool member() {
      return false;
    }
    bool member() const {
      return true;
    }
  };
  S s;
  EXPECT_FALSE(s.member());
  EXPECT_TRUE(folly::as_const(s).member());
  EXPECT_EQ(&s, &folly::as_const(s));
  EXPECT_TRUE(noexcept(folly::as_const(s)));
}

template <typename T>
static T& as_mutable(T const& t) {
  return const_cast<T&>(t);
}

TEST_F(UtilityTest, forward_like) {
  int x = 0;
  // just show that it may be invoked, and that it is purely a cast
  // the real work is done by like_t, in terms of which forward_like is defined
  EXPECT_EQ(&x, std::addressof(folly::forward_like<char&>(x)));
  EXPECT_EQ(&x, std::addressof(as_mutable(folly::forward_like<char const>(x))));
}

TEST_F(UtilityTest, exchange) {
  auto obj = std::map<std::string, int>{{"hello", 3}};
  auto old = exchange(obj, {{"world", 4}});
  EXPECT_EQ((std::map<std::string, int>{{"world", 4}}), obj);
  EXPECT_EQ((std::map<std::string, int>{{"hello", 3}}), old);
}

TEST(FollyIntegerSequence, core) {
  constexpr auto seq = folly::integer_sequence<int, 0, 3, 2>();
  static_assert(seq.size() == 3, "");
  EXPECT_EQ(3, seq.size());

  auto seq2 = folly::index_sequence<0, 4, 3>();
  EXPECT_EQ(3, seq2.size());

  constexpr auto seq3 = folly::make_index_sequence<3>();
  static_assert(seq3.size() == 3, "");
  EXPECT_EQ(3, seq3.size());

  // check our own implementation even when the builtin is available
  using seq4 = typename folly::utility_detail::make_seq<5>::template apply<
      folly::integer_sequence<int>,
      folly::integer_sequence<int, 0>>;
  EXPECT_EQ(5, seq4{}.size());
  EXPECT_TRUE((std::is_same<seq4::value_type, int>::value));
  using seq4_expected = folly::integer_sequence<int, 0, 1, 2, 3, 4>;
  EXPECT_TRUE((std::is_same<seq4, seq4_expected>::value));
}

TEST_F(UtilityTest, MoveOnly) {
  class FooBar : folly::MoveOnly {
    int a;
  };

  static_assert(
      !std::is_copy_constructible<FooBar>::value,
      "Should not be copy constructible");

  // Test that move actually works.
  FooBar foobar;
  FooBar foobar2(std::move(foobar));
  (void)foobar2;

  // Test that inheriting from MoveOnly doesn't prevent the move
  // constructor from being noexcept.
  static_assert(
      std::is_nothrow_move_constructible<FooBar>::value,
      "Should have noexcept move constructor");
}

TEST_F(UtilityTest, to_signed) {
  {
    constexpr auto actual = folly::to_signed(int32_t(-12));
    EXPECT_TRUE(std::is_signed<decltype(actual)>::value);
    EXPECT_EQ(-12, actual);
  }
  {
    constexpr auto actual = folly::to_signed(uint32_t(-12));
    EXPECT_TRUE(std::is_signed<decltype(actual)>::value);
    EXPECT_EQ(-12, actual);
  }
}

TEST_F(UtilityTest, to_unsigned) {
  {
    constexpr auto actual = folly::to_unsigned(int32_t(-12));
    EXPECT_TRUE(!std::is_signed<decltype(actual)>::value);
    EXPECT_EQ(-12, actual);
  }
  {
    constexpr auto actual = folly::to_unsigned(uint32_t(-12));
    EXPECT_TRUE(!std::is_signed<decltype(actual)>::value);
    EXPECT_EQ(-12, actual);
  }
}
