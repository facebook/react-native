/*
 * Copyright 2014-present Facebook, Inc.
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

#include <glog/logging.h>

#include <iosfwd>
#include <memory>
#include <random>
#include <set>
#include <vector>

#include <folly/FBVector.h>
#include <folly/MapUtil.h>
#include <folly/Memory.h>
#include <folly/String.h>
#include <folly/dynamic.h>
#include <folly/experimental/TestUtil.h>
#include <folly/gen/Base.h>
#include <folly/portability/GTest.h>

using namespace folly::gen;
using namespace folly;
using std::make_tuple;
using std::ostream;
using std::pair;
using std::set;
using std::string;
using std::tuple;
using std::unique_ptr;
using std::vector;

#define EXPECT_SAME(A, B) \
  static_assert(std::is_same<A, B>::value, "Mismatched: " #A ", " #B)
EXPECT_SAME(int&&, typename ArgumentReference<int>::type);
EXPECT_SAME(int&, typename ArgumentReference<int&>::type);
EXPECT_SAME(const int&, typename ArgumentReference<const int&>::type);
EXPECT_SAME(const int&, typename ArgumentReference<const int>::type);

template <typename T>
ostream& operator<<(ostream& os, const set<T>& values) {
  return os << from(values);
}

template <typename T>
ostream& operator<<(ostream& os, const vector<T>& values) {
  os << "[";
  for (auto& value : values) {
    if (&value != &values.front()) {
      os << " ";
    }
    os << value;
  }
  return os << "]";
}

auto square = [](int x) { return x * x; };
auto add = [](int a, int b) { return a + b; };
auto multiply = [](int a, int b) { return a * b; };

auto product = foldl(1, multiply);

template <typename A, typename B>
ostream& operator<<(ostream& os, const pair<A, B>& pair) {
  return os << "(" << pair.first << ", " << pair.second << ")";
}

TEST(Gen, Count) {
  auto gen = seq(1, 10);
  EXPECT_EQ(10, gen | count);
  EXPECT_EQ(5, gen | take(5) | count);
}

TEST(Gen, Sum) {
  auto gen = seq(1, 10);
  EXPECT_EQ((1 + 10) * 10 / 2, gen | sum);
  EXPECT_EQ((1 + 5) * 5 / 2, gen | take(5) | sum);
}

TEST(Gen, Foreach) {
  auto gen = seq(1, 4);
  int accum = 0;
  gen | [&](int x) { accum += x; };
  EXPECT_EQ(10, accum);
  int accum2 = 0;
  gen | take(3) | [&](int x) { accum2 += x; };
  EXPECT_EQ(6, accum2);
}

TEST(Gen, Map) {
  auto expected = vector<int>{4, 9, 16};
  auto gen = from({2, 3, 4}) | map(square);
  EXPECT_EQ((vector<int>{4, 9, 16}), gen | as<vector>());
  EXPECT_EQ((vector<int>{4, 9}), gen | take(2) | as<vector>());
}

TEST(Gen, Member) {
  struct Counter {
    Counter(int start = 0) : c(start) {}

    int count() const {
      return c;
    }
    int incr() {
      return ++c;
    }

    int& ref() {
      return c;
    }
    const int& ref() const {
      return c;
    }

   private:
    int c;
  };
  auto counters = seq(1, 10) | eachAs<Counter>() | as<vector>();
  EXPECT_EQ(10 * (1 + 10) / 2, from(counters) | member(&Counter::count) | sum);
  EXPECT_EQ(
      10 * (1 + 10) / 2,
      from(counters) | indirect | member(&Counter::count) | sum);
  EXPECT_EQ(10 * (2 + 11) / 2, from(counters) | member(&Counter::incr) | sum);
  EXPECT_EQ(
      10 * (3 + 12) / 2,
      from(counters) | indirect | member(&Counter::incr) | sum);
  EXPECT_EQ(10 * (3 + 12) / 2, from(counters) | member(&Counter::count) | sum);

  // type-verifications
  auto m = empty<Counter&>();
  auto c = empty<const Counter&>();
  m | member(&Counter::incr) | assert_type<int&&>();
  m | member(&Counter::count) | assert_type<int&&>();
  m | member(&Counter::count) | assert_type<int&&>();
  m | member<Const>(&Counter::ref) | assert_type<const int&>();
  m | member<Mutable>(&Counter::ref) | assert_type<int&>();
  c | member<Const>(&Counter::ref) | assert_type<const int&>();
}

TEST(Gen, Field) {
  struct X {
    X() : a(2), b(3), c(4), d(b) {}

    const int a;
    int b;
    mutable int c;
    int& d; // can't access this with a field pointer.
  };

  std::vector<X> xs(1);
  EXPECT_EQ(2, from(xs) | field(&X::a) | sum);
  EXPECT_EQ(3, from(xs) | field(&X::b) | sum);
  EXPECT_EQ(4, from(xs) | field(&X::c) | sum);
  EXPECT_EQ(2, seq(&xs[0], &xs[0]) | field(&X::a) | sum);
  // type-verification
  empty<X&>() | field(&X::a) | assert_type<const int&>();
  empty<X*>() | field(&X::a) | assert_type<const int&>();
  empty<X&>() | field(&X::b) | assert_type<int&>();
  empty<X*>() | field(&X::b) | assert_type<int&>();
  empty<X&>() | field(&X::c) | assert_type<int&>();
  empty<X*>() | field(&X::c) | assert_type<int&>();

  empty<X&&>() | field(&X::a) | assert_type<const int&&>();
  empty<X&&>() | field(&X::b) | assert_type<int&&>();
  empty<X&&>() | field(&X::c) | assert_type<int&&>();
  // references don't imply ownership so they're not moved

  empty<const X&>() | field(&X::a) | assert_type<const int&>();
  empty<const X*>() | field(&X::a) | assert_type<const int&>();
  empty<const X&>() | field(&X::b) | assert_type<const int&>();
  empty<const X*>() | field(&X::b) | assert_type<const int&>();
  // 'mutable' has no effect on field pointers, by C++ spec
  empty<const X&>() | field(&X::c) | assert_type<const int&>();
  empty<const X*>() | field(&X::c) | assert_type<const int&>();

  // can't form pointer-to-reference field: empty<X&>() | field(&X::d)
}

TEST(Gen, Seq) {
  // cover the fenceposts of the loop unrolling
  for (int n = 1; n < 100; ++n) {
    EXPECT_EQ(n, seq(1, n) | count);
    EXPECT_EQ(n + 1, seq(1) | take(n + 1) | count);
  }
}

TEST(Gen, SeqWithStep) {
  EXPECT_EQ(75, seq(5, 25, 5) | sum);
}

TEST(Gen, SeqWithStepArray) {
  const std::array<int, 6> arr{{1, 2, 3, 4, 5, 6}};
  EXPECT_EQ(
      9, seq(&arr[0], &arr[5], 2) | map([](const int* i) { return *i; }) | sum);
}

TEST(Gen, Range) {
  // cover the fenceposts of the loop unrolling
  for (int n = 1; n < 100; ++n) {
    EXPECT_EQ(gen::range(0, n) | count, n);
  }
}

TEST(Gen, RangeWithStep) {
  EXPECT_EQ(50, range(5, 25, 5) | sum);
}

TEST(Gen, FromIterators) {
  vector<int> source{2, 3, 5, 7, 11};
  auto gen = from(folly::range(source.begin() + 1, source.end() - 1));
  EXPECT_EQ(3 * 5 * 7, gen | product);
}

TEST(Gen, FromMap) {
  // clang-format off
  auto source
      = seq(0, 10)
      | map([](int i) { return std::make_pair(i, i * i); })
      | as<std::map<int, int>>();
  auto gen
      = fromConst(source)
      | map([&](const std::pair<const int, int>& p) {
        return p.second - p.first;
      });
  // clang-format on
  EXPECT_EQ(330, gen | sum);
}

TEST(Gen, Filter) {
  const auto expected = vector<int>{1, 2, 4, 5, 7, 8};
  auto actual =
      seq(1, 9) | filter([](int x) { return x % 3; }) | as<vector<int>>();
  EXPECT_EQ(expected, actual);
}

TEST(Gen, FilterDefault) {
  {
    // Default filter should remove 0s
    const auto expected = vector<int>{1, 1, 2, 3};
    auto actual = from({0, 1, 1, 0, 2, 3, 0}) | filter() | as<vector>();
    EXPECT_EQ(expected, actual);
  }
  {
    // Default filter should remove nullptrs
    int a = 5;
    int b = 3;
    int c = 0;
    const auto expected = vector<int*>{&a, &b, &c};
    // clang-format off
    auto actual = from({(int*)nullptr, &a, &b, &c, (int*)nullptr})
      | filter()
      | as<vector>();
    // clang-format on
    EXPECT_EQ(expected, actual);
  }
  {
    // Default filter on Optionals should remove folly::null
    const auto expected =
        vector<Optional<int>>{Optional<int>(5), Optional<int>(0)};
    // clang-format off
    const auto actual = from(
        {Optional<int>(5), Optional<int>(), Optional<int>(0)})
      | filter()
      | as<vector>();
    // clang-format on
    EXPECT_EQ(expected, actual);
  }
}

TEST(Gen, FilterSink) {
  // clang-format off
  auto actual = seq(1, 2)
    | map([](int x) { return vector<int>{x}; })
    | filter([](vector<int> v) { return !v.empty(); })
    | as<vector>();
  // clang-format on
  EXPECT_FALSE(from(actual) | rconcat | isEmpty);
}

TEST(Gen, Contains) {
  {
    auto gen = seq(1, 9) | map(square);
    EXPECT_TRUE(gen | contains(49));
    EXPECT_FALSE(gen | contains(50));
  }
  {
    // infinite, to prove laziness
    auto gen = seq(1) | map(square) | eachTo<std::string>();

    // std::string gen, const char* needle
    EXPECT_TRUE(gen | take(9999) | contains("49"));
  }
}

TEST(Gen, Take) {
  {
    auto expected = vector<int>{1, 4, 9, 16};
    // clang-format off
    auto actual =
      seq(1, 1000)
      | mapped([](int x) { return x * x; })
      | take(4)
      | as<vector<int>>();
    // clang-format on
    EXPECT_EQ(expected, actual);
  }
  {
    auto expected = vector<int>{0, 1, 4, 5, 8};
    // clang-format off
    auto actual
      = ((seq(0) | take(2)) +
         (seq(4) | take(2)) +
         (seq(8) | take(2)))
      | take(5)
      | as<vector>();
    // clang-format on
    EXPECT_EQ(expected, actual);
  }
  {
    auto expected = vector<int>{0, 1, 4, 5, 8};
    // clang-format off
    auto actual
      = seq(0)
      | mapped([](int i) {
          return seq(i * 4) | take(2);
        })
      | concat
      | take(5)
      | as<vector>();
    // clang-format on
    EXPECT_EQ(expected, actual);
  }
  {
    int64_t limit = 5;
    take(limit - 5);
    EXPECT_THROW(take(limit - 6), std::invalid_argument);
  }
}

TEST(Gen, Stride) {
  EXPECT_THROW(stride(0), std::invalid_argument);
  {
    auto expected = vector<int>{1, 2, 3, 4};
    auto actual = seq(1, 4) | stride(1) | as<vector<int>>();
    EXPECT_EQ(expected, actual);
  }
  {
    auto expected = vector<int>{1, 3, 5, 7};
    auto actual = seq(1, 8) | stride(2) | as<vector<int>>();
    EXPECT_EQ(expected, actual);
  }
  {
    auto expected = vector<int>{1, 4, 7, 10};
    auto actual = seq(1, 12) | stride(3) | as<vector<int>>();
    EXPECT_EQ(expected, actual);
  }
  {
    auto expected = vector<int>{1, 3, 5, 7, 9, 1, 4, 7, 10};
    // clang-format off
    auto actual
      = ((seq(1, 10) | stride(2)) +
         (seq(1, 10) | stride(3)))
      | as<vector<int>>();
    // clang-format on
    EXPECT_EQ(expected, actual);
  }
  EXPECT_EQ(500, seq(1) | take(1000) | stride(2) | count);
  EXPECT_EQ(10, seq(1) | take(1000) | stride(2) | take(10) | count);
}

TEST(Gen, Sample) {
  std::mt19937 rnd(42);

  auto sampler = seq(1, 100) | sample(50, rnd);
  std::unordered_map<int, int> hits;
  const int kNumIters = 80;
  for (int i = 0; i < kNumIters; i++) {
    auto vec = sampler | as<vector<int>>();
    EXPECT_EQ(vec.size(), 50);
    auto uniq = fromConst(vec) | as<set<int>>();
    EXPECT_EQ(uniq.size(), vec.size()); // sampling without replacement
    for (auto v : vec) {
      ++hits[v];
    }
  }

  // In 80 separate samples of our range, we should have seen every value
  // at least once and no value all 80 times. (The odds of either of those
  // events is 1/2^80).
  EXPECT_EQ(hits.size(), 100);
  for (auto hit : hits) {
    EXPECT_GT(hit.second, 0);
    EXPECT_LT(hit.second, kNumIters);
  }

  auto small = seq(1, 5) | sample(10);
  EXPECT_EQ((small | sum), 15);
  EXPECT_EQ((small | take(3) | count), 3);
}

TEST(Gen, Skip) {
  auto gen =
      seq(1, 1000) | mapped([](int x) { return x * x; }) | skip(4) | take(4);
  EXPECT_EQ((vector<int>{25, 36, 49, 64}), gen | as<vector>());
}

TEST(Gen, Until) {
  {
    auto expected = vector<int>{1, 4, 9, 16};
    // clang-format off
    auto actual
      = seq(1, 1000)
      | mapped([](int x) { return x * x; })
      | until([](int x) { return x > 20; })
      | as<vector<int>>();
    // clang-format on
    EXPECT_EQ(expected, actual);
  }
  {
    auto expected = vector<int>{0, 1, 4, 5, 8};
    // clang-format off
    auto actual
      = ((seq(0) | until([](int i) { return i > 1; })) +
         (seq(4) | until([](int i) { return i > 5; })) +
         (seq(8) | until([](int i) { return i > 9; })))
      | until([](int i) { return i > 8; })
      | as<vector<int>>();
    // clang-format on
    EXPECT_EQ(expected, actual);
  }
  /*
  {
    auto expected = vector<int>{ 0, 1, 5, 6, 10 };
    // clang-format off
    auto actual
      = seq(0)
      | mapped([](int i) {
          return seq(i * 5) | until([=](int j) { return j > i * 5 + 1; });
        })
      | concat
      | until([](int i) { return i > 10; })
      | as<vector<int>>();
    // clang-format on
    EXPECT_EQ(expected, actual);
  }
    */
}

