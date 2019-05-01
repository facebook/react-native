/*
 * Copyright 2011-present Facebook, Inc.
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
/*
 * N.B. You most likely do _not_ want to use RWSpinLock or any other
 * kind of spinlock.  Use SharedMutex instead.
 *
 * In short, spinlocks in preemptive multi-tasking operating systems
 * have serious problems and fast mutexes like SharedMutex are almost
 * certainly the better choice, because letting the OS scheduler put a
 * thread to sleep is better for system responsiveness and throughput
 * than wasting a timeslice repeatedly querying a lock held by a
 * thread that's blocked, and you can't prevent userspace
 * programs blocking.
 *
 * Spinlocks in an operating system kernel make much more sense than
 * they do in userspace.
 *
 * -------------------------------------------------------------------
 *
 * Two Read-Write spin lock implementations.
 *
 *  Ref: http://locklessinc.com/articles/locks
 *
 *  Both locks here are faster than pthread_rwlock and have very low
 *  overhead (usually 20-30ns).  They don't use any system mutexes and
 *  are very compact (4/8 bytes), so are suitable for per-instance
 *  based locking, particularly when contention is not expected.
 *
 *  For a spinlock, RWSpinLock is a reasonable choice.  (See the note
 *  about for why a spin lock is frequently a bad idea generally.)
 *  RWSpinLock has minimal overhead, and comparable contention
 *  performance when the number of competing threads is less than or
 *  equal to the number of logical CPUs.  Even as the number of
 *  threads gets larger, RWSpinLock can still be very competitive in
 *  READ, although it is slower on WRITE, and also inherently unfair
 *  to writers.
 *
 *  RWTicketSpinLock shows more balanced READ/WRITE performance.  If
 *  your application really needs a lot more threads, and a
 *  higher-priority writer, prefer one of the RWTicketSpinLock locks.
 *
 *  Caveats:
 *
 *    RWTicketSpinLock locks can only be used with GCC on x86/x86-64
 *    based systems.
 *
 *    RWTicketSpinLock<32> only allows up to 2^8 - 1 concurrent
 *    readers and writers.
 *
 *    RWTicketSpinLock<64> only allows up to 2^16 - 1 concurrent
 *    readers and writers.
 *
 *    RWTicketSpinLock<..., true> (kFavorWriter = true, that is, strict
 *    writer priority) is NOT reentrant, even for lock_shared().
 *
 *    The lock will not grant any new shared (read) accesses while a thread
 *    attempting to acquire the lock in write mode is blocked. (That is,
 *    if the lock is held in shared mode by N threads, and a thread attempts
 *    to acquire it in write mode, no one else can acquire it in shared mode
 *    until these N threads release the lock and then the blocked thread
 *    acquires and releases the exclusive lock.) This also applies for
 *    attempts to reacquire the lock in shared mode by threads that already
 *    hold it in shared mode, making the lock non-reentrant.
 *
 *    RWSpinLock handles 2^30 - 1 concurrent readers.
 *
 * @author Xin Liu <xliux@fb.com>
 */

#pragma once

