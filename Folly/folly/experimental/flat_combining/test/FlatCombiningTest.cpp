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

#include <folly/experimental/flat_combining/test/FlatCombiningTestHelpers.h>

#include <folly/portability/GTest.h>
#include <glog/logging.h>

#include <mutex>

using namespace folly::test;

constexpr int LINES = 5;
constexpr int NUM_RECS = 20;
constexpr int WORK = 0;
constexpr int ITERS = 100;

static std::vector<int> nthr = {1, 10, 20};

struct Params {
  bool combining, simple, dedicated, tc, syncop;
};

class FlatCombiningTest : public ::testing::TestWithParam<Params> {};

TEST(FlatCombiningTest, lock_holder) {
  folly::FcSimpleExample<> ex(10);
  {
    std::unique_lock<std::mutex> l;
    ex.holdLock(l);
    CHECK(l.owns_lock());
  }
  {
    std::unique_lock<std::mutex> l;
    ex.holdLock(l, std::defer_lock);
    CHECK(l.try_lock());
  }
  CHECK(ex.tryExclusive());
  ex.releaseExclusive();
}

TEST_P(FlatCombiningTest, combining) {
  Params p = GetParam();
  for (auto n : nthr) {
    run_test(
        n,
        LINES,
        NUM_RECS,
        WORK,
        ITERS,
        p.combining,
        p.simple,
        p.dedicated,
        p.tc,
        p.syncop,
        true,
        true);
  }
}

TEST_P(FlatCombiningTest, more_threads_than_records) {
  int n = 20;
  int num_recs = 1;

  Params p = GetParam();
  run_test(
      n,
      LINES,
      num_recs,
      WORK,
      ITERS,
      p.combining,
      p.simple,
      p.dedicated,
      p.tc,
      p.syncop,
      true,
      true);
}

constexpr Params params[] = {
    {false, false, false, false, false}, // no combining
    // simple combining
    //  dedicated
    {true, true, true, false, true}, // no-tc sync
    {true, true, true, false, false}, // no-tc async
    {true, true, true, true, true}, // tc sync
    {true, true, true, true, false}, // tc async
    //   no dedicated
    {true, true, false, false, true}, // no-tc sync
    {true, true, false, false, false}, // no-tc async
    {true, true, false, true, true}, // tc sync
    {true, true, false, true, false}, // tc async
    // custom combining
    //  dedicated
    {true, false, true, false, true}, // no-tc sync
    {true, false, true, false, false}, // no-tc async
    {true, false, true, true, true}, // tc sync
    {true, false, true, true, false}, // tc async
    //   no dedicated
    {true, false, false, false, true}, // no-tc sync
    {true, false, false, false, false}, // no-tc async
    {true, false, false, true, true}, // tc sync
    {true, false, false, true, false}, // tc async
};

INSTANTIATE_TEST_CASE_P(Foo, FlatCombiningTest, ::testing::ValuesIn(params));
