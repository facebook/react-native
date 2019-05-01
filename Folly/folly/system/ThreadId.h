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

#include <cstdint>

#include <folly/portability/PThread.h>
#include <folly/portability/SysSyscall.h>
#include <folly/portability/Unistd.h>
#include <folly/portability/Windows.h>

namespace folly {

/**
 * Get a process-specific identifier for the current thread.
 *
 * The return value will uniquely identify the thread within the current
 * process.
 *
 * Note that the return value does not necessarily correspond to an operating
 * system thread ID.  The return value is also only unique within the current
 * process: getCurrentThreadID() may return the same value for two concurrently
 * running threads in separate processes.
 *
 * The thread ID may be reused once the thread it corresponds to has been
 * joined.
 */
inline uint64_t getCurrentThreadID() {
#if __APPLE__
  return uint64_t(pthread_mach_thread_np(pthread_self()));
#elif _WIN32
  return uint64_t(GetCurrentThreadId());
#else
  return uint64_t(pthread_self());
#endif
}

/**
 * Get the operating-system level thread ID for the current thread.
 *
 * The returned value will uniquely identify this thread on the system.
 *
 * This makes it more suitable for logging or displaying in user interfaces
 * than the result of getCurrentThreadID().
 *
 * There are some potential caveats about this API, however:
 *
 * - In theory there is no guarantee that application threads map one-to-one to
 *   kernel threads.  An application threading implementation could potentially
 *   share one OS thread across multiple application threads, and/or it could
 *   potentially move application threads between different OS threads over
 *   time.  However, in practice all of the platforms we currently support have
 *   a one-to-one mapping between userspace threads and operating system
 *   threads.
 *
 * - This API may also be slightly slower than getCurrentThreadID() on some
 *   platforms.  This API may require a system call, where getCurrentThreadID()
 *   may only need to read thread-local memory.
 *
 * On Linux the returned value is a pid_t, and can be used in contexts
 * requiring a thread pid_t.
 *
 * The thread ID may be reused once the thread it corresponds to has been
 * joined.
 */
inline uint64_t getOSThreadID() {
#if __APPLE__
  uint64_t tid;
  pthread_threadid_np(nullptr, &tid);
  return tid;
#elif _WIN32
  return uint64_t(GetCurrentThreadId());
#else
  return uint64_t(syscall(FOLLY_SYS_gettid));
#endif
}
} // namespace folly
