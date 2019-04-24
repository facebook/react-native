/*
 * Copyright 2016-present Facebook, Inc.
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

#include <exception>
#include <string>
#include <type_traits>

#include <folly/Demangle.h>
#include <folly/FBString.h>
#include <folly/Portability.h>

namespace folly {

/**
 * Debug string for an exception: include type and what(), if
 * defined.
 */
inline fbstring exceptionStr(const std::exception& e) {
#ifdef FOLLY_HAS_RTTI
  fbstring rv(demangle(typeid(e)));
  rv += ": ";
#else
  fbstring rv("Exception (no RTTI available): ");
#endif
  rv += e.what();
  return rv;
}

// Empirically, this indicates if the runtime supports
// std::exception_ptr, as not all (arm, for instance) do.
#if defined(__GNUC__) && defined(__GCC_ATOMIC_INT_LOCK_FREE) && \
    __GCC_ATOMIC_INT_LOCK_FREE > 1
inline fbstring exceptionStr(std::exception_ptr ep) {
  try {
    std::rethrow_exception(ep);
  } catch (const std::exception& e) {
    return exceptionStr(e);
  } catch (...) {
    return "<unknown exception>";
  }
}
#endif

template <typename E>
auto exceptionStr(const E& e) -> typename std::
    enable_if<!std::is_base_of<std::exception, E>::value, fbstring>::type {
#ifdef FOLLY_HAS_RTTI
  return demangle(typeid(e));
#else
  (void)e;
  return "Exception (no RTTI available) ";
#endif
}

} // namespace folly