/*
========================================================================
Benchmark on (Intel(R) Xeon(R) CPU  L5630  @ 2.13GHz)  8 cores(16 HTs)
========================================================================

------------------------------------------------------------------------------
1. Single thread benchmark (read/write lock + unlock overhead)
Benchmark                                    Iters   Total t    t/iter iter/sec
-------------------------------------------------------------------------------
*      BM_RWSpinLockRead                     100000  1.786 ms  17.86 ns   53.4M
+30.5% BM_RWSpinLockWrite                    100000  2.331 ms  23.31 ns  40.91M
+85.7% BM_RWTicketSpinLock32Read             100000  3.317 ms  33.17 ns  28.75M
+96.0% BM_RWTicketSpinLock32Write            100000    3.5 ms     35 ns  27.25M
+85.6% BM_RWTicketSpinLock64Read             100000  3.315 ms  33.15 ns  28.77M
+96.0% BM_RWTicketSpinLock64Write            100000    3.5 ms     35 ns  27.25M
+85.7% BM_RWTicketSpinLock32FavorWriterRead  100000  3.317 ms  33.17 ns  28.75M
+29.7% BM_RWTicketSpinLock32FavorWriterWrite 100000  2.316 ms  23.16 ns  41.18M
+85.3% BM_RWTicketSpinLock64FavorWriterRead  100000  3.309 ms  33.09 ns  28.82M
+30.2% BM_RWTicketSpinLock64FavorWriterWrite 100000  2.325 ms  23.25 ns  41.02M
+ 175% BM_PThreadRWMutexRead                 100000  4.917 ms  49.17 ns   19.4M
+ 166% BM_PThreadRWMutexWrite                100000  4.757 ms  47.57 ns  20.05M

------------------------------------------------------------------------------
2. Contention Benchmark      90% read  10% write
Benchmark                    hits       average    min       max        sigma
------------------------------------------------------------------------------
---------- 8  threads ------------
RWSpinLock       Write       142666     220ns      78ns      40.8us     269ns
RWSpinLock       Read        1282297    222ns      80ns      37.7us     248ns
RWTicketSpinLock Write       85692      209ns      71ns      17.9us     252ns
RWTicketSpinLock Read        769571     215ns      78ns      33.4us     251ns
pthread_rwlock_t Write       84248      2.48us     99ns      269us      8.19us
pthread_rwlock_t Read        761646     933ns      101ns     374us      3.25us

---------- 16 threads ------------
RWSpinLock       Write       124236     237ns      78ns      261us      801ns
RWSpinLock       Read        1115807    236ns      78ns      2.27ms     2.17us
RWTicketSpinLock Write       81781      231ns      71ns      31.4us     351ns
RWTicketSpinLock Read        734518     238ns      78ns      73.6us     379ns
pthread_rwlock_t Write       83363      7.12us     99ns      785us      28.1us
pthread_rwlock_t Read        754978     2.18us     101ns     1.02ms     14.3us

---------- 50 threads ------------
RWSpinLock       Write       131142     1.37us     82ns      7.53ms     68.2us
RWSpinLock       Read        1181240    262ns      78ns      6.62ms     12.7us
RWTicketSpinLock Write       83045      397ns      73ns      7.01ms     31.5us
RWTicketSpinLock Read        744133     386ns      78ns        11ms     31.4us
pthread_rwlock_t Write       80849      112us      103ns     4.52ms     263us
pthread_rwlock_t Read        728698     24us       101ns     7.28ms     194us

*/

#include <folly/Portability.h>
#include <folly/portability/Asm.h>

#if defined(__GNUC__) && (defined(__i386) || FOLLY_X64 || defined(ARCH_K8))
#define RW_SPINLOCK_USE_X86_INTRINSIC_
#include <x86intrin.h>
#elif defined(_MSC_VER) && defined(FOLLY_X64)
#define RW_SPINLOCK_USE_X86_INTRINSIC_
#elif FOLLY_AARCH64
#define RW_SPINLOCK_USE_X86_INTRINSIC_
#else
#undef RW_SPINLOCK_USE_X86_INTRINSIC_
#endif

// iOS doesn't define _mm_cvtsi64_si128 and friends
#if (FOLLY_SSE >= 2) && !FOLLY_MOBILE && FOLLY_X64
#define RW_SPINLOCK_USE_SSE_INSTRUCTIONS_
#else
#undef RW_SPINLOCK_USE_SSE_INSTRUCTIONS_
#endif

#include <algorithm>
#include <atomic>
#include <thread>

#include <folly/Likely.h>

namespace folly {

/*
 * A simple, small (4-bytes), but unfair rwlock.  Use it when you want
 * a nice writer and don't expect a lot of write/read contention, or
 * when you need small rwlocks since you are creating a large number
 * of them.
 *
 * Note that the unfairness here is extreme: if the lock is
 * continually accessed for read, writers will never get a chance.  If
 * the lock can be that highly contended this class is probably not an
 * ideal choice anyway.
 *
 * It currently implements most of the Lockable, SharedLockable and
 * UpgradeLockable concepts except the TimedLockable related locking/unlocking
 * interfaces.
 */
class RWSpinLock {
  enum : int32_t { READER = 4, UPGRADED = 2, WRITER = 1 };

