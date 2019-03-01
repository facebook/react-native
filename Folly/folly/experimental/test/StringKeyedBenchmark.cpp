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
// Copyright 2013-present Facebook. All Rights Reserved.

#include <folly/Benchmark.h>
#include <folly/Range.h>

#include <map>
#include <set>
#include <string>
#include <unordered_map>
#include <unordered_set>

#include <folly/experimental/StringKeyedMap.h>
#include <folly/experimental/StringKeyedSet.h>
#include <folly/experimental/StringKeyedUnorderedMap.h>
#include <folly/experimental/StringKeyedUnorderedSet.h>

using folly::StringKeyedMap;
using folly::StringKeyedSet;
using folly::StringKeyedUnorderedMap;
using folly::StringKeyedUnorderedSet;
using folly::StringPiece;
using std::map;
using std::to_string;
using std::set;
using std::string;
using std::unordered_map;
using std::unordered_set;

static map<string, int> m;
static StringKeyedMap<int> skm;
static set<string> s;
static StringKeyedSet sks;
static unordered_map<string, int> um;
static StringKeyedUnorderedMap<int> skum;
static unordered_set<string> us;
static StringKeyedUnorderedSet skus;
static const string lookup("123");
static const folly::StringPiece lookupPiece(lookup);

static void initBenchmarks() {
  for (int i = 0; i < 1000; ++i) {
    auto iStr = to_string(i);
    m[iStr] = i;
    skm.insert(make_pair(iStr, i));
    um[iStr] = i;
    skum.insert(make_pair(iStr, i));
    s.insert(iStr);
    sks.insert(iStr);
    us.insert(iStr);
    skus.insert(iStr);
  }
}

BENCHMARK(std_map_benchmark_find) {
  folly::doNotOptimizeAway(m.find(lookupPiece.str())->second);
}

BENCHMARK_RELATIVE(sk_map_benchmark_find) {
  folly::doNotOptimizeAway(skm.find(lookupPiece)->second);
}

BENCHMARK(std_map_benchmark_erase_emplace) {
  m.erase(lookup);
  m.emplace(lookup, 123);
}

BENCHMARK_RELATIVE(sk_map_benchmark_erase_emplace) {
  skm.erase(lookup);
  skm.emplace(lookup, 123);
}

BENCHMARK(std_unordered_map_benchmark_find) {
  folly::doNotOptimizeAway(um.find(lookupPiece.str())->second);
}

BENCHMARK_RELATIVE(sk_unordered_map_benchmark_find) {
  folly::doNotOptimizeAway(skum.find(lookupPiece)->second);
}

BENCHMARK(std_unordered_map_benchmark_erase_emplace) {
  um.erase(lookup);
  um.emplace(lookup, 123);
}

BENCHMARK_RELATIVE(sk_unordered_map_benchmark_erase_emplace) {
  skum.erase(lookup);
  skum.emplace(lookup, 123);
}

BENCHMARK(std_set_benchmark_find) {
  folly::doNotOptimizeAway(s.find(lookupPiece.str()));
}

BENCHMARK_RELATIVE(sk_set_benchmark_find) {
  folly::doNotOptimizeAway(sks.find(lookupPiece));
}

BENCHMARK(std_set_benchmark_erase_emplace) {
  s.erase(lookup);
  s.emplace(lookup);
}

BENCHMARK_RELATIVE(sk_set_benchmark_erase_emplace) {
  sks.erase(lookup);
  sks.emplace(lookup);
}

BENCHMARK(std_unordered_set_benchmark_find) {
  folly::doNotOptimizeAway(us.find(lookupPiece.str()));
}

BENCHMARK_RELATIVE(sk_unordered_set_benchmark_find) {
  folly::doNotOptimizeAway(skus.find(lookupPiece));
}

BENCHMARK(std_unordered_set_benchmark_erase_emplace) {
  us.erase(lookup);
  us.emplace(lookup);
}

BENCHMARK_RELATIVE(sk_unordered_set_benchmark_erase_emplace) {
  skus.erase(lookup);
  skus.emplace(lookup);
}

int main(int argc, char **argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  initBenchmarks();
  folly::runBenchmarks();
}
