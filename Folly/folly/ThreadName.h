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

#include <thread>
#include <type_traits>

#include <pthread.h>

#include <folly/Range.h>
#include <folly/Traits.h>

namespace folly {

// This looks a bit weird, but it's necessary to avoid
// having an undefined compiler function called.
#if defined(__GLIBC__) && !defined(__APPLE__) && !defined(__ANDROID__)
#if __GLIBC_PREREQ(2, 12)
// has pthread_setname_np(pthread_t, const char*) (2 params)
#define FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME 1
#endif
#endif
#if defined(__APPLE__) && defined(__MAC_OS_X_VERSION_MIN_REQUIRED)
#if __MAC_OS_X_VERSION_MIN_REQUIRED >= 1060
// has pthread_setname_np(const char*) (1 param)
#define FOLLY_HAS_PTHREAD_SETNAME_NP_NAME 1
#endif
#endif

template <typename T>
inline bool setThreadName(T /* id */, StringPiece /* name */) {
  static_assert(
      std::is_same<T, pthread_t>::value ||
          std::is_same<T, std::thread::id>::value ||
          std::is_same<T, std::thread::native_handle_type>::value,
      "type must be pthread_t, std::thread::id or "
      "std::thread::native_handle_type");
  return false;
}

#ifdef FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME
template <>
inline bool setThreadName(pthread_t id, StringPiece name) {
  return 0 == pthread_setname_np(id, name.fbstr().substr(0, 15).c_str());
}
#endif

#ifdef FOLLY_HAS_PTHREAD_SETNAME_NP_NAME
template <>
inline bool setThreadName(pthread_t id, StringPiece name) {
  // Since OS X 10.6 it is possible for a thread to set its own name,
  // but not that of some other thread.
  if (pthread_equal(pthread_self(), id)) {
    return 0 == pthread_setname_np(name.fbstr().c_str());
  }
  return false;
}
#endif

template <
    typename = folly::_t<std::enable_if<
        std::is_same<pthread_t, std::thread::native_handle_type>::value>>>
inline bool setThreadName(std::thread::id id, StringPiece name) {
  static_assert(
      sizeof(std::thread::native_handle_type) == sizeof(decltype(id)),
      "This assumes std::thread::id is a thin wrapper around "
      "std::thread::native_handle_type, but that doesn't appear to be true.");
  // In most implementations, std::thread::id is a thin wrapper around
  // std::thread::native_handle_type, which means we can do unsafe things to
  // extract it.
  pthread_t ptid = *reinterpret_cast<pthread_t*>(&id);
  return setThreadName(ptid, name);
}

inline bool setThreadName(StringPiece name) {
  return setThreadName(pthread_self(), name);
}

}