 public:
  constexpr RWSpinLock() : bits_(0) {}

  RWSpinLock(RWSpinLock const&) = delete;
  RWSpinLock& operator=(RWSpinLock const&) = delete;

  // Lockable Concept
  void lock() {
    uint_fast32_t count = 0;
    while (!LIKELY(try_lock())) {
      if (++count > 1000) {
        std::this_thread::yield();
      }
    }
  }

  // Writer is responsible for clearing up both the UPGRADED and WRITER bits.
  void unlock() {
    static_assert(READER > WRITER + UPGRADED, "wrong bits!");
    bits_.fetch_and(~(WRITER | UPGRADED), std::memory_order_release);
  }

  // SharedLockable Concept
  void lock_shared() {
    uint_fast32_t count = 0;
    while (!LIKELY(try_lock_shared())) {
      if (++count > 1000) {
        std::this_thread::yield();
      }
    }
  }

  void unlock_shared() {
    bits_.fetch_add(-READER, std::memory_order_release);
  }

  // Downgrade the lock from writer status to reader status.
  void unlock_and_lock_shared() {
    bits_.fetch_add(READER, std::memory_order_acquire);
    unlock();
  }

  // UpgradeLockable Concept
  void lock_upgrade() {
    uint_fast32_t count = 0;
    while (!try_lock_upgrade()) {
      if (++count > 1000) {
        std::this_thread::yield();
      }
    }
  }

  void unlock_upgrade() {
    bits_.fetch_add(-UPGRADED, std::memory_order_acq_rel);
  }

  // unlock upgrade and try to acquire write lock
  void unlock_upgrade_and_lock() {
    int64_t count = 0;
    while (!try_unlock_upgrade_and_lock()) {
      if (++count > 1000) {
        std::this_thread::yield();
      }
    }
  }

  // unlock upgrade and read lock atomically
  void unlock_upgrade_and_lock_shared() {
    bits_.fetch_add(READER - UPGRADED, std::memory_order_acq_rel);
  }

  // write unlock and upgrade lock atomically
  void unlock_and_lock_upgrade() {
    // need to do it in two steps here -- as the UPGRADED bit might be OR-ed at
    // the same time when other threads are trying do try_lock_upgrade().
    bits_.fetch_or(UPGRADED, std::memory_order_acquire);
    bits_.fetch_add(-WRITER, std::memory_order_release);
  }

  // Attempt to acquire writer permission. Return false if we didn't get it.
  bool try_lock() {
    int32_t expect = 0;
    return bits_.compare_exchange_strong(
        expect, WRITER, std::memory_order_acq_rel);
  }

  // Try to get reader permission on the lock. This can fail if we
  // find out someone is a writer or upgrader.
  // Setting the UPGRADED bit would allow a writer-to-be to indicate
  // its intention to write and block any new readers while waiting
  // for existing readers to finish and release their read locks. This
  // helps avoid starving writers (promoted from upgraders).
  bool try_lock_shared() {
    // fetch_add is considerably (100%) faster than compare_exchange,
    // so here we are optimizing for the common (lock success) case.
    int32_t value = bits_.fetch_add(READER, std::memory_order_acquire);
    if (UNLIKELY(value & (WRITER | UPGRADED))) {
      bits_.fetch_add(-READER, std::memory_order_release);
      return false;
    }
    return true;
  }

  // try to unlock upgrade and write lock atomically
  bool try_unlock_upgrade_and_lock() {
    int32_t expect = UPGRADED;
    return bits_.compare_exchange_strong(
        expect, WRITER, std::memory_order_acq_rel);
  }