TEST(Gen, Visit) {
  auto increment = [](int& i) { ++i; };
  auto clone = map([](int i) { return i; });
  { // apply()
    auto expected = 10;
    auto actual = seq(0) | clone | visit(increment) | take(4) | sum;
    EXPECT_EQ(expected, actual);
  }
  { // foreach()
    auto expected = 10;
    auto actual = seq(0, 3) | clone | visit(increment) | sum;
    EXPECT_EQ(expected, actual);
  }
  { // tee-like
    std::vector<int> x2, x4;
    std::vector<int> expected2{0, 1, 4, 9};
    std::vector<int> expected4{0, 1, 16, 81};

    auto tee = [](std::vector<int>& container) {
      return visit([&](int value) { container.push_back(value); });
    };
    EXPECT_EQ(
        98, seq(0, 3) | map(square) | tee(x2) | map(square) | tee(x4) | sum);
    EXPECT_EQ(expected2, x2);
    EXPECT_EQ(expected4, x4);
  }
}

TEST(Gen, Composed) {
  // Operator, Operator
  // clang-format off
  auto valuesOf
    = filter([](Optional<int>& o) { return o.hasValue(); })
    | map([](Optional<int>& o) -> int& { return o.value(); });
  // clang-format on
  std::vector<Optional<int>> opts{none, 4, none, 6, none};
  EXPECT_EQ(4 * 4 + 6 * 6, from(opts) | valuesOf | map(square) | sum);
  // Operator, Sink
  auto sumOpt = valuesOf | sum;
  EXPECT_EQ(10, from(opts) | sumOpt);
}

