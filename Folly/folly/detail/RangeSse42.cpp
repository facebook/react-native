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

#include <folly/detail/RangeSse42.h>

#include <glog/logging.h>

#include <folly/Portability.h>

//  Essentially, two versions of this file: one with an SSE42 implementation
//  and one with a fallback implementation. We determine which version to use by
//  testing for the presence of the required headers.
//
//  TODO: Maybe this should be done by the build system....
#if !FOLLY_SSE_PREREQ(4, 2)
namespace folly {
namespace detail {
size_t qfind_first_byte_of_sse42(
    const StringPieceLite haystack,
    const StringPieceLite needles) {
  return qfind_first_byte_of_nosse(haystack, needles);
}
} // namespace detail
} // namespace folly
#else
#include <cstdint>
#include <limits>
#include <string>

#include <emmintrin.h>
#include <nmmintrin.h>
#include <smmintrin.h>

#include <folly/Likely.h>
#include <folly/detail/Sse.h>

namespace folly {
namespace detail {

// It's okay if pages are bigger than this (as powers of two), but they should
// not be smaller.
static constexpr size_t kMinPageSize = 4096;
static_assert(
    kMinPageSize >= 16,
    "kMinPageSize must be at least SSE register size");

template <typename T>
static inline uintptr_t page_for(T* addr) {
  return reinterpret_cast<uintptr_t>(addr) / kMinPageSize;
}

static inline size_t nextAlignedIndex(const char* arr) {
  auto firstPossible = reinterpret_cast<uintptr_t>(arr) + 1;
  return 1 + // add 1 because the index starts at 'arr'
      ((firstPossible + 15) & ~0xF) // round up to next multiple of 16
      - firstPossible;
}

// helper method for case where needles.size() <= 16
size_t qfind_first_byte_of_needles16(
    const StringPieceLite haystack,
    const StringPieceLite needles) {
  DCHECK_GT(haystack.size(), 0u);
  DCHECK_GT(needles.size(), 0u);
  DCHECK_LE(needles.size(), 16u);
  if ((needles.size() <= 2 && haystack.size() >= 256) ||
      // must bail if we can't even SSE-load a single segment of haystack
      (haystack.size() < 16 &&
       page_for(haystack.end() - 1) != page_for(haystack.data() + 15)) ||
      // can't load needles into SSE register if it could cross page boundary
      page_for(needles.end() - 1) != page_for(needles.data() + 15)) {
    return detail::qfind_first_byte_of_nosse(haystack, needles);
  }

  auto arr2 = _mm_loadu_si128_unchecked(
      reinterpret_cast<const __m128i*>(needles.data()));
  // do an unaligned load for first block of haystack
  auto arr1 = _mm_loadu_si128_unchecked(
      reinterpret_cast<const __m128i*>(haystack.data()));
  auto index =
      _mm_cmpestri(arr2, int(needles.size()), arr1, int(haystack.size()), 0);
  if (index < 16) {
    return size_t(index);
  }

  // Now, we can do aligned loads hereafter...
  size_t i = nextAlignedIndex(haystack.data());
  for (; i < haystack.size(); i += 16) {
    arr1 = _mm_load_si128_unchecked(
        reinterpret_cast<const __m128i*>(haystack.data() + i));
    index = _mm_cmpestri(
        arr2, int(needles.size()), arr1, int(haystack.size() - i), 0);
    if (index < 16) {
      return i + index;
    }
  }
  return std::string::npos;
}

// Scans a 16-byte block of haystack (starting at blockStartIdx) to find first
// needle. If HAYSTACK_ALIGNED, then haystack must be 16byte aligned.
// If !HAYSTACK_ALIGNED, then caller must ensure that it is safe to load the
// block.
template <bool HAYSTACK_ALIGNED>
size_t scanHaystackBlock(
    const StringPieceLite haystack,
    const StringPieceLite needles,
    uint64_t blockStartIdx) {
  DCHECK_GT(needles.size(), 16u); // should handled by *needles16() method
  DCHECK(
      blockStartIdx + 16 <= haystack.size() ||
      (page_for(haystack.data() + blockStartIdx) ==
       page_for(haystack.data() + blockStartIdx + 15)));

  __m128i arr1;
  if (HAYSTACK_ALIGNED) {
    arr1 = _mm_load_si128_unchecked(
        reinterpret_cast<const __m128i*>(haystack.data() + blockStartIdx));
  } else {
    arr1 = _mm_loadu_si128_unchecked(
        reinterpret_cast<const __m128i*>(haystack.data() + blockStartIdx));
  }

  // This load is safe because needles.size() >= 16
  auto arr2 = _mm_loadu_si128(reinterpret_cast<const __m128i*>(needles.data()));
  auto b =
      _mm_cmpestri(arr2, 16, arr1, int(haystack.size() - blockStartIdx), 0);

  size_t j = nextAlignedIndex(needles.data());
  for (; j < needles.size(); j += 16) {
    arr2 = _mm_load_si128_unchecked(
        reinterpret_cast<const __m128i*>(needles.data() + j));

    auto index = _mm_cmpestri(
        arr2,
        int(needles.size() - j),
        arr1,
        int(haystack.size() - blockStartIdx),
        0);
    b = std::min(index, b);
  }

  if (b < 16) {
    return blockStartIdx + b;
  }
  return std::string::npos;
}

size_t qfind_first_byte_of_sse42(
    const StringPieceLite haystack,
    const StringPieceLite needles);

size_t qfind_first_byte_of_sse42(
    const StringPieceLite haystack,
    const StringPieceLite needles) {
  if (UNLIKELY(needles.empty() || haystack.empty())) {
    return std::string::npos;
  } else if (needles.size() <= 16) {
    // we can save some unnecessary load instructions by optimizing for
    // the common case of needles.size() <= 16
    return qfind_first_byte_of_needles16(haystack, needles);
  }

  if (haystack.size() < 16 &&
      page_for(haystack.end() - 1) != page_for(haystack.data() + 16)) {
    // We can't safely SSE-load haystack. Use a different approach.
    if (haystack.size() <= 2) {
      return qfind_first_byte_of_std(haystack, needles);
    }
    return qfind_first_byte_of_byteset(haystack, needles);
  }

  auto ret = scanHaystackBlock<false>(haystack, needles, 0);
  if (ret != std::string::npos) {
    return ret;
  }

  size_t i = nextAlignedIndex(haystack.data());
  for (; i < haystack.size(); i += 16) {
    ret = scanHaystackBlock<true>(haystack, needles, i);
    if (ret != std::string::npos) {
      return ret;
    }
  }

  return std::string::npos;
}
} // namespace detail
} // namespace folly
#endif
