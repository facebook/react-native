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

#include <folly/Foreach.h>

#include <folly/portability/GTest.h>

#include <map>
#include <string>
#include <vector>
#include <list>

using namespace folly;
using namespace folly::detail;

TEST(Foreach, ForEachRvalue) {
  const char* const hello = "hello";
  int n = 0;
  FOR_EACH(it, std::string(hello)) {
    ++n;
  }
  EXPECT_EQ(strlen(hello), n);
  FOR_EACH_R(it, std::string(hello)) {
    --n;
    EXPECT_EQ(hello[n], *it);
  }
  EXPECT_EQ(0, n);
}

TEST(Foreach, ForEachNested) {
  const std::string hello = "hello";
  size_t n = 0;
  FOR_EACH(i, hello) {
    FOR_EACH(j, hello) {
      ++n;
    }
  }
  auto len = hello.size();
  EXPECT_EQ(len * len, n);
}

TEST(Foreach, ForEachKV) {
  std::map<std::string, int> testMap;
  testMap["abc"] = 1;
  testMap["def"] = 2;
  std::string keys = "";
  int values = 0;
  int numEntries = 0;
  FOR_EACH_KV (key, value, testMap) {
    keys += key;
    values += value;
    ++numEntries;
  }
  EXPECT_EQ("abcdef", keys);
  EXPECT_EQ(3, values);
  EXPECT_EQ(2, numEntries);
}

TEST(Foreach, ForEachKVBreak) {
  std::map<std::string, int> testMap;
  testMap["abc"] = 1;
  testMap["def"] = 2;
  std::string keys = "";
  int values = 0;
  int numEntries = 0;
  FOR_EACH_KV (key, value, testMap) {
    keys += key;
    values += value;
    ++numEntries;
    break;
  }
  EXPECT_EQ("abc", keys);
  EXPECT_EQ(1, values);
  EXPECT_EQ(1, numEntries);
}

TEST(Foreach, ForEachKvWithMultiMap) {
  std::multimap<std::string, int> testMap;
  testMap.insert(std::make_pair("abc", 1));
  testMap.insert(std::make_pair("abc", 2));
  testMap.insert(std::make_pair("def", 3));
  std::string keys = "";
  int values = 0;
  int numEntries = 0;
  FOR_EACH_KV (key, value, testMap) {
    keys += key;
    values += value;
    ++numEntries;
  }
  EXPECT_EQ("abcabcdef", keys);
  EXPECT_EQ(6, values);
  EXPECT_EQ(3, numEntries);
}

TEST(Foreach, ForEachEnumerate) {
  std::vector<int> vv;
  int sumAA = 0;
  int sumIter = 0;
  int numIterations = 0;
  FOR_EACH_ENUMERATE(aa, iter, vv) {
    sumAA += aa;
    sumIter += *iter;
    ++numIterations;
  }
  EXPECT_EQ(sumAA, 0);
  EXPECT_EQ(sumIter, 0);
  EXPECT_EQ(numIterations, 0);

  vv.push_back(1);
  vv.push_back(3);
  vv.push_back(5);
  FOR_EACH_ENUMERATE(aa, iter, vv) {
    sumAA += aa;
    sumIter += *iter;
    ++numIterations;
  }
  EXPECT_EQ(sumAA, 3);   // 0 + 1 + 2
  EXPECT_EQ(sumIter, 9); // 1 + 3 + 5
  EXPECT_EQ(numIterations, 3);
}

TEST(Foreach, ForEachEnumerateBreak) {
  std::vector<int> vv;
  int sumAA = 0;
  int sumIter = 0;
  int numIterations = 0;
  vv.push_back(1);
  vv.push_back(2);
  vv.push_back(4);
  vv.push_back(8);
  FOR_EACH_ENUMERATE(aa, iter, vv) {
    sumAA += aa;
    sumIter += *iter;
    ++numIterations;
    if (aa == 1) break;
  }
  EXPECT_EQ(sumAA, 1);   // 0 + 1
  EXPECT_EQ(sumIter, 3); // 1 + 2
  EXPECT_EQ(numIterations, 2);
}

TEST(Foreach, ForEachRangeR) {
  int sum = 0;

  FOR_EACH_RANGE_R (i, 0, 0) {
    sum += i;
  }
  EXPECT_EQ(0, sum);

  FOR_EACH_RANGE_R (i, 0, -1) {
    sum += i;
  }
  EXPECT_EQ(0, sum);

  FOR_EACH_RANGE_R (i, 0, 5) {
    sum += i;
  }
  EXPECT_EQ(10, sum);

  std::list<int> lst = { 0, 1, 2, 3, 4 };
  sum = 0;
  FOR_EACH_RANGE_R (i, lst.begin(), lst.end()) {
    sum += *i;
  }
  EXPECT_EQ(10, sum);
}