TEST(Gen, Chain) {
  std::vector<int> nums{2, 3, 5, 7};
  std::map<int, int> mappings{{3, 9}, {5, 25}};
  auto gen = from(nums) + (from(mappings) | get<1>());
  EXPECT_EQ(51, gen | sum);
  EXPECT_EQ(5, gen | take(2) | sum);
  EXPECT_EQ(26, gen | take(5) | sum);
}

TEST(Gen, Concat) {
  std::vector<std::vector<int>> nums{{2, 3}, {5, 7}};
  auto gen = from(nums) | rconcat;
  EXPECT_EQ(17, gen | sum);
  EXPECT_EQ(10, gen | take(3) | sum);
}

TEST(Gen, ConcatGen) {
  auto gen = seq(1, 10) | map([](int i) { return seq(1, i); }) | concat;
  EXPECT_EQ(220, gen | sum);
  EXPECT_EQ(10, gen | take(6) | sum);
}

TEST(Gen, ConcatAlt) {
  std::vector<std::vector<int>> nums{{2, 3}, {5, 7}};
  // clang-format off
  auto actual
    = from(nums)
    | map([](std::vector<int>& v) { return from(v); })
    | concat
    | sum;
  // clang-format on
  auto expected = 17;
  EXPECT_EQ(expected, actual);
}

TEST(Gen, Order) {
  auto expected = vector<int>{0, 3, 5, 6, 7, 8, 9};
  auto actual = from({8, 6, 7, 5, 3, 0, 9}) | order | as<vector>();
  EXPECT_EQ(expected, actual);
}

TEST(Gen, OrderMoved) {
  auto expected = vector<int>{0, 9, 25, 36, 49, 64, 81};
  // clang-format off
  auto actual
    = from({8, 6, 7, 5, 3, 0, 9})
    | move
    | order
    | map(square)
    | as<vector>();
  // clang-format on
  EXPECT_EQ(expected, actual);
}

