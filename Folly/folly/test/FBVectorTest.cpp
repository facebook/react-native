/*
 * Copyright 2011-present Facebook, Inc.
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

//
// Author: andrei.alexandrescu@fb.com

#include <folly/FBVector.h>

#include <list>
#include <map>
#include <memory>

#include <boost/random.hpp>

#include <folly/FBString.h>
#include <folly/Random.h>
#include <folly/Traits.h>
#include <folly/container/Foreach.h>
#include <folly/portability/GTest.h>
#include <folly/test/FBVectorTestUtil.h>

using namespace std;
using namespace folly;
using namespace folly::test::detail;

using IntFBVector = fbvector<int>;
using FBStringFBVector = fbvector<fbstring>;

#define VECTOR IntFBVector
#include <folly/test/FBVectorTests.cpp.h> // nolint
#undef VECTOR
#define VECTOR FBStringFBVector
#include <folly/test/FBVectorTests.cpp.h> // nolint
#undef VECTOR

TEST(fbvector, clause_23_3_6_1_3_ambiguity) {
  fbvector<int> v(10, 20);
  EXPECT_EQ(v.size(), 10);
  FOR_EACH (i, v) { EXPECT_EQ(*i, 20); }
}

TEST(fbvector, clause_23_3_6_1_11_ambiguity) {
  fbvector<int> v;
  v.assign(10, 20);
  EXPECT_EQ(v.size(), 10);
  FOR_EACH (i, v) { EXPECT_EQ(*i, 20); }
}

TEST(fbvector, clause_23_3_6_2_6) {
  fbvector<int> v;
  auto const n = random(0U, 10000U);
  v.reserve(n);
  auto const n1 = random(0U, 10000U);
  auto const obj = randomObject<int>();
  v.assign(n1, obj);
  v.shrink_to_fit();
  // Nothing to verify except that the call made it through
}

TEST(fbvector, clause_23_3_6_4_ambiguity) {
  fbvector<int> v;
  fbvector<int>::const_iterator it = v.end();
  v.insert(it, 10, 20);
  EXPECT_EQ(v.size(), 10);
  for (auto i : v) {
    EXPECT_EQ(i, 20);
  }
}

TEST(fbvector, composition) {
  fbvector<fbvector<double>> matrix(100, fbvector<double>(100));
}

TEST(fbvector, works_with_std_string) {
  fbvector<std::string> v(10, "hello");
  EXPECT_EQ(v.size(), 10);
  v.push_back("world");
}

namespace {
class UserDefinedType {
  int whatevs_;
};
} // namespace

FOLLY_ASSUME_FBVECTOR_COMPATIBLE(UserDefinedType)

TEST(fbvector, works_with_user_defined_type) {
  fbvector<UserDefinedType> v(10);
  EXPECT_EQ(v.size(), 10);
  v.push_back(UserDefinedType());
}

TEST(fbvector, move_construction) {
  fbvector<int> v1(100, 100);
  fbvector<int> v2;
  EXPECT_EQ(v1.size(), 100);
  EXPECT_EQ(v1.front(), 100);
  EXPECT_EQ(v2.size(), 0);
  v2 = std::move(v1);
  EXPECT_EQ(v1.size(), 0);
  EXPECT_EQ(v2.size(), 100);
  EXPECT_EQ(v2.front(), 100);

  v1.assign(100, 100);
  auto other = std::move(v1);
  EXPECT_EQ(v1.size(), 0);
  EXPECT_EQ(other.size(), 100);
  EXPECT_EQ(other.front(), 100);
}

TEST(fbvector, emplace) {
  fbvector<std::string> s(12, "asd");
  EXPECT_EQ(s.size(), 12);
  EXPECT_EQ(s.front(), "asd");
  s.emplace_back("funk");
  EXPECT_EQ(s.back(), "funk");
}

TEST(fbvector, initializer_lists) {
  fbvector<int> vec = {1, 2, 3};
  EXPECT_EQ(vec.size(), 3);
  EXPECT_EQ(vec[0], 1);
  EXPECT_EQ(vec[1], 2);
  EXPECT_EQ(vec[2], 3);

  vec = {0, 0, 12, 16};
  EXPECT_EQ(vec.size(), 4);
  EXPECT_EQ(vec[0], 0);
  EXPECT_EQ(vec[1], 0);
  EXPECT_EQ(vec[2], 12);
  EXPECT_EQ(vec[3], 16);

  vec.insert(vec.begin() + 1, {23, 23});
  EXPECT_EQ(vec.size(), 6);
  EXPECT_EQ(vec[0], 0);
  EXPECT_EQ(vec[1], 23);
  EXPECT_EQ(vec[2], 23);
  EXPECT_EQ(vec[3], 0);
  EXPECT_EQ(vec[4], 12);
  EXPECT_EQ(vec[5], 16);
}

TEST(fbvector, unique_ptr) {
  fbvector<std::unique_ptr<int>> v(12);
  std::unique_ptr<int> p(new int(12));
  v.push_back(std::move(p));
  EXPECT_EQ(*v.back(), 12);

  v[0] = std::move(p);
  EXPECT_FALSE(v[0].get());
  v[0] = std::make_unique<int>(32);
  std::unique_ptr<int> somePtr;
  v.insert(v.begin(), std::move(somePtr));
  EXPECT_EQ(*v[1], 32);
}

TEST(FBVector, task858056) {
  fbvector<fbstring> cycle;
  cycle.push_back("foo");
  cycle.push_back("bar");
  cycle.push_back("baz");
  fbstring message("Cycle detected: ");
  FOR_EACH_R (node_name, cycle) {
    message += "[";
    message += *node_name;
    message += "] ";
  }
  EXPECT_EQ("Cycle detected: [baz] [bar] [foo] ", message);
}

TEST(FBVector, move_iterator) {
  fbvector<int> base = {0, 1, 2};

  auto cp1 = base;
  fbvector<int> fbvi1(
      std::make_move_iterator(cp1.begin()), std::make_move_iterator(cp1.end()));
  EXPECT_EQ(fbvi1, base);

  auto cp2 = base;
  fbvector<int> fbvi2;
  fbvi2.assign(
      std::make_move_iterator(cp2.begin()), std::make_move_iterator(cp2.end()));
  EXPECT_EQ(fbvi2, base);

  auto cp3 = base;
  fbvector<int> fbvi3;
  fbvi3.insert(
      fbvi3.end(),
      std::make_move_iterator(cp3.begin()),
      std::make_move_iterator(cp3.end()));
  EXPECT_EQ(fbvi3, base);
}

TEST(FBVector, reserve_consistency) {
  struct S {
    int64_t a, b, c, d;
  };

  fbvector<S> fb1;
  for (size_t i = 0; i < 1000; ++i) {
    fb1.reserve(1);
    EXPECT_EQ(fb1.size(), 0);
    fb1.shrink_to_fit();
  }
}

TEST(FBVector, vector_of_maps) {
  fbvector<std::map<std::string, std::string>> v;

  v.push_back(std::map<std::string, std::string>());
  v.push_back(std::map<std::string, std::string>());

  EXPECT_EQ(2, v.size());

  v[1]["hello"] = "world";
  EXPECT_EQ(0, v[0].size());
  EXPECT_EQ(1, v[1].size());

  v[0]["foo"] = "bar";
  EXPECT_EQ(1, v[0].size());
  EXPECT_EQ(1, v[1].size());
}

TEST(FBVector, shrink_to_fit_after_clear) {
  fbvector<int> fb1;
  fb1.push_back(42);
  fb1.push_back(1337);
  fb1.clear();
  fb1.shrink_to_fit();
  EXPECT_EQ(fb1.size(), 0);
  EXPECT_EQ(fb1.capacity(), 0);
}

TEST(FBVector, zero_len) {
  fbvector<int> fb1(0);
  fbvector<int> fb2(0, 10);
  fbvector<int> fb3(std::move(fb1));
  fbvector<int> fb4;
  fb4 = std::move(fb2);
  fbvector<int> fb5 = fb3;
  fbvector<int> fb6;
  fb6 = fb4;
  std::initializer_list<int> il = {};
  fb6 = il;
  fbvector<int> fb7(fb6.begin(), fb6.end());
}