  // try to acquire an upgradable lock.
  bool try_lock_upgrade() {
    int32_t value = bits_.fetch_or(UPGRADED, std::memory_order_acquire);

    // Note: when failed, we cannot flip the UPGRADED bit back,
    // as in this case there is either another upgrade lock or a write lock.
    // If it's a write lock, the bit will get cleared up when that lock's done
    // with unlock().
    return ((value & (UPGRADED | WRITER)) == 0);
  }

  // mainly for debugging purposes.
  int32_t bits() const {
    return bits_.load(std::memory_order_acquire);
  }

  class ReadHolder;
  class UpgradedHolder;
  class WriteHolder;

  class ReadHolder {
   public:
    explicit ReadHolder(RWSpinLock* lock) : lock_(lock) {
      if (lock_) {
        lock_->lock_shared();
      }
    }

    explicit ReadHolder(RWSpinLock& lock) : lock_(&lock) {
      lock_->lock_shared();
    }

    ReadHolder(ReadHolder&& other) noexcept : lock_(other.lock_) {
      other.lock_ = nullptr;
    }

    // down-grade
    explicit ReadHolder(UpgradedHolder&& upgraded) : lock_(upgraded.lock_) {
      upgraded.lock_ = nullptr;
      if (lock_) {
        lock_->unlock_upgrade_and_lock_shared();
      }
    }

    explicit ReadHolder(WriteHolder&& writer) : lock_(writer.lock_) {
      writer.lock_ = nullptr;
      if (lock_) {
        lock_->unlock_and_lock_shared();
      }
    }

    ReadHolder& operator=(ReadHolder&& other) {
      using std::swap;
      swap(lock_, other.lock_);
      return *this;
    }

    ReadHolder(const ReadHolder& other) = delete;
    ReadHolder& operator=(const ReadHolder& other) = delete;

    ~ReadHolder() {
      if (lock_) {
        lock_->unlock_shared();
      }
    }

    void reset(RWSpinLock* lock = nullptr) {
      if (lock == lock_) {
        return;
      }
      if (lock_) {
        lock_->unlock_shared();
      }
      lock_ = lock;
      if (lock_) {
        lock_->lock_shared();
      }
    }

    void swap(ReadHolder* other) {
      std::swap(lock_, other->lock_);
    }

   private:
    friend class UpgradedHolder;
    friend class WriteHolder;
    RWSpinLock* lock_;
  };

  class UpgradedHolder {
   public:
    explicit UpgradedHolder(RWSpinLock* lock) : lock_(lock) {
      if (lock_) {
        lock_->lock_upgrade();
      }
    }

    explicit UpgradedHolder(RWSpinLock& lock) : lock_(&lock) {
      lock_->lock_upgrade();
    }

    explicit UpgradedHolder(WriteHolder&& writer) {
      lock_ = writer.lock_;
      writer.lock_ = nullptr;
      if (lock_) {
        lock_->unlock_and_lock_upgrade();
      }
    }

    UpgradedHolder(UpgradedHolder&& other) noexcept : lock_(other.lock_) {
      other.lock_ = nullptr;
    }

    UpgradedHolder& operator=(UpgradedHolder&& other) {
      using std::swap;
      swap(lock_, other.lock_);
      return *this;
    }

    UpgradedHolder(const UpgradedHolder& other) = delete;
    UpgradedHolder& operator=(const UpgradedHolder& other) = delete;

    ~UpgradedHolder() {
      if (lock_) {
        lock_->unlock_upgrade();
      }
    }

    void reset(RWSpinLock* lock = nullptr) {
      if (lock == lock_) {
        return;
      }
      if (lock_) {
        lock_->unlock_upgrade();
      }
      lock_ = lock;
      if (lock_) {
        lock_->lock_upgrade();
      }
    }

    void swap(UpgradedHolder* other) {
      using std::swap;
      swap(lock_, other->lock_);
    }

   private:
    friend class WriteHolder;
    friend class ReadHolder;
    RWSpinLock* lock_;
  };

  class WriteHolder {
   public:
    explicit WriteHolder(RWSpinLock* lock) : lock_(lock) {
      if (lock_) {
        lock_->lock();
      }
    }

    explicit WriteHolder(RWSpinLock& lock) : lock_(&lock) {
      lock_->lock();
    }