TEST(Gen, OrderTake) {
  auto expected = vector<int>{9, 8, 7};
  // clang-format off
  auto actual
    = from({8, 6, 7, 5, 3, 0, 9})
    | orderByDescending(square)
    | take(3)
    | as<vector>();
  // clang-format on
  EXPECT_EQ(expected, actual);
}

TEST(Gen, Distinct) {
  auto expected = vector<int>{3, 1, 2};
  auto actual = from({3, 1, 3, 2, 1, 2, 3}) | distinct | as<vector>();
  EXPECT_EQ(expected, actual);
}

TEST(Gen, DistinctBy) { //  0  1  4  9  6  5  6  9  4  1  0
  auto expected = vector<int>{0, 1, 2, 3, 4, 5};
  auto actual =
      seq(0, 100) | distinctBy([](int i) { return i * i % 10; }) | as<vector>();
  EXPECT_EQ(expected, actual);
}

TEST(Gen, DistinctMove) { //  0  1  4  9  6  5  6  9  4  1  0
  auto expected = vector<int>{0, 1, 2, 3, 4, 5};
  auto actual = seq(0, 100) |
      mapped([](int i) { return std::make_unique<int>(i); })
      // see comment below about selector parameters for Distinct
      | distinctBy([](const std::unique_ptr<int>& pi) {
                  return *pi * *pi % 10;
                }) |
      mapped([](std::unique_ptr<int> pi) { return *pi; }) | as<vector>();

  // NOTE(tjackson): the following line intentionally doesn't work:
  //  | distinctBy([](std::unique_ptr<int> pi) { return *pi * *pi % 10; })
  // This is because distinctBy because the selector intentionally requires a
  // const reference.  If it required a move-reference, the value might get
  // gutted by the selector before said value could be passed to downstream
  // operators.
  EXPECT_EQ(expected, actual);
}

TEST(Gen, DistinctInfinite) {
  // distinct should be able to handle an infinite sequence, provided that, of
  // of cource, is it eventually made finite before returning the result.
  auto expected = seq(0) | take(5) | as<vector>(); // 0 1 2 3 4

  auto actual = seq(0) // 0 1 2 3 4 5 6 7 ...
      | mapped([](int i) { return i / 2; }) // 0 0 1 1 2 2 3 3 ...
      | distinct // 0 1 2 3 4 5 6 7 ...
      | take(5) // 0 1 2 3 4
      | as<vector>();

  EXPECT_EQ(expected, actual);
}

TEST(Gen, DistinctByInfinite) {
  // Similarly to the DistinctInfinite test case, distinct by should be able to
  // handle infinite sequences. Note that depending on how many values we take()
  // at the end, the sequence may infinite loop. This is fine becasue we cannot
  // solve the halting problem.
  auto expected = vector<int>{1, 2};
  auto actual = seq(1) // 1 2 3 4 5 6 7 8 ...
      | distinctBy([](int i) { return i % 2; }) // 1 2 (but might by infinite)
      | take(2) // 1 2
      | as<vector>();
  // Note that if we had take(3), this would infinite loop

  EXPECT_EQ(expected, actual);
}

TEST(Gen, MinBy) {
  // clang-format off
  EXPECT_EQ(
      7,
      seq(1, 10)
        | minBy([](int i) -> double {
            double d = i - 6.8;
            return d * d;
          })
        | unwrap);
  // clang-format on
}

TEST(Gen, MaxBy) {
  auto gen = from({"three", "eleven", "four"});

  EXPECT_EQ("eleven", gen | maxBy(&strlen) | unwrap);
}

TEST(Gen, Min) {
  auto odds = seq(2, 10) | filter([](int i) { return i % 2; });

  EXPECT_EQ(3, odds | min);
}

TEST(Gen, Max) {
  auto odds = seq(2, 10) | filter([](int i) { return i % 2; });

  EXPECT_EQ(9, odds | max);
}

TEST(Gen, Append) {
  string expected = "facebook";
  string actual = "face";
  from(StringPiece("book")) | appendTo(actual);
  EXPECT_EQ(expected, actual);
}

TEST(Gen, FromRValue) {
  {
    // AFAICT The C++ Standard does not specify what happens to the rvalue
    // reference of a std::vector when it is used as the 'other' for an rvalue
    // constructor.  Use fbvector because we're sure its size will be zero in
    // this case.
    fbvector<int> v({1, 2, 3, 4});
    auto q1 = from(v);
    EXPECT_EQ(v.size(), 4); // ensure that the lvalue version was called!
    auto expected = 1 * 2 * 3 * 4;
    EXPECT_EQ(expected, q1 | product);

    auto q2 = from(std::move(v));
    EXPECT_EQ(v.size(), 0); // ensure that rvalue version was called
    EXPECT_EQ(expected, q2 | product);
  }
  {
    auto expected = 7;
    auto q = from([] { return vector<int>({3, 7, 5}); }());
    EXPECT_EQ(expected, q | max);
  }
  {
    for (auto size : {5, 1024, 16384, 1 << 20}) {
      auto q1 = from(vector<int>(size, 2));
      auto q2 = from(vector<int>(size, 3));
      // If the rvalue specialization is broken/gone, then the compiler will
      // (disgustingly!) just store a *reference* to the temporary object,
      // which is bad.  Try to catch this by allocating two temporary vectors
      // of the same size, so that they'll probably use the same underlying
      // buffer if q1's vector is destructed before q2's vector is constructed.
      EXPECT_EQ(size * 2 + size * 3, (q1 | sum) + (q2 | sum));
    }
  }
  {
    auto q = from(set<int>{1, 2, 3, 2, 1});
    EXPECT_EQ(q | sum, 6);
  }
}

TEST(Gen, OrderBy) {
  auto expected = vector<int>{5, 6, 4, 7, 3, 8, 2, 9, 1, 10};
  // clang-format off
  auto actual
    = seq(1, 10)
    | orderBy([](int x) { return (5.1 - x) * (5.1 - x); })
    | as<vector>();
  // clang-format on
  EXPECT_EQ(expected, actual);

  expected = seq(1, 10) | as<vector>();
  // clang-format off
  actual
    = from(expected)
    | map([] (int x) { return 11 - x; })
    | orderBy()
    | as<vector>();
  // clang-format on
  EXPECT_EQ(expected, actual);
}

