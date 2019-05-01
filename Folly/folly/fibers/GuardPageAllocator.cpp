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
#include <folly/fibers/GuardPageAllocator.h>

#ifndef _WIN32
#include <dlfcn.h>
#endif
#include <signal.h>

#include <iostream>
#include <mutex>

#include <folly/Singleton.h>
#include <folly/SpinLock.h>
#include <folly/Synchronized.h>
#include <folly/portability/SysMman.h>
#include <folly/portability/Unistd.h>

#include <glog/logging.h>

namespace folly {
namespace fibers {

/**
 * Each stack with a guard page creates two memory mappings.
 * Since this is a limited resource, we don't want to create too many of these.
 *
 * The upper bound on total number of mappings created
 * is kNumGuarded * kMaxInUse.
 */

/**
 * Number of guarded stacks per allocator instance
 */
constexpr size_t kNumGuarded = 100;

/**
 * Maximum number of allocator instances with guarded stacks enabled
 */
constexpr size_t kMaxInUse = 100;

/**
 * A cache for kNumGuarded stacks of a given size
 *
 * Thread safe.
 */
class StackCache {
 public:
  explicit StackCache(size_t stackSize) : allocSize_(allocSize(stackSize)) {
    auto p = ::mmap(
        nullptr,
        allocSize_ * kNumGuarded,
        PROT_READ | PROT_WRITE,
        MAP_PRIVATE | MAP_ANONYMOUS,
        -1,
        0);
    PCHECK(p != (void*)(-1));
    storage_ = reinterpret_cast<unsigned char*>(p);

    /* Protect the bottommost page of every stack allocation */
    for (size_t i = 0; i < kNumGuarded; ++i) {
      auto allocBegin = storage_ + allocSize_ * i;
      freeList_.emplace_back(allocBegin, /* protected= */ false);
    }
  }

  unsigned char* borrow(size_t size) {
    std::lock_guard<folly::SpinLock> lg(lock_);

    assert(storage_);

    auto as = allocSize(size);
    if (as != allocSize_ || freeList_.empty()) {
      return nullptr;
    }

    auto p = freeList_.back().first;
    if (!freeList_.back().second) {
      PCHECK(0 == ::mprotect(p, pagesize(), PROT_NONE));
      protectedPages().wlock()->insert(reinterpret_cast<intptr_t>(p));
    }
    freeList_.pop_back();

    /* We allocate minimum number of pages required, plus a guard page.
       Since we use this for stack storage, requested allocation is aligned
       at the top of the allocated pages, while the guard page is at the bottom.

               -- increasing addresses -->
             Guard page     Normal pages
            |xxxxxxxxxx|..........|..........|
            <- allocSize_ ------------------->
         p -^                <- size -------->
                      limit -^
    */
    auto limit = p + allocSize_ - size;
    assert(limit >= p + pagesize());
    return limit;
  }

  bool giveBack(unsigned char* limit, size_t size) {
    std::lock_guard<folly::SpinLock> lg(lock_);

    assert(storage_);

    auto as = allocSize(size);
    if (std::less_equal<void*>{}(limit, storage_) ||
        std::less_equal<void*>{}(storage_ + allocSize_ * kNumGuarded, limit)) {
      /* not mine */
      return false;
    }

    auto p = limit + size - as;
    assert(as == allocSize_);
    assert((p - storage_) % allocSize_ == 0);
    freeList_.emplace_back(p, /* protected= */ true);
    return true;
  }

  ~StackCache() {
    assert(storage_);
    protectedPages().withWLock([&](auto& pages) {
      for (const auto& item : freeList_) {
        pages.erase(reinterpret_cast<intptr_t>(item.first));
      }
    });
    PCHECK(0 == ::munmap(storage_, allocSize_ * kNumGuarded));
  }

  static bool isProtected(intptr_t addr) {
    // Use a read lock for reading.
    return protectedPages().withRLock([&](auto const& pages) {
      for (const auto& page : pages) {
        intptr_t pageEnd = intptr_t(page + pagesize());
        if (page <= addr && addr < pageEnd) {
          return true;
        }
      }
      return false;
    });
  }

 private:
  folly::SpinLock lock_;
  unsigned char* storage_{nullptr};
  size_t allocSize_{0};

  /**
   * LIFO free list. Each pair contains stack pointer and protected flag.
   */
  std::vector<std::pair<unsigned char*, bool>> freeList_;

  static size_t pagesize() {
    static const size_t pagesize = size_t(sysconf(_SC_PAGESIZE));
    return pagesize;
  }

