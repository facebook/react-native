/*
 * Copyright 2013-present Facebook, Inc.
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

#include <algorithm>
#include <array>
#include <atomic>
#include <cassert>
#include <functional>
#include <limits>
#include <mutex>
#include <string>
#include <type_traits>
#include <unordered_map>
#include <vector>

#include <folly/Indestructible.h>
#include <folly/Likely.h>
#include <folly/Memory.h>
#include <folly/Portability.h>
#include <folly/hash/Hash.h>
#include <folly/lang/Align.h>
#include <folly/lang/Exception.h>
#include <folly/system/ThreadId.h>

namespace folly {

// This file contains several classes that might be useful if you are
// trying to dynamically optimize cache locality: CacheLocality reads
// cache sharing information from sysfs to determine how CPUs should be
// grouped to minimize contention, Getcpu provides fast access to the
// current CPU via __vdso_getcpu, and AccessSpreader uses these two to
// optimally spread accesses among a predetermined number of stripes.
//
// AccessSpreader<>::current(n) microbenchmarks at 22 nanos, which is
// substantially less than the cost of a cache miss.  This means that we
// can effectively use it to reduce cache line ping-pong on striped data
// structures such as IndexedMemPool or statistics counters.
//
// Because CacheLocality looks at all of the cache levels, it can be
// used for different levels of optimization.  AccessSpreader(2) does
// per-chip spreading on a dual socket system.  AccessSpreader(numCpus)
// does perfect per-cpu spreading.  AccessSpreader(numCpus / 2) does
// perfect L1 spreading in a system with hyperthreading enabled.

struct CacheLocality {
  /// 1 more than the maximum value that can be returned from sched_getcpu
  /// or getcpu.  This is the number of hardware thread contexts provided
  /// by the processors
  size_t numCpus;

  /// Holds the number of caches present at each cache level (0 is
  /// the closest to the cpu).  This is the number of AccessSpreader
  /// stripes needed to avoid cross-cache communication at the specified
  /// layer.  numCachesByLevel.front() is the number of L1 caches and
  /// numCachesByLevel.back() is the number of last-level caches.
  std::vector<size_t> numCachesByLevel;

  /// A map from cpu (from sched_getcpu or getcpu) to an index in the
  /// range 0..numCpus-1, where neighboring locality indices are more
  /// likely to share caches then indices far away.  All of the members
  /// of a particular cache level be contiguous in their locality index.
  /// For example, if numCpus is 32 and numCachesByLevel.back() is 2,
  /// then cpus with a locality index < 16 will share one last-level
  /// cache and cpus with a locality index >= 16 will share the other.
  std::vector<size_t> localityIndexByCpu;

  /// Returns the best CacheLocality information available for the current
  /// system, cached for fast access.  This will be loaded from sysfs if
  /// possible, otherwise it will be correct in the number of CPUs but
  /// not in their sharing structure.
  ///
  /// If you are into yo dawgs, this is a shared cache of the local
  /// locality of the shared caches.
  ///
  /// The template parameter here is used to allow injection of a
  /// repeatable CacheLocality structure during testing.  Rather than
  /// inject the type of the CacheLocality provider into every data type
  /// that transitively uses it, all components select between the default
  /// sysfs implementation and a deterministic implementation by keying
  /// off the type of the underlying atomic.  See DeterministicScheduler.
  template <template <typename> class Atom = std::atomic>
  static const CacheLocality& system();

  /// Reads CacheLocality information from a tree structured like
  /// the sysfs filesystem.  The provided function will be evaluated
  /// for each sysfs file that needs to be queried.  The function
  /// should return a string containing the first line of the file
  /// (not including the newline), or an empty string if the file does
  /// not exist.  The function will be called with paths of the form
  /// /sys/devices/system/cpu/cpu*/cache/index*/{type,shared_cpu_list} .
  /// Throws an exception if no caches can be parsed at all.
  static CacheLocality readFromSysfsTree(
      const std::function<std::string(std::string)>& mapping);

  /// Reads CacheLocality information from the real sysfs filesystem.
  /// Throws an exception if no cache information can be loaded.
  static CacheLocality readFromSysfs();

  /// Returns a usable (but probably not reflective of reality)
  /// CacheLocality structure with the specified number of cpus and a
  /// single cache level that associates one cpu per cache.
  static CacheLocality uniform(size_t numCpus);
};

/// Knows how to derive a function pointer to the VDSO implementation of
/// getcpu(2), if available
struct Getcpu {
  /// Function pointer to a function with the same signature as getcpu(2).
  typedef int (*Func)(unsigned* cpu, unsigned* node, void* unused);

  /// Returns a pointer to the VDSO implementation of getcpu(2), if
  /// available, or nullptr otherwise.  This function may be quite
  /// expensive, be sure to cache the result.
  static Func resolveVdsoFunc();
};