TEST(Gen, Foldl) {
  int expected = 2 * 3 * 4 * 5;
  auto actual = seq(2, 5) | foldl(1, multiply);
  EXPECT_EQ(expected, actual);
}

TEST(Gen, Reduce) {
  int expected = 2 + 3 + 4 + 5;
  auto actual = seq(2, 5) | reduce(add);
  EXPECT_EQ(expected, actual | unwrap);
}

TEST(Gen, ReduceBad) {
  auto gen = seq(1) | take(0);
  auto actual = gen | reduce(add);
  EXPECT_FALSE(actual); // Empty sequences are okay, they just yeild 'none'
}

TEST(Gen, Moves) {
  std::vector<unique_ptr<int>> ptrs;
  ptrs.emplace_back(new int(1));
  EXPECT_NE(ptrs.front().get(), nullptr);
  auto ptrs2 = from(ptrs) | move | as<vector>();
  EXPECT_EQ(ptrs.front().get(), nullptr);
  EXPECT_EQ(**ptrs2.data(), 1);
}

TEST(Gen, First) {
  auto gen = seq(0) | filter([](int x) { return x > 3; });
  EXPECT_EQ(4, gen | first | unwrap);
}

TEST(Gen, FromCopy) {
  vector<int> v{3, 5};
  auto src = from(v);
  auto copy = fromCopy(v);
  EXPECT_EQ(8, src | sum);
  EXPECT_EQ(8, copy | sum);
  v[1] = 7;
  EXPECT_EQ(10, src | sum);
  EXPECT_EQ(8, copy | sum);
}

TEST(Gen, Get) {
  std::map<int, int> pairs{
      {1, 1},
      {2, 4},
      {3, 9},
      {4, 16},
  };
  auto pairSrc = from(pairs);
  auto keys = pairSrc | get<0>();
  auto values = pairSrc | get<1>();
  EXPECT_EQ(10, keys | sum);
  EXPECT_EQ(30, values | sum);
  EXPECT_EQ(30, keys | map(square) | sum);
  pairs[5] = 25;
  EXPECT_EQ(15, keys | sum);
  EXPECT_EQ(55, values | sum);

  vector<tuple<int, int, int>> tuples{
      make_tuple(1, 1, 1),
      make_tuple(2, 4, 8),
      make_tuple(3, 9, 27),
  };
  EXPECT_EQ(36, from(tuples) | get<2>() | sum);
}

TEST(Gen, notEmpty) {
  EXPECT_TRUE(seq(0, 1) | notEmpty);
  EXPECT_TRUE(just(1) | notEmpty);
  EXPECT_FALSE(gen::range(0, 0) | notEmpty);
  EXPECT_FALSE(from({1}) | take(0) | notEmpty);
}

TEST(Gen, isEmpty) {
  EXPECT_FALSE(seq(0, 1) | isEmpty);
  EXPECT_FALSE(just(1) | isEmpty);
  EXPECT_TRUE(gen::range(0, 0) | isEmpty);
  EXPECT_TRUE(from({1}) | take(0) | isEmpty);
}

TEST(Gen, Any) {
  EXPECT_TRUE(seq(0, 10) | any([](int i) { return i == 7; }));
  EXPECT_FALSE(seq(0, 10) | any([](int i) { return i == 11; }));
}

TEST(Gen, All) {
  EXPECT_TRUE(seq(0, 10) | all([](int i) { return i < 11; }));
  EXPECT_FALSE(seq(0, 10) | all([](int i) { return i < 5; }));
  EXPECT_FALSE(seq(0) | take(9999) | all([](int i) { return i < 10; }));

  // empty lists satisfies all
  EXPECT_TRUE(seq(0) | take(0) | all([](int i) { return i < 50; }));
  EXPECT_TRUE(seq(0) | take(0) | all([](int i) { return i > 50; }));
}

TEST(Gen, Yielders) {
  auto gen = GENERATOR(int) {
    for (int i = 1; i <= 5; ++i) {
      yield(i);
    }
    yield(7);
    for (int i = 3;; ++i) {
      yield(i * i);
    }
  };
  vector<int> expected{1, 2, 3, 4, 5, 7, 9, 16, 25};
  EXPECT_EQ(expected, gen | take(9) | as<vector>());
}

TEST(Gen, NestedYield) {
  auto nums = GENERATOR(int) {
    for (int i = 1;; ++i) {
      yield(i);
    }
  };
  auto gen = GENERATOR(int) {
    nums | take(10) | yield;
    seq(1, 5) | [&](int i) { yield(i); };
  };
  EXPECT_EQ(70, gen | sum);
}

TEST(Gen, MapYielders) {
  // clang-format off
  auto gen
    = seq(1, 5)
    | map([](int n) {
        return GENERATOR(int) {
          int i;
          for (i = 1; i < n; ++i) {
            yield(i);
          }
          for (; i >= 1; --i) {
            yield(i);
          }
        };
      })
    | concat;
  vector<int> expected {
                1,
             1, 2, 1,
          1, 2, 3, 2, 1,
       1, 2, 3, 4, 3, 2, 1,
    1, 2, 3, 4, 5, 4, 3, 2, 1,
  };
  // clang-format on
  EXPECT_EQ(expected, gen | as<vector>());
}

TEST(Gen, VirtualGen) {
  VirtualGen<int> v(seq(1, 10));
  EXPECT_EQ(55, v | sum);
  v = v | map(square);
  EXPECT_EQ(385, v | sum);
  v = v | take(5);
  EXPECT_EQ(55, v | sum);
  EXPECT_EQ(30, v | take(4) | sum);
}

TEST(Gen, CustomType) {
  struct Foo {
    int y;
  };
  auto gen = from({Foo{2}, Foo{3}}) | map([](const Foo& f) { return f.y; });
  EXPECT_EQ(5, gen | sum);
}

TEST(Gen, NoNeedlessCopies) {
  auto gen = seq(1, 5) | map([](int x) { return std::make_unique<int>(x); }) |
      map([](unique_ptr<int> p) { return p; }) |
      map([](unique_ptr<int>&& p) { return std::move(p); }) |
      map([](const unique_ptr<int>& p) { return *p; });
  EXPECT_EQ(15, gen | sum);
  EXPECT_EQ(6, gen | take(3) | sum);
}