    // promoted from an upgrade lock holder
    explicit WriteHolder(UpgradedHolder&& upgraded) {
      lock_ = upgraded.lock_;
      upgraded.lock_ = nullptr;
      if (lock_) {
        lock_->unlock_upgrade_and_lock();
      }
    }

    WriteHolder(WriteHolder&& other) noexcept : lock_(other.lock_) {
      other.lock_ = nullptr;
    }

    WriteHolder& operator=(WriteHolder&& other) {
      using std::swap;
      swap(lock_, other.lock_);
      return *this;
    }

    WriteHolder(const WriteHolder& other) = delete;
    WriteHolder& operator=(const WriteHolder& other) = delete;

    ~WriteHolder() {
      if (lock_) {
        lock_->unlock();
      }
    }

    void reset(RWSpinLock* lock = nullptr) {
      if (lock == lock_) {
        return;
      }
      if (lock_) {
        lock_->unlock();
      }
      lock_ = lock;
      if (lock_) {
        lock_->lock();
      }
    }

    void swap(WriteHolder* other) {
      using std::swap;
      swap(lock_, other->lock_);
    }

   private:
    friend class ReadHolder;
    friend class UpgradedHolder;
    RWSpinLock* lock_;
  };

 private:
  std::atomic<int32_t> bits_;
};

#ifdef RW_SPINLOCK_USE_X86_INTRINSIC_
// A more balanced Read-Write spin lock implemented based on GCC intrinsics.

namespace detail {
template <size_t kBitWidth>
struct RWTicketIntTrait {
  static_assert(
      kBitWidth == 32 || kBitWidth == 64,
      "bit width has to be either 32 or 64 ");
};

template <>
struct RWTicketIntTrait<64> {
  typedef uint64_t FullInt;
  typedef uint32_t HalfInt;
  typedef uint16_t QuarterInt;

#ifdef RW_SPINLOCK_USE_SSE_INSTRUCTIONS_
  static __m128i make128(const uint16_t v[4]) {
    return _mm_set_epi16(
        0, 0, 0, 0, short(v[3]), short(v[2]), short(v[1]), short(v[0]));
  }
  static inline __m128i fromInteger(uint64_t from) {
    return _mm_cvtsi64_si128(int64_t(from));
  }
  static inline uint64_t toInteger(__m128i in) {
    return uint64_t(_mm_cvtsi128_si64(in));
  }
  static inline uint64_t addParallel(__m128i in, __m128i kDelta) {
    return toInteger(_mm_add_epi16(in, kDelta));
  }
#endif
};

template <>
struct RWTicketIntTrait<32> {
  typedef uint32_t FullInt;
  typedef uint16_t HalfInt;
  typedef uint8_t QuarterInt;

#ifdef RW_SPINLOCK_USE_SSE_INSTRUCTIONS_
  static __m128i make128(const uint8_t v[4]) {
    // clang-format off
    return _mm_set_epi8(
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        char(v[3]), char(v[2]), char(v[1]), char(v[0]));
    // clang-format on
  }
  static inline __m128i fromInteger(uint32_t from) {
    return _mm_cvtsi32_si128(int32_t(from));
  }
  static inline uint32_t toInteger(__m128i in) {
    return uint32_t(_mm_cvtsi128_si32(in));
  }
  static inline uint32_t addParallel(__m128i in, __m128i kDelta) {
    return toInteger(_mm_add_epi8(in, kDelta));
  }
#endif
};
} // namespace detail

template <size_t kBitWidth, bool kFavorWriter = false>
class RWTicketSpinLockT {
  typedef detail::RWTicketIntTrait<kBitWidth> IntTraitType;
  typedef typename detail::RWTicketIntTrait<kBitWidth>::FullInt FullInt;
  typedef typename detail::RWTicketIntTrait<kBitWidth>::HalfInt HalfInt;
  typedef typename detail::RWTicketIntTrait<kBitWidth>::QuarterInt QuarterInt;