#ifdef FOLLY_TLS
template <template <typename> class Atom>
struct SequentialThreadId {
  /// Returns the thread id assigned to the current thread
  static unsigned get() {
    auto rv = currentId;
    if (UNLIKELY(rv == 0)) {
      rv = currentId = ++prevId;
    }
    return rv;
  }

 private:
  static Atom<unsigned> prevId;

  static FOLLY_TLS unsigned currentId;
};

template <template <typename> class Atom>
Atom<unsigned> SequentialThreadId<Atom>::prevId(0);

template <template <typename> class Atom>
FOLLY_TLS unsigned SequentialThreadId<Atom>::currentId(0);

// Suppress this instantiation in other translation units. It is
// instantiated in CacheLocality.cpp
extern template struct SequentialThreadId<std::atomic>;
#endif

struct HashingThreadId {
  static unsigned get() {
    return hash::twang_32from64(getCurrentThreadID());
  }
};

/// A class that lazily binds a unique (for each implementation of Atom)
/// identifier to a thread.  This is a fallback mechanism for the access
/// spreader if __vdso_getcpu can't be loaded
template <typename ThreadId>
struct FallbackGetcpu {
  /// Fills the thread id into the cpu and node out params (if they
  /// are non-null).  This method is intended to act like getcpu when a
  /// fast-enough form of getcpu isn't available or isn't desired
  static int getcpu(unsigned* cpu, unsigned* node, void* /* unused */) {
    auto id = ThreadId::get();
    if (cpu) {
      *cpu = id;
    }
    if (node) {
      *node = id;
    }
    return 0;
  }
};

#ifdef FOLLY_TLS
typedef FallbackGetcpu<SequentialThreadId<std::atomic>> FallbackGetcpuType;
#else
typedef FallbackGetcpu<HashingThreadId> FallbackGetcpuType;
#endif

/// AccessSpreader arranges access to a striped data structure in such a
/// way that concurrently executing threads are likely to be accessing
/// different stripes.  It does NOT guarantee uncontended access.
/// Your underlying algorithm must be thread-safe without spreading, this
/// is merely an optimization.  AccessSpreader::current(n) is typically
/// much faster than a cache miss (12 nanos on my dev box, tested fast
/// in both 2.6 and 3.2 kernels).
///
/// If available (and not using the deterministic testing implementation)
/// AccessSpreader uses the getcpu system call via VDSO and the
/// precise locality information retrieved from sysfs by CacheLocality.
/// This provides optimal anti-sharing at a fraction of the cost of a
/// cache miss.
///
/// When there are not as many stripes as processors, we try to optimally
/// place the cache sharing boundaries.  This means that if you have 2
/// stripes and run on a dual-socket system, your 2 stripes will each get
/// all of the cores from a single socket.  If you have 16 stripes on a
/// 16 core system plus hyperthreading (32 cpus), each core will get its
/// own stripe and there will be no cache sharing at all.
///
/// AccessSpreader has a fallback mechanism for when __vdso_getcpu can't be
/// loaded, or for use during deterministic testing.  Using sched_getcpu
/// or the getcpu syscall would negate the performance advantages of
/// access spreading, so we use a thread-local value and a shared atomic
/// counter to spread access out.  On systems lacking both a fast getcpu()
/// and TLS, we hash the thread id to spread accesses.
///
/// AccessSpreader is templated on the template type that is used
/// to implement atomics, as a way to instantiate the underlying
/// heuristics differently for production use and deterministic unit
/// testing.  See DeterministicScheduler for more.  If you aren't using
/// DeterministicScheduler, you can just use the default template parameter
/// all of the time.
template <template <typename> class Atom = std::atomic>
struct AccessSpreader {
  /// Returns the stripe associated with the current CPU.  The returned
  /// value will be < numStripes.
  static size_t current(size_t numStripes) {
    // widthAndCpuToStripe[0] will actually work okay (all zeros), but
    // something's wrong with the caller
    assert(numStripes > 0);

    unsigned cpu;
    getcpuFunc(&cpu, nullptr, nullptr);
    return widthAndCpuToStripe[std::min(size_t(kMaxCpus), numStripes)]
                              [cpu % kMaxCpus];
  }

#ifdef FOLLY_TLS
  /// Returns the stripe associated with the current CPU.  The returned
  /// value will be < numStripes.
  /// This function caches the current cpu in a thread-local variable for a
  /// certain small number of calls, which can make the result imprecise, but
  /// it is more efficient (amortized 2 ns on my dev box, compared to 12 ns for
  /// current()).
  static size_t cachedCurrent(size_t numStripes) {
    return widthAndCpuToStripe[std::min(size_t(kMaxCpus), numStripes)]
                              [cpuCache.cpu()];
  }
#else
  /// Fallback implementation when thread-local storage isn't available.
  static size_t cachedCurrent(size_t numStripes) {
    return current(numStripes);
  }
#endif

