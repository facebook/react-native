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

#pragma once

#include <new>

#include <folly/CPortability.h>
#include <folly/Portability.h>

/***
 *  include or backport:
 *  * std::launder
 */

// Note: libc++ 6+ adds std::launder but does not define __cpp_lib_launder
#if __cpp_lib_launder >= 201606 || (_MSC_VER && _HAS_LAUNDER) || \
    (_LIBCPP_VERSION >= 6000 && __cplusplus >= 201703L)

namespace folly {

/* using override */ using std::launder;

} // namespace folly

#else

namespace folly {

/**
 * Approximate backport from C++17 of std::launder. It should be `constexpr`
 * but that can't be done without specific support from the compiler.
 */
template <typename T>
FOLLY_NODISCARD inline T* launder(T* in) noexcept {
#if FOLLY_HAS_BUILTIN(__builtin_launder) || __GNUC__ >= 7
  // The builtin has no unwanted side-effects.
  return __builtin_launder(in);
#elif __GNUC__
  // This inline assembler block declares that `in` is an input and an output,
  // so the compiler has to assume that it has been changed inside the block.
  __asm__("" : "+r"(in));
  return in;
#elif defined(_WIN32)
  // MSVC does not currently have optimizations around const members of structs.
  // _ReadWriteBarrier() will prevent compiler reordering memory accesses.
  _ReadWriteBarrier();
  return in;
#else
  static_assert(
      false, "folly::launder is not implemented for this environment");
#endif
}

/* The standard explicitly forbids laundering these */
void launder(void*) = delete;
void launder(void const*) = delete;
void launder(void volatile*) = delete;
void launder(void const volatile*) = delete;
template <typename T, typename... Args>
void launder(T (*)(Args...)) = delete;
} // namespace folly

#endif
