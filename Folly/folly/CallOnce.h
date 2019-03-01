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

/*
 * Drop-in replacement for std::call_once() with a fast path, which the GCC
 * implementation lacks.  The tradeoff is a slightly larger `once_flag' struct
 * (8 bytes vs 4 bytes with GCC on Linux/x64).
 *
 * $ call_once_test --benchmark --bm_min_iters=100000000 --threads=16
 * ============================================================================
 * folly/test/CallOnceTest.cpp                     relative  time/iter  iters/s
 * ============================================================================
 * StdCallOnceBench                                             3.54ns  282.82M
 * FollyCallOnceBench                                         698.48ps    1.43G
 * ============================================================================
 */

#pragma once

#include <atomic>
#include <mutex>
#include <utility>

#include <folly/Likely.h>
#include <folly/Portability.h>

namespace folly {

class once_flag {
 public:
  constexpr once_flag() noexcept = default;
  once_flag(const once_flag&) = delete;
  once_flag& operator=(const once_flag&) = delete;

  template <typename Callable, class... Args>
  friend void call_once(once_flag& flag, Callable&& f, Args&&... args);
  template <typename Callable, class... Args>
  friend void call_once_impl_no_inline(once_flag& flag,
                                       Callable&& f,
                                       Args&&... args);

 private:
  std::atomic<bool> called_{false};
  std::once_flag std_once_flag_;
};

template <class Callable, class... Args>
void FOLLY_ALWAYS_INLINE
call_once(once_flag& flag, Callable&& f, Args&&... args) {
  if (LIKELY(flag.called_.load(std::memory_order_acquire))) {
    return;
  }
  call_once_impl_no_inline(
      flag, std::forward<Callable>(f), std::forward<Args>(args)...);
}

// Implementation detail: out-of-line slow path
template <class Callable, class... Args>
void FOLLY_NOINLINE
call_once_impl_no_inline(once_flag& flag, Callable&& f, Args&&... args) {
  std::call_once(flag.std_once_flag_,
                 std::forward<Callable>(f),
                 std::forward<Args>(args)...);
  flag.called_.store(true, std::memory_order_release);
}
}
