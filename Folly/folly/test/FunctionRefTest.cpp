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

#include <list>

#include <folly/Function.h>
#include <folly/portability/GTest.h>

using folly::Function;
using folly::FunctionRef;

TEST(FunctionRef, Traits) {
  static_assert(std::is_literal_type<FunctionRef<int(int)>>::value, "");
// Some earlier versions of libstdc++ lack these traits. Frustrating that
// the value of __GLIBCXX__ doesn't increase with version, but rather reflects
// release date, so some larger values of __GLIBCXX__ lack the traits while
// some smaller values have them. Can't figure out how to reliably test for the
// presence or absence of the traits. :-(
#if !defined(__GLIBCXX__) || __GNUC__ >= 5
  static_assert(
      std::is_trivially_copy_constructible<FunctionRef<int(int)>>::value, "");
  static_assert(
      std::is_trivially_move_constructible<FunctionRef<int(int)>>::value, "");
  static_assert(
      std::is_trivially_constructible<
          FunctionRef<int(int)>,
          FunctionRef<int(int)>&>::value,
      "");
  static_assert(
      std::is_trivially_copy_assignable<FunctionRef<int(int)>>::value, "");
  static_assert(
      std::is_trivially_move_assignable<FunctionRef<int(int)>>::value, "");
  static_assert(
      std::is_trivially_assignable<
          FunctionRef<int(int)>,
          FunctionRef<int(int)>&>::value,
      "");
#endif
  static_assert(
      std::is_nothrow_copy_constructible<FunctionRef<int(int)>>::value, "");
  static_assert(
      std::is_nothrow_move_constructible<FunctionRef<int(int)>>::value, "");
  static_assert(
      std::is_nothrow_constructible<
          FunctionRef<int(int)>,
          FunctionRef<int(int)>&>::value,
      "");
  static_assert(
      std::is_nothrow_copy_assignable<FunctionRef<int(int)>>::value, "");
  static_assert(
      std::is_nothrow_move_assignable<FunctionRef<int(int)>>::value, "");
  static_assert(
      std::is_nothrow_assignable<
          FunctionRef<int(int)>,
          FunctionRef<int(int)>&>::value,
      "");
}

TEST(FunctionRef, Simple) {
  int x = 1000;
  auto lambda = [&x](int v) { return x += v; };

  FunctionRef<int(int)> fref = lambda;
  EXPECT_EQ(1005, fref(5));
  EXPECT_EQ(1011, fref(6));
  EXPECT_EQ(1018, fref(7));

  FunctionRef<int(int)> const cfref = lambda;
  EXPECT_EQ(1023, cfref(5));
  EXPECT_EQ(1029, cfref(6));
  EXPECT_EQ(1036, cfref(7));

  auto const& clambda = lambda;

  FunctionRef<int(int)> fcref = clambda;
  EXPECT_EQ(1041, fcref(5));
  EXPECT_EQ(1047, fcref(6));
  EXPECT_EQ(1054, fcref(7));

  FunctionRef<int(int)> const cfcref = clambda;
  EXPECT_EQ(1059, cfcref(5));
  EXPECT_EQ(1065, cfcref(6));
  EXPECT_EQ(1072, cfcref(7));
}

TEST(FunctionRef, FunctionPtr) {
  int (*funcptr)(int) = [](int v) { return v * v; };

  FunctionRef<int(int)> fref = funcptr;
  EXPECT_EQ(100, fref(10));
  EXPECT_EQ(121, fref(11));

  FunctionRef<int(int)> const cfref = funcptr;
  EXPECT_EQ(100, cfref(10));
  EXPECT_EQ(121, cfref(11));
}

