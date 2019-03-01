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

#include <folly/LifoSem.h>

/// Raw node storage is preallocated in a contiguous memory segment,
/// but we use an anonymous mmap so the physical memory used (RSS) will
/// only reflect the maximum number of waiters that actually existed
/// concurrently.  For blocked threads the max node count is limited by the
/// number of threads, so we can conservatively estimate that this will be
/// < 10k.  For LifoEventSem, however, we could potentially have many more.
///
/// On a 64-bit architecture each LifoSemRawNode takes 16 bytes.  We make
/// the pool 1 million entries.

LIFOSEM_DECLARE_POOL(std::atomic, 1000000)

namespace folly {

ShutdownSemError::ShutdownSemError(const std::string& msg)
  : std::runtime_error(msg)
{}

ShutdownSemError::~ShutdownSemError() noexcept {
}

}