  /* Returns a multiple of pagesize() enough to store size + one guard page */
  static size_t allocSize(size_t size) {
    return pagesize() * ((size + pagesize() - 1) / pagesize() + 1);
  }

  static folly::Synchronized<std::unordered_set<intptr_t>>& protectedPages() {
    static auto instance =
        new folly::Synchronized<std::unordered_set<intptr_t>>();
    return *instance;
  }
};

#ifndef _WIN32

namespace {

struct sigaction oldSigsegvAction;

void sigsegvSignalHandler(int signum, siginfo_t* info, void*) {
  if (signum != SIGSEGV) {
    std::cerr << "GuardPageAllocator signal handler called for signal: "
              << signum;
    return;
  }

  if (info &&
      StackCache::isProtected(reinterpret_cast<intptr_t>(info->si_addr))) {
    std::cerr << "folly::fibers Fiber stack overflow detected." << std::endl;
  }

  // Restore old signal handler and let it handle the signal.
  sigaction(signum, &oldSigsegvAction, nullptr);
  raise(signum);
}

bool isInJVM() {
  auto getCreated = dlsym(RTLD_DEFAULT, "JNI_GetCreatedJavaVMs");
  return getCreated;
}

void installSignalHandler() {
  static std::once_flag onceFlag;
  std::call_once(onceFlag, []() {
    if (isInJVM()) {
      // Don't install signal handler, since JVM internal signal handler doesn't
      // work with SA_ONSTACK
      return;
    }

    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));
    sigemptyset(&sa.sa_mask);
    // By default signal handlers are run on the signaled thread's stack.
    // In case of stack overflow running the SIGSEGV signal handler on
    // the same stack leads to another SIGSEGV and crashes the program.
    // Use SA_ONSTACK, so alternate stack is used (only if configured via
    // sigaltstack).
    sa.sa_flags |= SA_SIGINFO | SA_ONSTACK;
    sa.sa_sigaction = &sigsegvSignalHandler;
    sigaction(SIGSEGV, &sa, &oldSigsegvAction);
  });
}
} // namespace

#endif

class CacheManager {
 public:
  static CacheManager& instance() {
    static auto inst = new CacheManager();
    return *inst;
  }

  std::unique_ptr<StackCacheEntry> getStackCache(size_t stackSize) {
    std::lock_guard<folly::SpinLock> lg(lock_);
    if (inUse_ < kMaxInUse) {
      ++inUse_;
      return std::make_unique<StackCacheEntry>(stackSize);
    }

    return nullptr;
  }

 private:
  folly::SpinLock lock_;
  size_t inUse_{0};

  friend class StackCacheEntry;

  void giveBack(std::unique_ptr<StackCache> /* stackCache_ */) {
    assert(inUse_ > 0);
    --inUse_;
    /* Note: we can add a free list for each size bucket
       if stack re-use is important.
       In this case this needs to be a folly::Singleton
       to make sure the free list is cleaned up on fork.

       TODO(t7351705): fix Singleton destruction order
    */
  }
};

/*
 * RAII Wrapper around a StackCache that calls
 * CacheManager::giveBack() on destruction.
 */
class StackCacheEntry {
 public:
  explicit StackCacheEntry(size_t stackSize)
      : stackCache_(std::make_unique<StackCache>(stackSize)) {}

  StackCache& cache() const noexcept {
    return *stackCache_;
  }

  ~StackCacheEntry() {
    CacheManager::instance().giveBack(std::move(stackCache_));
  }

 private:
  std::unique_ptr<StackCache> stackCache_;
};

GuardPageAllocator::GuardPageAllocator(bool useGuardPages)
    : useGuardPages_(useGuardPages) {
#ifndef _WIN32
  installSignalHandler();
#endif
}

GuardPageAllocator::~GuardPageAllocator() = default;

unsigned char* GuardPageAllocator::allocate(size_t size) {
  if (useGuardPages_ && !stackCache_) {
    stackCache_ = CacheManager::instance().getStackCache(size);
  }

  if (stackCache_) {
    auto p = stackCache_->cache().borrow(size);
    if (p != nullptr) {
      return p;
    }
  }
  return fallbackAllocator_.allocate(size);
}

void GuardPageAllocator::deallocate(unsigned char* limit, size_t size) {
  if (!(stackCache_ && stackCache_->cache().giveBack(limit, size))) {
    fallbackAllocator_.deallocate(limit, size);
  }
}
} // namespace fibers
} // namespace folly
