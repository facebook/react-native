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

#include <folly/detail/MemoryIdler.h>

#include <folly/Logging.h>
#include <folly/MallctlHelper.h>
#include <folly/Malloc.h>
#include <folly/Portability.h>
#include <folly/ScopeGuard.h>
#include <folly/detail/CacheLocality.h>
#include <folly/portability/SysMman.h>
#include <folly/portability/Unistd.h>

#include <limits.h>
#include <pthread.h>
#include <stdio.h>
#include <string.h>
#include <utility>

namespace folly { namespace detail {

AtomicStruct<std::chrono::steady_clock::duration>
MemoryIdler::defaultIdleTimeout(std::chrono::seconds(5));

void MemoryIdler::flushLocalMallocCaches() {
  if (!usingJEMalloc()) {
    return;
  }
  if (!mallctl || !mallctlnametomib || !mallctlbymib) {
    FB_LOG_EVERY_MS(ERROR, 10000) << "mallctl* weak link failed";
    return;
  }

  try {
    mallctlCall("thread.tcache.flush");

    // By default jemalloc has 4 arenas per cpu, and then assigns each
    // thread to one of those arenas.  This means that in any service
    // that doesn't perform a lot of context switching, the chances that
    // another thread will be using the current thread's arena (and hence
    // doing the appropriate dirty-page purging) are low.  Some good
    // tuned configurations (such as that used by hhvm) use fewer arenas
    // and then pin threads to avoid contended access.  In that case,
    // purging the arenas is counter-productive.  We use the heuristic
    // that if narenas <= 2 * num_cpus then we shouldn't do anything here,
    // which detects when the narenas has been reduced from the default
    unsigned narenas;
    unsigned arenaForCurrent;
    size_t mib[3];
    size_t miblen = 3;

    mallctlRead("opt.narenas", &narenas);
    mallctlRead("thread.arena", &arenaForCurrent);
    if (narenas > 2 * CacheLocality::system().numCpus &&
        mallctlnametomib("arena.0.purge", mib, &miblen) == 0) {
      mib[1] = size_t(arenaForCurrent);
      mallctlbymib(mib, miblen, nullptr, nullptr, nullptr, 0);
    }
  } catch (const std::runtime_error& ex) {
    FB_LOG_EVERY_MS(WARNING, 10000) << ex.what();
  }
}


// Stack madvise isn't Linux or glibc specific, but the system calls
// and arithmetic (and bug compatibility) are not portable.  The set of
// platforms could be increased if it was useful.
#if (FOLLY_X64 || FOLLY_PPC64) && defined(_GNU_SOURCE) && \
    defined(__linux__) && !FOLLY_MOBILE && !FOLLY_SANITIZE_ADDRESS

static FOLLY_TLS uintptr_t tls_stackLimit;
static FOLLY_TLS size_t tls_stackSize;

static size_t pageSize() {
  static const size_t s_pageSize = sysconf(_SC_PAGESIZE);
  return s_pageSize;
}

static void fetchStackLimits() {
  pthread_attr_t attr;
  pthread_getattr_np(pthread_self(), &attr);
  SCOPE_EXIT { pthread_attr_destroy(&attr); };

  void* addr;
  size_t rawSize;
  int err;
  if ((err = pthread_attr_getstack(&attr, &addr, &rawSize))) {
    // unexpected, but it is better to continue in prod than do nothing
    FB_LOG_EVERY_MS(ERROR, 10000) << "pthread_attr_getstack error " << err;
    assert(false);
    tls_stackSize = 1;
    return;
  }
  assert(addr != nullptr);
  assert(rawSize >= PTHREAD_STACK_MIN);

  // glibc subtracts guard page from stack size, even though pthread docs
  // seem to imply the opposite
  size_t guardSize;
  if (pthread_attr_getguardsize(&attr, &guardSize) != 0) {
    guardSize = 0;
  }
  assert(rawSize > guardSize);

  // stack goes down, so guard page adds to the base addr
  tls_stackLimit = uintptr_t(addr) + guardSize;
  tls_stackSize = rawSize - guardSize;

  assert((tls_stackLimit & (pageSize() - 1)) == 0);
}

FOLLY_NOINLINE static uintptr_t getStackPtr() {
  char marker;
  auto rv = uintptr_t(&marker);
  return rv;
}

void MemoryIdler::unmapUnusedStack(size_t retain) {
  if (tls_stackSize == 0) {
    fetchStackLimits();
  }
  if (tls_stackSize <= std::max(size_t(1), retain)) {
    // covers both missing stack info, and impossibly large retain
    return;
  }

  auto sp = getStackPtr();
  assert(sp >= tls_stackLimit);
  assert(sp - tls_stackLimit < tls_stackSize);

  auto end = (sp - retain) & ~(pageSize() - 1);
  if (end <= tls_stackLimit) {
    // no pages are eligible for unmapping
    return;
  }

  size_t len = end - tls_stackLimit;
  assert((len & (pageSize() - 1)) == 0);
  if (madvise((void*)tls_stackLimit, len, MADV_DONTNEED) != 0) {
    // It is likely that the stack vma hasn't been fully grown.  In this
    // case madvise will apply dontneed to the present vmas, then return
    // errno of ENOMEM.  We can also get an EAGAIN, theoretically.
    // EINVAL means either an invalid alignment or length, or that some
    // of the pages are locked or shared.  Neither should occur.
    assert(errno == EAGAIN || errno == ENOMEM);
  }
}

#else

void MemoryIdler::unmapUnusedStack(size_t /* retain */) {}

#endif

}}
