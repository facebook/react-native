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

#include <folly/portability/SysMembarrier.h>

#include <mutex>

#include <folly/Portability.h>
#include <folly/portability/SysSyscall.h>
#include <folly/portability/Unistd.h>

#if FOLLY_X64 && !FOLLY_MOBILE && defined(__linux__)
#define FOLLY_USE_SYS_MEMBARRIER 1
#if !defined(__NR_membarrier)
#define __NR_membarrier 324
#endif
#if __has_include(<linux/membarrier.h>)
#include <linux/membarrier.h> // @manual
#else
#define MEMBARRIER_CMD_QUERY 0
#define MEMBARRIER_CMD_SHARED 1
#endif
#endif

namespace folly {
namespace detail {

bool sysMembarrierAvailable() {
  if (!kIsLinux) {
    return false;
  }

#if FOLLY_USE_SYS_MEMBARRIER
  auto r = syscall(__NR_membarrier, MEMBARRIER_CMD_QUERY, /* flags = */ 0);
  if (r == -1) {
    return false;
  }

  return r & MEMBARRIER_CMD_SHARED;
#else
  return false;
#endif
}

int sysMembarrier() {
#if FOLLY_USE_SYS_MEMBARRIER
  return syscall(__NR_membarrier, MEMBARRIER_CMD_SHARED, /* flags = */ 0);
#else
  return -1;
#endif
}
} // namespace detail
} // namespace folly
