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

#include <folly/synchronization/AsymmetricMemoryBarrier.h>

#include <folly/Exception.h>
#include <folly/Indestructible.h>
#include <folly/portability/SysMembarrier.h>
#include <folly/portability/SysMman.h>
#include <mutex>

namespace folly {

namespace {

struct DummyPageCreator {
  DummyPageCreator() {
    get();
  }

  static void* get() {
    static auto ptr = kIsLinux ? create() : nullptr;
    return ptr;
  }

 private:
  static void* create() {
    auto ptr = mmap(nullptr, 1, PROT_READ, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    checkUnixError(reinterpret_cast<ssize_t>(ptr), "mmap");

    // Optimistically try to lock the page so it stays resident. Could make
    // the heavy barrier faster.
    auto r = mlock(ptr, 1);
    if (r != 0) {
      // Do nothing.
    }

    return ptr;
  }
};

// Make sure dummy page is always initialized before shutdown.
DummyPageCreator dummyPageCreator;

void mprotectMembarrier() {
  auto dummyPage = dummyPageCreator.get();

  // This function is required to be safe to call on shutdown,
  // so we must leak the mutex.
  static Indestructible<std::mutex> mprotectMutex;
  std::lock_guard<std::mutex> lg(*mprotectMutex);

  int r = 0;

  // We want to downgrade the page while it is resident. To do that, it must
  // first be upgraded and forced to be resident.
  r = mprotect(dummyPage, 1, PROT_READ | PROT_WRITE);
  checkUnixError(r, "mprotect");

  // Force the page to be resident. If it is already resident, almost no-op.
  *static_cast<char*>(dummyPage) = 0;

  // Downgrade the page. Forces a memory barrier in every core running any
  // of the process's threads. On a sane platform.
  r = mprotect(dummyPage, 1, PROT_READ);
  checkUnixError(r, "mprotect");
}
} // namespace

void asymmetricHeavyBarrier(AMBFlags flags) {
  if (kIsLinux) {
    static const bool useSysMembarrier = detail::sysMembarrierAvailable();
    // sys_membarrier currently does not support EXPEDITED
    if (useSysMembarrier && flags != AMBFlags::EXPEDITED) {
      auto r = detail::sysMembarrier();
      checkUnixError(r, "membarrier");
    } else {
      mprotectMembarrier();
    }
  } else {
    std::atomic_thread_fence(std::memory_order_seq_cst);
  }
}
} // namespace folly
