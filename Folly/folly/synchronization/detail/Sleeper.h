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

/*
 * @author Keith Adams <kma@fb.com>
 * @author Jordan DeLong <delong.j@fb.com>
 */

#include <cstdint>

#include <folly/portability/Asm.h>
#include <folly/portability/Time.h>

namespace folly {

//////////////////////////////////////////////////////////////////////

namespace detail {

/*
 * A helper object for the contended case. Starts off with eager
 * spinning, and falls back to sleeping for small quantums.
 */
class Sleeper {
  static const uint32_t kMaxActiveSpin = 4000;

  uint32_t spinCount;

 public:
  Sleeper() : spinCount(0) {}

  static void sleep() {
    /*
     * Always sleep 0.5ms, assuming this will make the kernel put
     * us down for whatever its minimum timer resolution is (in
     * linux this varies by kernel version from 1ms to 10ms).
     */
    struct timespec ts = {0, 500000};
    nanosleep(&ts, nullptr);
  }

  void wait() {
    if (spinCount < kMaxActiveSpin) {
      ++spinCount;
      asm_volatile_pause();
    } else {
      sleep();
    }
  }
};

} // namespace detail
} // namespace folly
