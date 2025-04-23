/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if defined(__linux__) || (defined(__APPLE__) && defined(__MACH__)) || \
    defined(__ANDROID__)

#include "OSCompat.h"

#include <cassert>

#include <pthread.h>
#include <unistd.h>

#if defined(__MACH__)
#include <mach/mach.h>
#endif // defined(__MACH__)

#if defined(__linux__)
#include <sys/syscall.h>
#endif // defined(__linux__)

namespace facebook::react::oscompat {

uint64_t getCurrentProcessId() {
  return getpid();
}

#if defined(__APPLE__) && defined(__MACH__)

uint64_t getCurrentThreadId() {
  uint64_t tid = 0;
  auto ret = pthread_threadid_np(nullptr, &tid);
  assert(
      ret == 0 &&
      "Unexpected pthread_threadid_np failure while getting thread ID");
  (void)ret;
  return tid;
}

#elif defined(__ANDROID__)

uint64_t getCurrentThreadId() {
  return gettid();
}

#elif defined(__linux__)

uint64_t getCurrentThreadId() {
  return syscall(__NR_gettid);
}

#else
#error "getCurrentThreadID() is not supported on this platform"
#endif

} // namespace facebook::react::oscompat

#endif // defined(__linux__) || (defined(__APPLE__) && defined(__MACH__)) ||
       // defined(__ANDROID__)
