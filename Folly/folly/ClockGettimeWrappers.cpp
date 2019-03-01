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

#include <folly/ClockGettimeWrappers.h>
#include <folly/Likely.h>
#include <folly/portability/Time.h>

#include <chrono>

#include <time.h>

#ifndef _WIN32
#define _GNU_SOURCE 1
#include <dlfcn.h>
#endif

namespace folly {
namespace chrono {

static int64_t clock_gettime_ns_fallback(clockid_t clock) {
  struct timespec ts;
  int r = clock_gettime(clock, &ts);
  if (UNLIKELY(r != 0)) {
    // Mimic what __clock_gettime_ns does (even though this can be a legit
    // value).
    return -1;
  }
  std::chrono::nanoseconds result =
      std::chrono::seconds(ts.tv_sec) + std::chrono::nanoseconds(ts.tv_nsec);
  return result.count();
}

// Initialize with default behavior, which we might override on Linux hosts
// with VDSO support.
int (*clock_gettime)(clockid_t, timespec* ts) = &::clock_gettime;
int64_t (*clock_gettime_ns)(clockid_t) = &clock_gettime_ns_fallback;

#ifdef __linux__

namespace {

struct VdsoInitializer {
  VdsoInitializer() {
    m_handle = dlopen("linux-vdso.so.1", RTLD_LAZY | RTLD_LOCAL | RTLD_NOLOAD);
    if (!m_handle) {
      return;
    }

    void* p = dlsym(m_handle, "__vdso_clock_gettime");
    if (p) {
      folly::chrono::clock_gettime = (int (*)(clockid_t, timespec*))p;
    }
    p = dlsym(m_handle, "__vdso_clock_gettime_ns");
    if (p) {
      folly::chrono::clock_gettime_ns = (int64_t(*)(clockid_t))p;
    }
  }

  ~VdsoInitializer() {
    if (m_handle) {
      clock_gettime = &::clock_gettime;
      clock_gettime_ns = &clock_gettime_ns_fallback;
      dlclose(m_handle);
    }
  }

 private:
  void* m_handle;
};

static const VdsoInitializer vdso_initializer;
}

#endif
}
}