namespace {

class TestIntSeq : public GenImpl<int, TestIntSeq> {
 public:
  TestIntSeq() {}

  template <class Body>
  bool apply(Body&& body) const {
    for (int i = 1; i < 6; ++i) {
      if (!body(i)) {
        return false;
      }
    }
    return true;
  }

  TestIntSeq(TestIntSeq&&) noexcept = default;
  TestIntSeq& operator=(TestIntSeq&&) noexcept = default;
  TestIntSeq(const TestIntSeq&) = delete;
  TestIntSeq& operator=(const TestIntSeq&) = delete;
};

} // namespace

TEST(Gen, NoGeneratorCopies) {
  EXPECT_EQ(15, TestIntSeq() | sum);
  auto x = TestIntSeq() | take(3);
  EXPECT_EQ(6, std::move(x) | sum);
}

TEST(Gen, FromArray) {
  int source[] = {2, 3, 5, 7};
  auto gen = from(source);
  EXPECT_EQ(2 * 3 * 5 * 7, gen | product);
}

TEST(Gen, FromStdArray) {
  std::array<int, 4> source{{2, 3, 5, 7}};
  auto gen = from(source);
  EXPECT_EQ(2 * 3 * 5 * 7, gen | product);
}

TEST(Gen, StringConcat) {
  auto gen = seq(1, 10) | eachTo<string>() | rconcat;
  EXPECT_EQ("12345678910", gen | as<string>());
}

struct CopyCounter {
  static int alive;
  int copies;
  int moves;

  CopyCounter() : copies(0), moves(0) {
    ++alive;
  }

  CopyCounter(CopyCounter&& source) noexcept {
    *this = std::move(source);
    ++alive;
  }

  CopyCounter(const CopyCounter& source) {
    *this = source;
    ++alive;
  }

  ~CopyCounter() {
    --alive;
  }

  CopyCounter& operator=(const CopyCounter& source) {
    this->copies = source.copies + 1;
    this->moves = source.moves;
    return *this;
  }

  CopyCounter& operator=(CopyCounter&& source) {
    this->copies = source.copies;
    this->moves = source.moves + 1;
    return *this;
  }
};

int CopyCounter::alive = 0;

TEST(Gen, CopyCount) {
  vector<CopyCounter> originals;
  originals.emplace_back();
  EXPECT_EQ(1, originals.size());
  EXPECT_EQ(0, originals.back().copies);

  vector<CopyCounter> copies = from(originals) | as<vector>();
  EXPECT_EQ(1, copies.back().copies);
  EXPECT_EQ(0, copies.back().moves);

  vector<CopyCounter> moves = from(originals) | move | as<vector>();
  EXPECT_EQ(0, moves.back().copies);
  EXPECT_EQ(1, moves.back().moves);
}

// test dynamics with various layers of nested arrays.
TEST(Gen, Dynamic) {
  dynamic array1 = dynamic::array(1, 2);
  EXPECT_EQ(dynamic(3), from(array1) | sum);
  dynamic array2 = folly::dynamic::array(
      folly::dynamic::array(1), folly::dynamic::array(1, 2));
  EXPECT_EQ(dynamic(4), from(array2) | rconcat | sum);
  dynamic array3 = folly::dynamic::array(
      folly::dynamic::array(folly::dynamic::array(1)),
      folly::dynamic::array(
          folly::dynamic::array(1), folly::dynamic::array(1, 2)));
  EXPECT_EQ(dynamic(5), from(array3) | rconcat | rconcat | sum);
}

TEST(Gen, DynamicObject) {
  const dynamic obj = dynamic::object(1, 2)(3, 4);
  EXPECT_EQ(dynamic(4), from(obj.keys()) | sum);
  EXPECT_EQ(dynamic(6), from(obj.values()) | sum);
  EXPECT_EQ(dynamic(4), from(obj.items()) | get<0>() | sum);
  EXPECT_EQ(dynamic(6), from(obj.items()) | get<1>() | sum);
}

TEST(Gen, Collect) {
  auto s = from({7, 6, 5, 4, 3}) | as<set<int>>();
  EXPECT_EQ(s.size(), 5);
}

TEST(Gen, Cycle) {
  {
    auto s = from({1, 2});
    EXPECT_EQ((vector<int>{1, 2, 1, 2, 1}), s | cycle | take(5) | as<vector>());
  }
  {
    auto s = from({1, 2});
    EXPECT_EQ((vector<int>{1, 2, 1, 2}), s | cycle(2) | as<vector>());
  }
  {
    auto s = from({1, 2, 3});
    EXPECT_EQ(
        (vector<int>{1, 2, 1, 2, 1}),
        s | take(2) | cycle | take(5) | as<vector>());
  }
  {
    auto s = empty<int>();
    EXPECT_EQ((vector<int>{}), s | cycle | take(4) | as<vector>());
  }
  {
    int c = 3;
    int* pcount = &c;
    auto countdown = GENERATOR(int) {
      ASSERT_GE(*pcount, 0)
          << "Cycle should have stopped when it didnt' get values!";
      for (int i = 1; i <= *pcount; ++i) {
        yield(i);
      }
      --*pcount;
    };
    auto s = countdown;
    EXPECT_EQ(
        (vector<int>{1, 2, 3, 1, 2, 1}), s | cycle | take(7) | as<vector>());
    // take necessary as cycle returns an infinite generator
  }
}

TEST(Gen, Dereference) {
  {
    const int x = 4, y = 2;
    auto s = from(std::initializer_list<const int*>({&x, nullptr, &y}));
    EXPECT_EQ(6, s | dereference | sum);
  }
  {
    vector<int> a{1, 2};
    vector<int> b{3, 4};
    vector<vector<int>*> pv{&a, nullptr, &b};
    from(pv) | dereference | [&](vector<int>& v) { v.push_back(5); };
    EXPECT_EQ(3, a.size());
    EXPECT_EQ(3, b.size());
    EXPECT_EQ(5, a.back());
    EXPECT_EQ(5, b.back());
  }
  {
    vector<std::map<int, int>> maps{
        {
            {2, 31},
            {3, 41},
        },
        {
            {3, 52},
            {4, 62},
        },
        {
            {4, 73},
            {5, 83},
        },
    };
    // clang-format off
    EXPECT_EQ(
        93,
        from(maps)
        | map([](std::map<int, int>& m) {
            return get_ptr(m, 3);
          })
        | dereference
        | sum);
    // clang-format on
  }
  {
    vector<unique_ptr<int>> ups;
    ups.emplace_back(new int(3));
    ups.emplace_back();
    ups.emplace_back(new int(7));
    EXPECT_EQ(10, from(ups) | dereference | sum);
    EXPECT_EQ(10, from(ups) | move | dereference | sum);
  }
}

