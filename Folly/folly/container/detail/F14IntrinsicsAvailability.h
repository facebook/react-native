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

// F14 has been implemented for SSE2 and NEON (so far).
//
// This platform detection is a bit of a mess because it combines the
// detection of supported platforms (FOLLY_SSE >= 2 || FOLLY_NEON) with
// the selection of platforms on which we want to use it.
//
// Currently no 32-bit ARM versions are desired because we don't want to
// need a separate build for chips that don't have NEON.  AARCH64 support
// is enabled for non-mobile platforms, but on mobile platforms there
// are downstream iteration order effects that have not yet been resolved.
//
// If FOLLY_F14_VECTOR_INTRINSICS_AVAILABLE differs across compilation
// units the program will fail to link due to a missing definition of
// folly::container::detail::F14LinkCheck<X>::check() for some X.
#if (FOLLY_SSE >= 2 || (FOLLY_NEON && FOLLY_AARCH64)) && !FOLLY_MOBILE
#define FOLLY_F14_VECTOR_INTRINSICS_AVAILABLE 1
#else
#define FOLLY_F14_VECTOR_INTRINSICS_AVAILABLE 0
#endif

#if FOLLY_SSE_PREREQ(4, 2) || __ARM_FEATURE_CRC32
#define FOLLY_F14_CRC_INTRINSIC_AVAILABLE 1
#else
#define FOLLY_F14_CRC_INTRINSIC_AVAILABLE 0
#endif

namespace folly {
namespace f14 {
namespace detail {

enum class F14IntrinsicsMode { None, Simd, SimdAndCrc };

static constexpr F14IntrinsicsMode getF14IntrinsicsMode() {
#if !FOLLY_F14_VECTOR_INTRINSICS_AVAILABLE
  return F14IntrinsicsMode::None;
#elif !FOLLY_F14_CRC_INTRINSIC_AVAILABLE
  return F14IntrinsicsMode::Simd;
#else
  return F14IntrinsicsMode::SimdAndCrc;
#endif
}

} // namespace detail
} // namespace f14
} // namespace folly
