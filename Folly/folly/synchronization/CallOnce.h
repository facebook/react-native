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

#include <atomic>
#include <mutex>
#include <utility>

#include <folly/Likely.h>
#include <folly/Portability.h>
#include <folly/SharedMutex.h>
#include <folly/functional/Invoke.h>

namespace folly {

template <typename Mutex, template <typename> class Atom = std::atomic>
class basic_once_flag;

//  call_once
//
//  Drop-in replacement for std::call_once.
//
//  The libstdc++ implementation has two flaws:
//  * it lacks a fast path, and
//  * it deadlocks (in explicit violation of the standard) when invoked twice
//    with a given flag, and the callable passed to the first invocation throws.
//
//  This implementation corrects both flaws.
//
//  The tradeoff is a slightly larger once_flag struct at 8 bytes, vs 4 bytes
//  with libstdc++ on Linux/x64.
//
//  Does not work with std::once_flag.
//
//  mimic: std::call_once
template <
    typename Mutex,
    template <typename> class Atom,
    typename F,
    typename... Args>
FOLLY_ALWAYS_INLINE void
call_once(basic_once_flag<Mutex, Atom>& flag, F&& f, Args&&... args) {
  flag.call_once(std::forward<F>(f), std::forward<Args>(args)...);
}

//  basic_once_flag
//
//  The flag template to be used with call_once. Parameterizable by the mutex
//  type and atomic template. The mutex type is required to mimic std::mutex and
//  the atomic type is required to mimic std::atomic.
template <typename Mutex, template <typename> class Atom>
class basic_once_flag {
 public:
  constexpr basic_once_flag() noexcept = default;
  basic_once_flag(const basic_once_flag&) = delete;
  basic_once_flag& operator=(const basic_once_flag&) = delete;

 private:
  template <
      typename Mutex_,
      template <typename> class Atom_,
      typename F,
      typename... Args>
  friend void call_once(basic_once_flag<Mutex_, Atom_>&, F&&, Args&&...);

  template <typename F, typename... Args>
  FOLLY_ALWAYS_INLINE void call_once(F&& f, Args&&... args) {
    if (LIKELY(called_.load(std::memory_order_acquire))) {
      return;
    }
    call_once_slow(std::forward<F>(f), std::forward<Args>(args)...);
  }

  template <typename F, typename... Args>
  FOLLY_NOINLINE void call_once_slow(F&& f, Args&&... args) {
    std::lock_guard<Mutex> lock(mutex_);
    if (called_.load(std::memory_order_relaxed)) {
      return;
    }
    invoke(std::forward<F>(f), std::forward<Args>(args)...);
    called_.store(true, std::memory_order_release);
  }

  Atom<bool> called_{false};
  Mutex mutex_;
};

//  once_flag
//
//  The flag type to be used with call_once. An instance of basic_once_flag.
//
//  Does not work with sd::call_once.
//
//  mimic: std::once_flag
using once_flag = basic_once_flag<SharedMutex>;

} // namespace folly
