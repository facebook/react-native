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

#pragma once

#include <folly/Portability.h>

#if FOLLY_SSE_PREREQ(2, 0)

#include <emmintrin.h>

#endif

namespace folly {
namespace detail {

#if FOLLY_SSE_PREREQ(2, 0)

FOLLY_DISABLE_ADDRESS_SANITIZER __m128i
_mm_loadu_si128_noasan(__m128i const* const p);
FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN __m128i
_mm_loadu_si128_unchecked(__m128i const* const p) {
  return kIsSanitizeAddress ? _mm_loadu_si128_noasan(p) : _mm_loadu_si128(p);
}

FOLLY_DISABLE_ADDRESS_SANITIZER __m128i
_mm_load_si128_noasan(__m128i const* const p);
FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN __m128i
_mm_load_si128_unchecked(__m128i const* const p) {
  return kIsSanitizeAddress ? _mm_load_si128_noasan(p) : _mm_load_si128(p);
}

#endif

} // namespace detail
} // namespace folly
