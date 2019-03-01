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

#pragma once

#include <glog/logging.h>

#include <folly/Portability.h>
#include <folly/experimental/Instructions.h>

namespace folly {

namespace detail {
extern const uint8_t kSelectInByte[2048];
} // namespace detail

/**
 * Returns the position of the k-th 1 in the 64-bit word x.
 * k is 0-based, so k=0 returns the position of the first 1.
 *
 * Uses the broadword selection algorithm by Vigna [1], improved by Gog
 * and Petri [2] and Vigna [3].
 *
 * [1] Sebastiano Vigna. Broadword Implementation of Rank/Select
 *     Queries. WEA, 2008
 *
 * [2] Simon Gog, Matthias Petri. Optimized succinct data structures
 *     for massive data. Softw. Pract. Exper., 2014
 *
 * [3] Sebastiano Vigna. MG4J 5.2.1. http://mg4j.di.unimi.it/
*/
template <class Instructions>
inline uint64_t select64(uint64_t x, uint64_t k) {
  DCHECK_LT(k, Instructions::popcount(x));

  constexpr uint64_t kOnesStep4  = 0x1111111111111111ULL;
  constexpr uint64_t kOnesStep8  = 0x0101010101010101ULL;
  constexpr uint64_t kMSBsStep8  = 0x80ULL * kOnesStep8;

  auto s = x;
  s = s - ((s & 0xA * kOnesStep4) >> 1);
  s = (s & 0x3 * kOnesStep4) + ((s >> 2) & 0x3 * kOnesStep4);
  s = (s + (s >> 4)) & 0xF * kOnesStep8;
  uint64_t byteSums = s * kOnesStep8;

  uint64_t kStep8 = k * kOnesStep8;
  uint64_t geqKStep8 = (((kStep8 | kMSBsStep8) - byteSums) & kMSBsStep8);
  uint64_t place = Instructions::popcount(geqKStep8) * 8;
  uint64_t byteRank = k - (((byteSums << 8) >> place) & uint64_t(0xFF));
  return place + detail::kSelectInByte[((x >> place) & 0xFF) | (byteRank << 8)];
}

template <>
FOLLY_ALWAYS_INLINE uint64_t
select64<compression::instructions::Haswell>(uint64_t x, uint64_t k) {
#if defined(__GNUC__) || defined(__clang__)
  // GCC and Clang won't inline the intrinsics.
  uint64_t result = uint64_t(1) << k;

  asm("pdep %1, %0, %0\n\t"
      "tzcnt %0, %0"
      : "+r"(result)
      : "r"(x));

  return result;
#else
  return _tzcnt_u64(_pdep_u64(1ULL << k, x));
#endif
}

} // namespace folly