 private:
  /// If there are more cpus than this nothing will crash, but there
  /// might be unnecessary sharing
  enum { kMaxCpus = 128 };

  typedef uint8_t CompactStripe;

  static_assert(
      (kMaxCpus & (kMaxCpus - 1)) == 0,
      "kMaxCpus should be a power of two so modulo is fast");
  static_assert(
      kMaxCpus - 1 <= std::numeric_limits<CompactStripe>::max(),
      "stripeByCpu element type isn't wide enough");

  /// Points to the getcpu-like function we are using to obtain the
  /// current cpu.  It should not be assumed that the returned cpu value
  /// is in range.  We use a static for this so that we can prearrange a
  /// valid value in the pre-constructed state and avoid the need for a
  /// conditional on every subsequent invocation (not normally a big win,
  /// but 20% on some inner loops here).
  static Getcpu::Func getcpuFunc;

  /// For each level of splitting up to kMaxCpus, maps the cpu (mod
  /// kMaxCpus) to the stripe.  Rather than performing any inequalities
  /// or modulo on the actual number of cpus, we just fill in the entire
  /// array.
  static CompactStripe widthAndCpuToStripe[kMaxCpus + 1][kMaxCpus];

  /// Caches the current CPU and refreshes the cache every so often.
  class CpuCache {
   public:
    unsigned cpu() {
      if (UNLIKELY(cachedCpuUses_-- == 0)) {
        unsigned cpu;
        AccessSpreader::getcpuFunc(&cpu, nullptr, nullptr);
        cachedCpu_ = cpu % kMaxCpus;
        cachedCpuUses_ = kMaxCachedCpuUses - 1;
      }
      return cachedCpu_;
    }

   private:
    static constexpr unsigned kMaxCachedCpuUses = 32;

    unsigned cachedCpu_{0};
    unsigned cachedCpuUses_{0};
  };

#ifdef FOLLY_TLS
  static FOLLY_TLS CpuCache cpuCache;
#endif

  static bool initialized;

  /// Returns the best getcpu implementation for Atom
  static Getcpu::Func pickGetcpuFunc() {
    auto best = Getcpu::resolveVdsoFunc();
    return best ? best : &FallbackGetcpuType::getcpu;
  }

  /// Always claims to be on CPU zero, node zero
  static int degenerateGetcpu(unsigned* cpu, unsigned* node, void*) {
    if (cpu != nullptr) {
      *cpu = 0;
    }
    if (node != nullptr) {
      *node = 0;
    }
    return 0;
  }

  // The function to call for fast lookup of getcpu is a singleton, as
  // is the precomputed table of locality information.  AccessSpreader
  // is used in very tight loops, however (we're trying to race an L1
  // cache miss!), so the normal singleton mechanisms are noticeably
  // expensive.  Even a not-taken branch guarding access to getcpuFunc
  // slows AccessSpreader::current from 12 nanos to 14.  As a result, we
  // populate the static members with simple (but valid) values that can
  // be filled in by the linker, and then follow up with a normal static
  // initializer call that puts in the proper version.  This means that
  // when there are initialization order issues we will just observe a
  // zero stripe.  Once a sanitizer gets smart enough to detect this as
  // a race or undefined behavior, we can annotate it.

  static bool initialize() {
    getcpuFunc = pickGetcpuFunc();

    auto& cacheLocality = CacheLocality::system<Atom>();
    auto n = cacheLocality.numCpus;
    for (size_t width = 0; width <= kMaxCpus; ++width) {
      auto numStripes = std::max(size_t{1}, width);
      for (size_t cpu = 0; cpu < kMaxCpus && cpu < n; ++cpu) {
        auto index = cacheLocality.localityIndexByCpu[cpu];
        assert(index < n);
        // as index goes from 0..n, post-transform value goes from
        // 0..numStripes
        widthAndCpuToStripe[width][cpu] =
            CompactStripe((index * numStripes) / n);
        assert(widthAndCpuToStripe[width][cpu] < numStripes);
      }
      for (size_t cpu = n; cpu < kMaxCpus; ++cpu) {
        widthAndCpuToStripe[width][cpu] = widthAndCpuToStripe[width][cpu - n];
      }
    }
    return true;
  }
};

template <template <typename> class Atom>
Getcpu::Func AccessSpreader<Atom>::getcpuFunc =
    AccessSpreader<Atom>::degenerateGetcpu;

template <template <typename> class Atom>
typename AccessSpreader<Atom>::CompactStripe
    AccessSpreader<Atom>::widthAndCpuToStripe[kMaxCpus + 1][kMaxCpus] = {};

