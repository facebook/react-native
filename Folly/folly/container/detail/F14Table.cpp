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

#include <folly/container/detail/F14Table.h>

namespace folly {
namespace f14 {
namespace detail {

// If you get a link failure that leads you here, your build has varying
// compiler flags across compilation units in a way that would break F14.
// SIMD (SSE2 or NEON) needs to be either on everywhere or off everywhere
// that uses F14.  If SIMD is on then hardware CRC needs to be enabled
// everywhere or disabled everywhere.
void F14LinkCheck<getF14IntrinsicsMode()>::check() noexcept {}

#if FOLLY_F14_VECTOR_INTRINSICS_AVAILABLE
EmptyTagVectorType kEmptyTagVector = {};
#endif

FOLLY_F14_TLS_IF_ASAN std::size_t asanPendingSafeInserts = 0;
FOLLY_F14_TLS_IF_ASAN std::size_t asanRehashState = 0;

} // namespace detail
} // namespace f14
} // namespace folly
