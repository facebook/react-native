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

#include <folly/portability/Builtins.h>

#if _WIN32
#include <folly/portability/Windows.h>

namespace folly {
namespace portability {
namespace detail {
void call_flush_instruction_cache_self_pid(void* begin, size_t size) {
  FlushInstructionCache(GetCurrentProcess(), begin, size);
}
} // namespace detail
} // namespace portability
} // namespace folly
#endif