#ifdef FOLLY_TLS
template <template <typename> class Atom>
FOLLY_TLS
    typename AccessSpreader<Atom>::CpuCache AccessSpreader<Atom>::cpuCache;
#endif

template <template <typename> class Atom>
bool AccessSpreader<Atom>::initialized = AccessSpreader<Atom>::initialize();

// Suppress this instantiation in other translation units. It is
// instantiated in CacheLocality.cpp
extern template struct AccessSpreader<std::atomic>;

/**
 * A simple freelist allocator.  Allocates things of size sz, from
 * slabs of size allocSize.  Takes a lock on each
 * allocation/deallocation.
 */
class SimpleAllocator {
  std::mutex m_;
  uint8_t* mem_{nullptr};
  uint8_t* end_{nullptr};
  void* freelist_{nullptr};
  size_t allocSize_;
  size_t sz_;
  std::vector<void*> blocks_;

 public:
  SimpleAllocator(size_t allocSize, size_t sz);
  ~SimpleAllocator();
  void* allocateHard();

  // Inline fast-paths.
  void* allocate() {
    std::lock_guard<std::mutex> g(m_);
    // Freelist allocation.
    if (freelist_) {
      auto mem = freelist_;
      freelist_ = *static_cast<void**>(freelist_);
      return mem;
    }

    // Bump-ptr allocation.
    if (intptr_t(mem_) % 128 == 0) {
      // Avoid allocating pointers that may look like malloc
      // pointers.
      mem_ += std::min(sz_, max_align_v);
    }
    if (mem_ && (mem_ + sz_ <= end_)) {
      auto mem = mem_;
      mem_ += sz_;

      assert(intptr_t(mem) % 128 != 0);
      return mem;
    }

    return allocateHard();
  }
  void deallocate(void* mem) {
    std::lock_guard<std::mutex> g(m_);
    *static_cast<void**>(mem) = freelist_;
    freelist_ = mem;
  }
};

/**
 * An allocator that can be used with CacheLocality to allocate
 * core-local memory.
 *
 * There is actually nothing special about the memory itself (it is
 * not bound to numa nodes or anything), but the allocator guarantees
 * that memory allocatd from the same stripe will only come from cache
 * lines also allocated to the same stripe.  This means multiple
 * things using CacheLocality can allocate memory in smaller-than
 * cacheline increments, and be assured that it won't cause more false
 * sharing than it otherwise would.
 *
 * Note that allocation and deallocation takes a per-sizeclass lock.
 */
template <size_t Stripes>
class CoreRawAllocator {
 public:
  class Allocator {
    static constexpr size_t AllocSize{4096};

    uint8_t sizeClass(size_t size) {
      if (size <= 8) {
        return 0;
      } else if (size <= 16) {
        return 1;
      } else if (size <= 32) {
        return 2;
      } else if (size <= 64) {
        return 3;
      } else { // punt to malloc.
        return 4;
      }
    }

    std::array<SimpleAllocator, 4> allocators_{
        {{AllocSize, 8}, {AllocSize, 16}, {AllocSize, 32}, {AllocSize, 64}}};

   public:
    void* allocate(size_t size) {
      auto cl = sizeClass(size);
      if (cl == 4) {
        // Align to a cacheline
        size = size + (hardware_destructive_interference_size - 1);
        size &= ~size_t(hardware_destructive_interference_size - 1);
        void* mem =
            aligned_malloc(size, hardware_destructive_interference_size);
        if (!mem) {
          throw_exception<std::bad_alloc>();
        }
        return mem;
      }
      return allocators_[cl].allocate();
    }
    void deallocate(void* mem, size_t = 0) {
      if (!mem) {
        return;
      }

      // See if it came from this allocator or malloc.
      if (intptr_t(mem) % 128 != 0) {
        auto addr =
            reinterpret_cast<void*>(intptr_t(mem) & ~intptr_t(AllocSize - 1));
        auto allocator = *static_cast<SimpleAllocator**>(addr);
        allocator->deallocate(mem);
      } else {
        aligned_free(mem);
      }
    }
  };

  Allocator* get(size_t stripe) {
    assert(stripe < Stripes);
    return &allocators_[stripe];
  }

 private:
  Allocator allocators_[Stripes];
};

template <typename T, size_t Stripes>
CxxAllocatorAdaptor<T, typename CoreRawAllocator<Stripes>::Allocator>
getCoreAllocator(size_t stripe) {
  // We cannot make sure that the allocator will be destroyed after
  // all the objects allocated with it, so we leak it.
  static Indestructible<CoreRawAllocator<Stripes>> allocator;
  return CxxAllocatorAdaptor<T, typename CoreRawAllocator<Stripes>::Allocator>(
      *allocator->get(stripe));
}

} // namespace folly
