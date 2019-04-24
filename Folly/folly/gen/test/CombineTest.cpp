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
#include <string>
#include <tuple>
#include <vector>

#include <folly/FBVector.h>
#include <folly/Range.h>
#include <folly/gen/Base.h>
#include <folly/gen/Combine.h>
#include <folly/portability/GTest.h>

using namespace folly::gen;
using namespace folly;
using std::string;
using std::tuple;
using std::vector;

const folly::gen::detail::Map<folly::gen::detail::MergeTuples> gTupleFlatten{};

auto even = [](int i) -> bool { return i % 2 == 0; };
auto odd = [](int i) -> bool { return i % 2 == 1; };

TEST(CombineGen, Interleave) {
  { // large (infinite) base, small container
    auto base = seq(1) | filter(odd);
    auto toInterleave = seq(1, 6) | filter(even);
    auto interleaved = base | interleave(toInterleave | as<vector>());
    EXPECT_EQ(interleaved | as<vector>(), vector<int>({1, 2, 3, 4, 5, 6}));
  }
  { // small base, large container
    auto base = seq(1) | filter(odd) | take(3);
    auto toInterleave = seq(1) | filter(even) | take(50);
    auto interleaved = base | interleave(toInterleave | as<vector>());
    EXPECT_EQ(interleaved | as<vector>(), vector<int>({1, 2, 3, 4, 5, 6}));
  }
}

TEST(CombineGen, Zip) {
  auto base0 = seq(1);
  // We rely on std::move(fbvector) emptying the source vector
  auto zippee = fbvector<string>{"one", "two", "three"};
  {
    auto combined = base0 | zip(zippee) | as<vector>();
    ASSERT_EQ(combined.size(), 3);
    EXPECT_EQ(std::get<0>(combined[0]), 1);
    EXPECT_EQ(std::get<1>(combined[0]), "one");
    EXPECT_EQ(std::get<0>(combined[1]), 2);
    EXPECT_EQ(std::get<1>(combined[1]), "two");
    EXPECT_EQ(std::get<0>(combined[2]), 3);
    EXPECT_EQ(std::get<1>(combined[2]), "three");
    ASSERT_FALSE(zippee.empty());
    EXPECT_FALSE(zippee.front().empty()); // shouldn't have been move'd
  }

  { // same as top, but using std::move.
    auto combined = base0 | zip(std::move(zippee)) | as<vector>();
    ASSERT_EQ(combined.size(), 3);
    EXPECT_EQ(std::get<0>(combined[0]), 1);
    EXPECT_TRUE(zippee.empty());
  }

  { // same as top, but base is truncated
    auto baseFinite = seq(1) | take(1);
    auto combined =
        baseFinite | zip(vector<string>{"one", "two", "three"}) | as<vector>();
    ASSERT_EQ(combined.size(), 1);
    EXPECT_EQ(std::get<0>(combined[0]), 1);
    EXPECT_EQ(std::get<1>(combined[0]), "one");
  }
}

TEST(CombineGen, TupleFlatten) {
  vector<tuple<int, string>> intStringTupleVec{
      tuple<int, string>{1, "1"},
      tuple<int, string>{2, "2"},
      tuple<int, string>{3, "3"},
  };

  vector<tuple<char>> charTupleVec{
      tuple<char>{'A'},
      tuple<char>{'B'},
      tuple<char>{'C'},
      tuple<char>{'D'},
  };

  vector<double> doubleVec{
      1.0,
      4.0,
      9.0,
      16.0,
      25.0,
  };

  // clang-format off
  auto zipped1 = from(intStringTupleVec)
    | zip(charTupleVec)
    | assert_type<tuple<tuple<int, string>, tuple<char>>>()
    | as<vector>();
  // clang-format on
  EXPECT_EQ(std::get<0>(zipped1[0]), std::make_tuple(1, "1"));
  EXPECT_EQ(std::get<1>(zipped1[0]), std::make_tuple('A'));

  // clang-format off
  auto zipped2 = from(zipped1)
    | gTupleFlatten
    | assert_type<tuple<int, string, char>&&>()
    | as<vector>();
  // clang-format on
  ASSERT_EQ(zipped2.size(), 3);
  EXPECT_EQ(zipped2[0], std::make_tuple(1, "1", 'A'));

  // clang-format off
  auto zipped3 = from(charTupleVec)
    | zip(intStringTupleVec)
    | gTupleFlatten
    | assert_type<tuple<char, int, string>&&>()
    | as<vector>();
  // clang-format on
  ASSERT_EQ(zipped3.size(), 3);
  EXPECT_EQ(zipped3[0], std::make_tuple('A', 1, "1"));

  // clang-format off
  auto zipped4 = from(intStringTupleVec)
    | zip(doubleVec)
    | gTupleFlatten
    | assert_type<tuple<int, string, double>&&>()
    | as<vector>();
  // clang-format on
  ASSERT_EQ(zipped4.size(), 3);
  EXPECT_EQ(zipped4[0], std::make_tuple(1, "1", 1.0));

  // clang-format off
  auto zipped5 = from(doubleVec)
    | zip(doubleVec)
    | assert_type<tuple<double, double>>()
    | gTupleFlatten  // essentially a no-op
    | assert_type<tuple<double, double>&&>()
    | as<vector>();
  // clang-format on
  ASSERT_EQ(zipped5.size(), 5);
  EXPECT_EQ(zipped5[0], std::make_tuple(1.0, 1.0));

  // clang-format off
  auto zipped6 = from(intStringTupleVec)
    | zip(charTupleVec)
    | gTupleFlatten
    | zip(doubleVec)
    | gTupleFlatten
    | assert_type<tuple<int, string, char, double>&&>()
    | as<vector>();
  // clang-format on
  ASSERT_EQ(zipped6.size(), 3);
  EXPECT_EQ(zipped6[0], std::make_tuple(1, "1", 'A', 1.0));
}

int main(int argc, char* argv[]) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  return RUN_ALL_TESTS();
}