  union RWTicket {
    constexpr RWTicket() : whole(0) {}
    FullInt whole;
    HalfInt readWrite;
    __extension__ struct {
      QuarterInt write;
      QuarterInt read;
      QuarterInt users;
    };
  } ticket;

 private: // Some x64-specific utilities for atomic access to ticket.
  template <class T>
  static T load_acquire(T* addr) {
    T t = *addr; // acquire barrier
    asm_volatile_memory();
    return t;
  }

  template <class T>
  static void store_release(T* addr, T v) {
    asm_volatile_memory();
    *addr = v; // release barrier
  }

 public:
  constexpr RWTicketSpinLockT() {}

  RWTicketSpinLockT(RWTicketSpinLockT const&) = delete;
  RWTicketSpinLockT& operator=(RWTicketSpinLockT const&) = delete;

  void lock() {
    if (kFavorWriter) {
      writeLockAggressive();
    } else {
      writeLockNice();
    }
  }

  /*
   * Both try_lock and try_lock_shared diverge in our implementation from the
   * lock algorithm described in the link above.
   *
   * In the read case, it is undesirable that the readers could wait
   * for another reader (before increasing ticket.read in the other
   * implementation).  Our approach gives up on
   * first-come-first-serve, but our benchmarks showed improve
   * performance for both readers and writers under heavily contended
   * cases, particularly when the number of threads exceeds the number
   * of logical CPUs.
   *
   * We have writeLockAggressive() using the original implementation
   * for a writer, which gives some advantage to the writer over the
   * readers---for that path it is guaranteed that the writer will
   * acquire the lock after all the existing readers exit.
   */
  bool try_lock() {
    RWTicket t;
    FullInt old = t.whole = load_acquire(&ticket.whole);
    if (t.users != t.write) {
      return false;
    }
    ++t.users;
    return __sync_bool_compare_and_swap(&ticket.whole, old, t.whole);
  }

  /*
   * Call this if you want to prioritize writer to avoid starvation.
   * Unlike writeLockNice, immediately acquires the write lock when
   * the existing readers (arriving before the writer) finish their
   * turns.
   */
  void writeLockAggressive() {
    // std::this_thread::yield() is needed here to avoid a pathology if the
    // number of threads attempting concurrent writes is >= the number of real
    // cores allocated to this process. This is less likely than the
    // corresponding situation in lock_shared(), but we still want to
    // avoid it
    uint_fast32_t count = 0;
    QuarterInt val = __sync_fetch_and_add(&ticket.users, 1);
    while (val != load_acquire(&ticket.write)) {
      asm_volatile_pause();
      if (UNLIKELY(++count > 1000)) {
        std::this_thread::yield();
      }
    }
  }

  // Call this when the writer should be nicer to the readers.
  void writeLockNice() {
    // Here it doesn't cpu-relax the writer.
    //
    // This is because usually we have many more readers than the
    // writers, so the writer has less chance to get the lock when
    // there are a lot of competing readers.  The aggressive spinning
    // can help to avoid starving writers.
    //
    // We don't worry about std::this_thread::yield() here because the caller
    // has already explicitly abandoned fairness.
    while (!try_lock()) {
    }
  }

  // Atomically unlock the write-lock from writer and acquire the read-lock.
  void unlock_and_lock_shared() {
    QuarterInt val = __sync_fetch_and_add(&ticket.read, 1);
  }

  // Release writer permission on the lock.
  void unlock() {
    RWTicket t;
    t.whole = load_acquire(&ticket.whole);

#ifdef RW_SPINLOCK_USE_SSE_INSTRUCTIONS_
    FullInt old = t.whole;
    // SSE2 can reduce the lock and unlock overhead by 10%
    static const QuarterInt kDeltaBuf[4] = {1, 1, 0, 0}; // write/read/user
    static const __m128i kDelta = IntTraitType::make128(kDeltaBuf);
    __m128i m = IntTraitType::fromInteger(old);
    t.whole = IntTraitType::addParallel(m, kDelta);
#else
    ++t.read;
    ++t.write;
#endif
    store_release(&ticket.readWrite, t.readWrite);
  }

