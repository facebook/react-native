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

#include <folly/portability/Sched.h>

#if _WIN32
#include <thread>

namespace folly {
namespace portability {
namespace sched {
int sched_yield() {
  std::this_thread::yield();
  return 0;
}

// There is only 1 scheduling policy on Windows
int sched_get_priority_min(int policy) {
  return -15;
}

int sched_get_priority_max(int policy) {
  return 15;
}
} // namespace sched
} // namespace portability
} // namespace folly
#endif
