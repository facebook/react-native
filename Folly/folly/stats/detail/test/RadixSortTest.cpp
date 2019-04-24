/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/portability/GTest.h>

#include <folly/Random.h>
#include <folly/stats/detail/DoubleRadixSort.h>

using namespace folly;
using namespace folly::detail;

TEST(DoubleRadixSort, Basic) {
  std::unique_ptr<uint64_t[]> buckets(new uint64_t[256 * 9]);
  for (int i = 0; i < 100; i++) {
    size_t sz = folly::Random::rand32(0, 100000);
    std::unique_ptr<double[]> in(new double[sz]);
    std::unique_ptr<double[]> out(new double[sz]);
    for (size_t j = 0; j < sz; j++) {
      in[j] = folly::Random::randDouble(-100.0, 100.0);
    }
    double_radix_sort(sz, buckets.get(), in.get(), out.get());
    EXPECT_TRUE(std::is_sorted(in.get(), in.get() + sz));
  }
}