  void lock_shared() {
    // std::this_thread::yield() is important here because we can't grab the
    // shared lock if there is a pending writeLockAggressive, so we
    // need to let threads that already have a shared lock complete
    uint_fast32_t count = 0;
    while (!LIKELY(try_lock_shared())) {
      asm_volatile_pause();
      if (UNLIKELY((++count & 1023) == 0)) {
        std::this_thread::yield();
      }
    }
  }

  bool try_lock_shared() {
    RWTicket t, old;
    old.whole = t.whole = load_acquire(&ticket.whole);
    old.users = old.read;
#ifdef RW_SPINLOCK_USE_SSE_INSTRUCTIONS_
    // SSE2 may reduce the total lock and unlock overhead by 10%
    static const QuarterInt kDeltaBuf[4] = {0, 1, 1, 0}; // write/read/user
    static const __m128i kDelta = IntTraitType::make128(kDeltaBuf);
    __m128i m = IntTraitType::fromInteger(old.whole);
    t.whole = IntTraitType::addParallel(m, kDelta);
#else
    ++t.read;
    ++t.users;
#endif
    return __sync_bool_compare_and_swap(&ticket.whole, old.whole, t.whole);
  }

  void unlock_shared() {
    __sync_fetch_and_add(&ticket.write, 1);
  }

  class WriteHolder;

  typedef RWTicketSpinLockT<kBitWidth, kFavorWriter> RWSpinLock;
  class ReadHolder {
   public:
    ReadHolder(ReadHolder const&) = delete;
    ReadHolder& operator=(ReadHolder const&) = delete;

    explicit ReadHolder(RWSpinLock* lock) : lock_(lock) {
      if (lock_) {
        lock_->lock_shared();
      }
    }

    explicit ReadHolder(RWSpinLock& lock) : lock_(&lock) {
      if (lock_) {
        lock_->lock_shared();
      }
    }

    // atomically unlock the write-lock from writer and acquire the read-lock
    explicit ReadHolder(WriteHolder* writer) : lock_(nullptr) {
      std::swap(this->lock_, writer->lock_);
      if (lock_) {
        lock_->unlock_and_lock_shared();
      }
    }

    ~ReadHolder() {
      if (lock_) {
        lock_->unlock_shared();
      }
    }

    void reset(RWSpinLock* lock = nullptr) {
      if (lock_) {
        lock_->unlock_shared();
      }
      lock_ = lock;
      if (lock_) {
        lock_->lock_shared();
      }
    }

    void swap(ReadHolder* other) {
      std::swap(this->lock_, other->lock_);
    }

   private:
    RWSpinLock* lock_;
  };

  class WriteHolder {
   public:
    WriteHolder(WriteHolder const&) = delete;
    WriteHolder& operator=(WriteHolder const&) = delete;

    explicit WriteHolder(RWSpinLock* lock) : lock_(lock) {
      if (lock_) {
        lock_->lock();
      }
    }
    explicit WriteHolder(RWSpinLock& lock) : lock_(&lock) {
      if (lock_) {
        lock_->lock();
      }
    }

    ~WriteHolder() {
      if (lock_) {
        lock_->unlock();
      }
    }

    void reset(RWSpinLock* lock = nullptr) {
      if (lock == lock_) {
        return;
      }
      if (lock_) {
        lock_->unlock();
      }
      lock_ = lock;
      if (lock_) {
        lock_->lock();
      }
    }

    void swap(WriteHolder* other) {
      std::swap(this->lock_, other->lock_);
    }

   private:
    friend class ReadHolder;
    RWSpinLock* lock_;
  };
};

typedef RWTicketSpinLockT<32> RWTicketSpinLock32;
typedef RWTicketSpinLockT<64> RWTicketSpinLock64;

#endif // RW_SPINLOCK_USE_X86_INTRINSIC_

} // namespace folly

#ifdef RW_SPINLOCK_USE_X86_INTRINSIC_
#undef RW_SPINLOCK_USE_X86_INTRINSIC_
#endif
