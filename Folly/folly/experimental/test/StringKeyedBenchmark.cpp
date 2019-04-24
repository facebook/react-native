/*
 * Copyright 2015-present Facebook, Inc.
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
#include <folly/Conv.h>
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
using folly::to;
using std::map;
using std::set;
using std::string;
using std::unordered_map;
using std::unordered_set;
using namespace std::string_literals;

static map<string, int> m;
static StringKeyedMap<int> skm;
static set<string> s;
static StringKeyedSet sks;
static unordered_map<string, int> um;
static StringKeyedUnorderedMap<int> skum;
static unordered_set<string> us;
static StringKeyedUnorderedSet skus;
static const std::string lookup = "1234567890abcdefghijklmnopqrstuvwxyz"s;
static const folly::StringPiece lookupPiece{
    "1234567890abcdefghijklmnopqrstuvwxyz"};

#if !defined(FOLLY_HAVE_COMPARE_EQUIVALENT) && _LIBCPP_VERSION >= 3400
#define FOLLY_HAVE_COMPARE_EQUIVALENT 1
#endif

#if !defined(FOLLY_HAVE_COMPARE_EQUIVALENT) && __GNUC__ >= 5
#define FOLLY_HAVE_COMPARE_EQUIVALENT 1
#endif

#if FOLLY_HAVE_COMPARE_EQUIVALENT
static map<string, int, std::less<void>> m_equiv;
static set<string, std::less<void>> s_equiv;
#endif

static void initBenchmarks() {
  for (int i = 0; i < 1000; ++i) {
    auto iStr = to<string>(i);
    m[iStr] = i;
    s.insert(iStr);
  }
  m.insert(make_pair(lookup, 0));
  s.insert(lookup);

  skm = decltype(skm){m.begin(), m.end()};
  um = decltype(um){m.begin(), m.end()};
  skum = decltype(skum){m.begin(), m.end()};

  sks = decltype(sks){s.begin(), s.end()};
  us = decltype(us){s.begin(), s.end()};
  skus = decltype(skus){s.begin(), s.end()};
#if FOLLY_HAVE_COMPARE_EQUIVALENT
  m_equiv = decltype(m_equiv){m.begin(), m.end()};
  s_equiv = decltype(s_equiv){s.begin(), s.end()};
#endif
}

BENCHMARK(std_map_benchmark_find_native) {
  folly::doNotOptimizeAway(m.find(lookup)->second);
}

BENCHMARK_RELATIVE(std_map_benchmark_find_cross) {
  folly::doNotOptimizeAway(m.find(lookupPiece.str())->second);
}

#if FOLLY_HAVE_COMPARE_EQUIVALENT
BENCHMARK_RELATIVE(std_map_benchmark_find_equiv) {
  folly::doNotOptimizeAway(m_equiv.find(lookupPiece)->second);
}
#endif

BENCHMARK_RELATIVE(sk_map_benchmark_find_native) {
  folly::doNotOptimizeAway(skm.find(lookupPiece)->second);
}

BENCHMARK_RELATIVE(sk_map_benchmark_find_cross) {
  folly::doNotOptimizeAway(skm.find(lookup)->second);
}

BENCHMARK(std_map_benchmark_erase_emplace_native) {
  m.erase(lookup);
  m.emplace(lookup, 123);
}

BENCHMARK_RELATIVE(std_map_benchmark_erase_emplace_cross) {
  m.erase(lookupPiece.str());
  m.emplace(lookupPiece.str(), 123);
}

BENCHMARK_RELATIVE(sk_map_benchmark_erase_emplace_native) {
  skm.erase(lookupPiece);
  skm.emplace(lookupPiece, 123);
}

BENCHMARK_RELATIVE(sk_map_benchmark_erase_emplace_cross) {
  skm.erase(lookup);
  skm.emplace(lookup, 123);
}

BENCHMARK(std_unordered_map_benchmark_find_native) {
  folly::doNotOptimizeAway(um.find(lookup)->second);
}

BENCHMARK_RELATIVE(std_unordered_map_benchmark_find_cross) {
  folly::doNotOptimizeAway(um.find(lookupPiece.str())->second);
}

BENCHMARK_RELATIVE(sk_unordered_map_benchmark_find_native) {
  folly::doNotOptimizeAway(skum.find(lookupPiece)->second);
}

BENCHMARK_RELATIVE(sk_unordered_map_benchmark_find_cross) {
  folly::doNotOptimizeAway(skum.find(lookup)->second);
}

BENCHMARK(std_unordered_map_benchmark_erase_emplace_native) {
  um.erase(lookup);
  um.emplace(lookup, 123);
}

BENCHMARK_RELATIVE(std_unordered_map_benchmark_erase_emplace_cross) {
  um.erase(lookupPiece.str());
  um.emplace(lookupPiece.str(), 123);
}

BENCHMARK_RELATIVE(sk_unordered_map_benchmark_erase_emplace_native) {
  skum.erase(lookupPiece);
  skum.emplace(lookupPiece, 123);
}

BENCHMARK_RELATIVE(sk_unordered_map_benchmark_erase_emplace_cross) {
  skum.erase(lookup);
  skum.emplace(lookup, 123);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(std_set_benchmark_find_native) {
  folly::doNotOptimizeAway(s.find(lookup));
}

BENCHMARK_RELATIVE(std_set_benchmark_find_cross) {
  folly::doNotOptimizeAway(s.find(lookupPiece.str()));
}

#if FOLLY_HAVE_COMPARE_EQUIVALENT
BENCHMARK_RELATIVE(std_set_benchmark_find_equiv) {
  folly::doNotOptimizeAway(s_equiv.find(lookupPiece));
}
#endif

BENCHMARK_RELATIVE(sk_set_benchmark_find_native) {
  folly::doNotOptimizeAway(sks.find(lookupPiece));
}

BENCHMARK_RELATIVE(sk_set_benchmark_find_cross) {
  folly::doNotOptimizeAway(sks.find(lookup));
}

BENCHMARK(std_set_benchmark_erase_emplace_native) {
  s.erase(lookup);
  s.emplace(lookup);
}

BENCHMARK_RELATIVE(std_set_benchmark_erase_emplace_cross) {
  s.erase(lookupPiece.str());
  s.emplace(lookupPiece.str());
}

BENCHMARK_RELATIVE(sk_set_benchmark_erase_emplace_native) {
  sks.erase(lookupPiece);
  sks.emplace(lookupPiece);
}

BENCHMARK_RELATIVE(sk_set_benchmark_erase_emplace_cross) {
  sks.erase(lookup);
  sks.emplace(lookup);
}

BENCHMARK(std_unordered_set_benchmark_find_native) {
  folly::doNotOptimizeAway(us.find(lookup));
}

BENCHMARK(std_unordered_set_benchmark_find_cross) {
  folly::doNotOptimizeAway(us.find(lookupPiece.str()));
}

BENCHMARK_RELATIVE(sk_unordered_set_benchmark_find_native) {
  folly::doNotOptimizeAway(skus.find(lookupPiece));
}

BENCHMARK_RELATIVE(sk_unordered_set_benchmark_find_cross) {
  folly::doNotOptimizeAway(skus.find(lookup));
}

BENCHMARK(std_unordered_set_benchmark_erase_emplace_native) {
  us.erase(lookup);
  us.emplace(lookup);
}

BENCHMARK_RELATIVE(std_unordered_set_benchmark_erase_emplace_cross) {
  us.erase(lookupPiece.str());
  us.emplace(lookupPiece.str());
}

BENCHMARK_RELATIVE(sk_unordered_set_benchmark_erase_emplace_native) {
  skus.erase(lookupPiece);
  skus.emplace(lookupPiece);
}

BENCHMARK_RELATIVE(sk_unordered_set_benchmark_erase_emplace_cross) {
  skus.erase(lookup);
  skus.emplace(lookup);
}

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  initBenchmarks();
  folly::runBenchmarks();
}
