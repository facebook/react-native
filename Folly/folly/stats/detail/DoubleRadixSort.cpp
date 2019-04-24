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

#include <folly/stats/detail/DoubleRadixSort.h>

#include <algorithm>
#include <cstring>

namespace folly {
namespace detail {

// Convert floats to something comparable via radix sort.
// See http://stereopsis.com/radix.html for details.
static uint8_t getRadixBucket(double* f, uint8_t shift) {
  uint64_t val;
  memcpy(&val, f, sizeof(double));
  uint64_t mask = -int64_t(val >> 63) | 0x8000000000000000;
  auto adjusted = val ^ mask;
  return (adjusted >> (64 - 8 - shift)) & 0xFF;
}

// MSB radix sort for doubles.
static void double_radix_sort_rec(
    uint64_t n,
    uint64_t* buckets,
    uint8_t shift,
    bool inout,
    double* in,
    double* out) {
  // First pass: calculate bucket counts.
  memset(buckets, 0, 256 * sizeof(uint64_t));
  for (uint64_t i = 0; i < n; i++) {
    buckets[getRadixBucket(&in[i], shift)]++;
  }

  // Second pass: calculate bucket start positions.
  uint64_t tot = 0;
  for (uint64_t i = 0; i < 256; i++) {
    auto prev = tot;
    tot += buckets[i];
    buckets[i + 256] = prev;
  }

  // Third pass: Move based on radix counts.
  for (uint64_t i = 0; i < n; i++) {
    auto pos = buckets[getRadixBucket(&in[i], shift) + 256]++;
    out[pos] = in[i];
  }

  // If we haven't used up all input bytes, recurse and sort.  if the
  // bucket is too small, use std::sort instead, and copy output to
  // correct array.
  if (shift < 56) {
    tot = 0;
    for (int i = 0; i < 256; i++) {
      if (buckets[i] < 256) {
        std::sort(out + tot, out + tot + buckets[i]);
        if (!inout) {
          memcpy(in + tot, out + tot, buckets[i] * sizeof(double));
        }
      } else {
        double_radix_sort_rec(
            buckets[i], buckets + 256, shift + 8, !inout, out + tot, in + tot);
      }
      tot += buckets[i];
    }
  }
}

void double_radix_sort(uint64_t n, uint64_t* buckets, double* in, double* tmp) {
  // If array is too small, use std::sort directly.
  if (n < 700) {
    std::sort(in, in + n);
  } else {
    detail::double_radix_sort_rec(n, buckets, 0, false, in, tmp);
  }
}

} // namespace detail
} // namespace folly
