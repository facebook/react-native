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

// Some helper functions for mallctl.

#pragma once

#include <folly/Likely.h>
#include <folly/Malloc.h>

#include <stdexcept>

namespace folly {

namespace detail {

[[noreturn]] void handleMallctlError(const char* cmd, int err);

template <typename T>
void mallctlHelper(const char* cmd, T* out, T* in) {
  if (UNLIKELY(!usingJEMalloc())) {
    throw std::logic_error("Calling mallctl when not using jemalloc.");
  }

  size_t outLen = sizeof(T);
  int err = mallctl(cmd, out, out ? &outLen : nullptr, in, in ? sizeof(T) : 0);
  if (UNLIKELY(err != 0)) {
    handleMallctlError(cmd, err);
  }
}

} // detail

template <typename T>
void mallctlRead(const char* cmd, T* out) {
  detail::mallctlHelper(cmd, out, static_cast<T*>(nullptr));
}

template <typename T>
void mallctlWrite(const char* cmd, T in) {
  detail::mallctlHelper(cmd, static_cast<T*>(nullptr), &in);
}

template <typename T>
void mallctlReadWrite(const char* cmd, T* out, T in) {
  detail::mallctlHelper(cmd, out, &in);
}

inline void mallctlCall(const char* cmd) {
  // Use <unsigned> rather than <void> to avoid sizeof(void).
  mallctlRead<unsigned>(cmd, nullptr);
}

} // folly
