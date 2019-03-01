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

namespace folly {
namespace detail {

// If we're targeting an architecture with popcnt support, use
// __builtin_popcount directly, as it's presumably inlined.
// If not, use runtime detection using __attribute__((__ifunc__))
// (see Bits.cpp)
#if defined(_MSC_VER) && (defined(_M_IX86) || defined(_M_X64))
inline int popcount(unsigned int x) {
  return int(__popcnt(x));
}
inline int popcountll(unsigned long long x) {
#if defined(_M_IX86)
  return (int) __popcnt((unsigned int) (x >> 32)) + (int) __popcnt((unsigned int) x);
#else
  return int(__popcnt64(x));
#endif
}
#elif defined(__POPCNT__)

inline int popcount(unsigned int x) {
  return __builtin_popcount(x);
}
inline int popcountll(unsigned long long x) {
  return __builtin_popcountll(x);
}

#else   /* !__POPCNT__ */

int popcount(unsigned int x);
int popcountll(unsigned long long x);

#endif  /* !__POPCNT__ */

}  // namespace detail
}  // namespace folly
