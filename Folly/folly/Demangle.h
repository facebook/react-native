/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/FBString.h>

namespace folly {

/**
 * Return the demangled (prettyfied) version of a C++ type.
 *
 * This function tries to produce a human-readable type, but the type name will
 * be returned unchanged in case of error or if demangling isn't supported on
 * your system.
 *
 * Use for debugging -- do not rely on demangle() returning anything useful.
 *
 * This function may allocate memory (and therefore throw std::bad_alloc).
 */
fbstring demangle(const char* name);
inline fbstring demangle(const std::type_info& type) {
  return demangle(type.name());
}

/**
 * Return the demangled (prettyfied) version of a C++ type in a user-provided
 * buffer.
 *
 * The semantics are the same as for snprintf or strlcpy: bufSize is the size
 * of the buffer, the string is always null-terminated, and the return value is
 * the number of characters (not including the null terminator) that would have
 * been written if the buffer was big enough. (So a return value >= bufSize
 * indicates that the output was truncated)
 *
 * This function does not allocate memory and is async-signal-safe.
 *
 * Note that the underlying function for the fbstring-returning demangle is
 * somewhat standard (abi::__cxa_demangle, which uses malloc), the underlying
 * function for this version is less so (cplus_demangle_v3_callback from
 * libiberty), so it is possible for the fbstring version to work, while this
 * version returns the original, mangled name.
 */
size_t demangle(const char* name, char* buf, size_t bufSize);
inline size_t demangle(const std::type_info& type, char* buf, size_t bufSize) {
  return demangle(type.name(), buf, bufSize);
}

// glibc doesn't have strlcpy
size_t strlcpy(char* dest, const char* const src, size_t size);

} // namespace folly
