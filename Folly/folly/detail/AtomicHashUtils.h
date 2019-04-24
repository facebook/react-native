/*
 * Copyright 2012-present Facebook, Inc.
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

#include <folly/portability/Asm.h>

// Some utilities used by AtomicHashArray and AtomicHashMap
//

namespace folly {
namespace detail {

template <typename Cond>
void atomic_hash_spin_wait(Cond condition) {
  constexpr size_t kPauseLimit = 10000;
  for (size_t i = 0; condition(); ++i) {
    if (i < kPauseLimit) {
      folly::asm_volatile_pause();
    } else {
      std::this_thread::yield();
    }
  }
}

} // namespace detail
} // namespace folly