namespace {
struct DereferenceWrapper {
  string data;
  string& operator*() & {
    return data;
  }
  string&& operator*() && {
    return std::move(data);
  }
  explicit operator bool() {
    return true;
  }
};
bool operator==(const DereferenceWrapper& a, const DereferenceWrapper& b) {
  return a.data == b.data;
}
void PrintTo(const DereferenceWrapper& a, std::ostream* o) {
  *o << "Wrapper{\"" << cEscape<string>(a.data) << "\"}";
}
} // namespace

TEST(Gen, DereferenceWithLValueRef) {
  auto original = vector<DereferenceWrapper>{{"foo"}, {"bar"}};
  auto copy = original;
  auto expected = vector<string>{"foo", "bar"};
  auto actual = from(original) | dereference | as<vector>();
  EXPECT_EQ(expected, actual);
  EXPECT_EQ(copy, original);
}

TEST(Gen, DereferenceWithRValueRef) {
  auto original = vector<DereferenceWrapper>{{"foo"}, {"bar"}};
  auto empty = vector<DereferenceWrapper>{{}, {}};
  auto expected = vector<string>{"foo", "bar"};
  auto actual = from(original) | move | dereference | as<vector>();
  EXPECT_EQ(expected, actual);
  EXPECT_EQ(empty, original);
}

TEST(Gen, Indirect) {
  vector<int> vs{1};
  EXPECT_EQ(&vs[0], from(vs) | indirect | first | unwrap);
}

TEST(Gen, Guard) {
  using std::runtime_error;
  // clang-format off
  EXPECT_THROW(
      from({"1", "a", "3"})
      | eachTo<int>()
      | sum,
      runtime_error);
  EXPECT_EQ(
      4,
      from({"1", "a", "3"})
      | guard<runtime_error>([](runtime_error&, const char*) {
          return true; // continue
        })
      | eachTo<int>()
      | sum);
  EXPECT_EQ(
      1,
      from({"1", "a", "3"})
      | guard<runtime_error>([](runtime_error&, const char*) {
          return false; // break
        })
      | eachTo<int>()
      | sum);
  EXPECT_THROW(
      from({"1", "a", "3"})
      | guard<runtime_error>([](runtime_error&, const char* v) {
          if (v[0] == 'a') {
            throw;
          }
          return true;
        })
      | eachTo<int>()
      | sum,
      runtime_error);
  // clang-format on
}

TEST(Gen, eachTryTo) {
  using std::runtime_error;
  // clang-format off
  EXPECT_EQ(
      4,
      from({"1", "a", "3"})
      | eachTryTo<int>()
      | dereference
      | sum);
  EXPECT_EQ(
      1,
      from({"1", "a", "3"})
      | eachTryTo<int>()
      | takeWhile()
      | dereference
      | sum);
  // clang-format on
}

TEST(Gen, Batch) {
  EXPECT_EQ((vector<vector<int>>{{1}}), seq(1, 1) | batch(5) | as<vector>());
  EXPECT_EQ(
      (vector<vector<int>>{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}, {10, 11}}),
      seq(1, 11) | batch(3) | as<vector>());
  EXPECT_THROW(seq(1, 1) | batch(0) | as<vector>(), std::invalid_argument);
}

TEST(Gen, BatchMove) {
  auto expected = vector<vector<int>>{{0, 1}, {2, 3}, {4}};
  auto actual = seq(0, 4) |
      mapped([](int i) { return std::make_unique<int>(i); }) | batch(2) |
      mapped([](std::vector<std::unique_ptr<int>>& pVector) {
                  std::vector<int> iVector;
                  for (const auto& p : pVector) {
                    iVector.push_back(*p);
                  };
                  return iVector;
                }) |
      as<vector>();
  EXPECT_EQ(expected, actual);
}

TEST(Gen, Window) {
  auto expected = seq(0, 10) | as<std::vector>();
  for (size_t windowSize = 1; windowSize <= 20; ++windowSize) {
    // no early stop
    auto actual = seq(0, 10) |
        mapped([](int i) { return std::make_unique<int>(i); }) | window(4) |
        dereference | as<std::vector>();
    EXPECT_EQ(expected, actual) << windowSize;
  }
  for (size_t windowSize = 1; windowSize <= 20; ++windowSize) {
    // pre-window take
    auto actual = seq(0) |
        mapped([](int i) { return std::make_unique<int>(i); }) | take(11) |
        window(4) | dereference | as<std::vector>();
    EXPECT_EQ(expected, actual) << windowSize;
  }
  for (size_t windowSize = 1; windowSize <= 20; ++windowSize) {
    // post-window take
    auto actual = seq(0) |
        mapped([](int i) { return std::make_unique<int>(i); }) | window(4) |
        take(11) | dereference | as<std::vector>();
    EXPECT_EQ(expected, actual) << windowSize;
  }
}

TEST(Gen, Just) {
  {
    int x = 3;
    auto j = just(x);
    EXPECT_EQ(&x, j | indirect | first | unwrap);
    x = 4;
    EXPECT_EQ(4, j | sum);
  }
  {
    int x = 3;
    const int& cx = x;
    auto j = just(cx);
    EXPECT_EQ(&x, j | indirect | first | unwrap);
    x = 5;
    EXPECT_EQ(5, j | sum);
  }
  {
    int x = 3;
    auto j = just(std::move(x));
    EXPECT_NE(&x, j | indirect | first | unwrap);
    x = 5;
    EXPECT_EQ(3, j | sum);
  }
}