TEST(FunctionRef, OverloadedFunctor) {
  struct OverloadedFunctor {
    // variant 1
    int operator()(int x) {
      return 100 + 1 * x;
    }

    // variant 2 (const-overload of v1)
    int operator()(int x) const {
      return 100 + 2 * x;
    }

    // variant 3
    int operator()(int x, int) {
      return 100 + 3 * x;
    }

    // variant 4 (const-overload of v3)
    int operator()(int x, int) const {
      return 100 + 4 * x;
    }

    // variant 5 (non-const, has no const-overload)
    int operator()(int x, char const*) {
      return 100 + 5 * x;
    }

    // variant 6 (const only)
    int operator()(int x, std::vector<int> const&) const {
      return 100 + 6 * x;
    }
  };
  OverloadedFunctor of;
  auto const& cof = of;

  FunctionRef<int(int)> variant1 = of;
  EXPECT_EQ(100 + 1 * 15, variant1(15));
  FunctionRef<int(int)> const cvariant1 = of;
  EXPECT_EQ(100 + 1 * 15, cvariant1(15));

  FunctionRef<int(int)> variant2 = cof;
  EXPECT_EQ(100 + 2 * 16, variant2(16));
  FunctionRef<int(int)> const cvariant2 = cof;
  EXPECT_EQ(100 + 2 * 16, cvariant2(16));

  FunctionRef<int(int, int)> variant3 = of;
  EXPECT_EQ(100 + 3 * 17, variant3(17, 0));
  FunctionRef<int(int, int)> const cvariant3 = of;
  EXPECT_EQ(100 + 3 * 17, cvariant3(17, 0));

  FunctionRef<int(int, int)> variant4 = cof;
  EXPECT_EQ(100 + 4 * 18, variant4(18, 0));
  FunctionRef<int(int, int)> const cvariant4 = cof;
  EXPECT_EQ(100 + 4 * 18, cvariant4(18, 0));

  FunctionRef<int(int, char const*)> variant5 = of;
  EXPECT_EQ(100 + 5 * 19, variant5(19, "foo"));
  FunctionRef<int(int, char const*)> const cvariant5 = of;
  EXPECT_EQ(100 + 5 * 19, cvariant5(19, "foo"));

  FunctionRef<int(int, std::vector<int> const&)> variant6 = of;
  EXPECT_EQ(100 + 6 * 20, variant6(20, {}));
  EXPECT_EQ(100 + 6 * 20, variant6(20, {1, 2, 3}));
  FunctionRef<int(int, std::vector<int> const&)> const cvariant6 = of;
  EXPECT_EQ(100 + 6 * 20, cvariant6(20, {}));
  EXPECT_EQ(100 + 6 * 20, cvariant6(20, {1, 2, 3}));

  FunctionRef<int(int, std::vector<int> const&)> variant6const = cof;
  EXPECT_EQ(100 + 6 * 21, variant6const(21, {}));
  FunctionRef<int(int, std::vector<int> const&)> const cvariant6const = cof;
  EXPECT_EQ(100 + 6 * 21, cvariant6const(21, {}));
}

TEST(FunctionRef, DefaultConstructAndAssign) {
  FunctionRef<int(int, int)> fref;

  EXPECT_FALSE(fref);
  EXPECT_THROW(fref(1, 2), std::bad_function_call);

  int (*func)(int, int) = [](int x, int y) { return 10 * x + y; };
  fref = func;

  EXPECT_TRUE(fref);
  EXPECT_EQ(42, fref(4, 2));
}

template <typename ValueType>
class ForEach {
 public:
  template <typename InputIterator>
  ForEach(InputIterator begin, InputIterator end)
      : func_([begin, end](FunctionRef<void(ValueType)> f) {
          for (auto it = begin; it != end; ++it) {
            f(*it);
          }
        }) {}

  void operator()(FunctionRef<void(ValueType)> f) const {
    func_(f);
  }

 private:
  Function<void(FunctionRef<void(ValueType)>) const> const func_;
};

TEST(FunctionRef, ForEach) {
  std::list<int> s{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

  int sum = 0;

  ForEach<int> fe{s.begin(), s.end()};

  fe([&](int x) { sum += x; });

  EXPECT_EQ(55, sum);
}
