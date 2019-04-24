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

#pragma once

#include <cstdlib>

#include <folly/Portability.h>

namespace folly {

namespace detail {

extern void assume_check(bool cond);

} // namespace detail

/**
 * Inform the compiler that the argument can be assumed true. It is
 * undefined behavior if the argument is not actually true, so use
 * with care.
 *
 * Implemented as a function instead of a macro because
 * __builtin_assume does not evaluate its argument at runtime, so it
 * cannot be used with expressions that have side-effects.
 */

FOLLY_ALWAYS_INLINE void assume(bool cond) {
  if (kIsDebug) {
    detail::assume_check(cond);
  } else {
#if defined(__clang__) // Must go first because Clang also defines __GNUC__.
    __builtin_assume(cond);
#elif defined(__GNUC__)
    if (!cond) {
      __builtin_unreachable();
    }
#elif defined(_MSC_VER)
    __assume(cond);
#else
    // Do nothing.
#endif
  }
}

[[noreturn]] FOLLY_ALWAYS_INLINE void assume_unreachable() {
  assume(false);
  // Do a bit more to get the compiler to understand
  // that this function really will never return.
#if defined(__GNUC__)
  __builtin_unreachable();
#elif defined(_MSC_VER)
  __assume(0);
#else
  // Well, it's better than nothing.
  std::abort();
#endif
}

} // namespace folly