TEST(Gen, GroupBy) {
  vector<string> strs{
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
  };

  auto gb = from(strs) | groupBy([](const string& str) { return str.size(); });

  EXPECT_EQ(10, gb | mapOp(count) | sum);
  EXPECT_EQ(3, gb | count);

  vector<string> mode{"zero", "four", "five", "nine"};
  // clang-format off
  EXPECT_EQ(
      mode,
      gb
      | maxBy([](const Group<size_t, string>& g) { return g.size(); })
      | unwrap
      | as<vector>());
  // clang-format on

  vector<string> largest{"three", "seven", "eight"};
  // clang-format off
  EXPECT_EQ(
      largest,
      gb
      | maxBy([](const Group<size_t, string>& g) { return g.key(); })
      | unwrap
      | as<vector>());
  // clang-format on
}

TEST(Gen, GroupByAdjacent) {
  vector<string> finite{"a", "b", "cc", "dd", "ee", "fff", "g", "hhh"};
  vector<vector<string>> finiteGroups{
      {"a", "b"}, {"cc", "dd", "ee"}, {"fff"}, {"g"}, {"hhh"}};
  EXPECT_EQ(
      finiteGroups,
      from(finite) |
          groupByAdjacent([](const string& str) { return str.size(); }) |
          mapOp(as<vector>()) | as<vector>());

  auto infinite = seq(0);
  vector<vector<int>> infiniteGroups{
      {0, 1, 2, 3, 4}, {5, 6, 7, 8, 9}, {10, 11, 12, 13, 14}};
  EXPECT_EQ(
      infiniteGroups,
      infinite | groupByAdjacent([](const int& i) { return (i % 10) < 5; }) |
          take(3) | mapOp(as<vector>()) | as<vector>());
}

TEST(Gen, Unwrap) {
  Optional<int> o(4);
  Optional<int> e;
  EXPECT_EQ(4, o | unwrap);
  EXPECT_THROW(e | unwrap, OptionalEmptyException);

  auto oup = folly::make_optional(std::make_unique<int>(5));
  // optional has a value, and that value is non-null
  EXPECT_TRUE(bool(oup | unwrap));
  EXPECT_EQ(5, *(oup | unwrap));
  EXPECT_TRUE(oup.hasValue()); // still has a pointer (null or not)
  EXPECT_TRUE(bool(oup.value())); // that value isn't null

  auto moved1 = std::move(oup) | unwrapOr(std::make_unique<int>(6));
  // oup still has a value, but now it's now nullptr since the pointer was moved
  // into moved1
  EXPECT_TRUE(oup.hasValue());
  EXPECT_FALSE(oup.value());
  EXPECT_TRUE(bool(moved1));
  EXPECT_EQ(5, *moved1);

  auto moved2 = std::move(oup) | unwrapOr(std::make_unique<int>(7));
  // oup's still-valid nullptr value wins here, the pointer to 7 doesn't apply
  EXPECT_FALSE(moved2);

  oup.clear();
  auto moved3 = std::move(oup) | unwrapOr(std::make_unique<int>(8));
  // oup is empty now, so the unwrapOr comes into play.
  EXPECT_TRUE(bool(moved3));
  EXPECT_EQ(8, *moved3);

  {
    // mixed types, with common type matching optional
    Optional<double> full(3.3);
    decltype(full) empty;
    auto fallback = unwrapOr(4);
    EXPECT_EQ(3.3, full | fallback);
    EXPECT_EQ(3.3, std::move(full) | fallback);
    EXPECT_EQ(3.3, full | std::move(fallback));
    EXPECT_EQ(3.3, std::move(full) | std::move(fallback));
    EXPECT_EQ(4.0, empty | fallback);
    EXPECT_EQ(4.0, std::move(empty) | fallback);
    EXPECT_EQ(4.0, empty | std::move(fallback));
    EXPECT_EQ(4.0, std::move(empty) | std::move(fallback));
  }

  {
    // mixed types, with common type matching fallback
    Optional<int> full(3);
    decltype(full) empty;
    auto fallback = unwrapOr(5.0); // type: double
    // if we chose 'int' as the common type, we'd see truncation here
    EXPECT_EQ(1.5, (full | fallback) / 2);
    EXPECT_EQ(1.5, (std::move(full) | fallback) / 2);
    EXPECT_EQ(1.5, (full | std::move(fallback)) / 2);
    EXPECT_EQ(1.5, (std::move(full) | std::move(fallback)) / 2);
    EXPECT_EQ(2.5, (empty | fallback) / 2);
    EXPECT_EQ(2.5, (std::move(empty) | fallback) / 2);
    EXPECT_EQ(2.5, (empty | std::move(fallback)) / 2);
    EXPECT_EQ(2.5, (std::move(empty) | std::move(fallback)) / 2);
  }

  {
    auto opt = folly::make_optional(std::make_shared<int>(8));
    auto fallback = unwrapOr(std::make_unique<int>(9));
    // fallback must be std::move'd to be used
    EXPECT_EQ(8, *(opt | std::move(fallback)));
    EXPECT_TRUE(bool(opt.value())); // shared_ptr copied out, not moved
    EXPECT_TRUE(bool(opt)); // value still present
    EXPECT_TRUE(bool(fallback.value())); // fallback value not needed

    EXPECT_EQ(8, *(std::move(opt) | std::move(fallback)));
    EXPECT_FALSE(opt.value()); // shared_ptr moved out
    EXPECT_TRUE(bool(opt)); // gutted value still present
    EXPECT_TRUE(bool(fallback.value())); // fallback value not needed

    opt.clear();

    EXPECT_FALSE(opt); // opt is empty now
    EXPECT_EQ(9, *(std::move(opt) | std::move(fallback)));
    EXPECT_FALSE(fallback.value()); // fallback moved out!
  }

  {
    // test with nullptr
    vector<int> v{1, 2};
    EXPECT_EQ(&v[1], from(v) | indirect | max | unwrap);
    v.clear();
    EXPECT_FALSE(from(v) | indirect | max | unwrapOr(nullptr));
  }

  {
    // mixed type determined by fallback
    Optional<std::nullptr_t> empty;
    int x = 3;
    EXPECT_EQ(&x, empty | unwrapOr(&x));
  }
}

int main(int argc, char* argv[]) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  return RUN_ALL_TESTS();
}
