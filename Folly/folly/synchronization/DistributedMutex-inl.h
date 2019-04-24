/*
 * Copyright 2004-present Facebook, Inc.
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
#include <folly/synchronization/DistributedMutex.h>

#include <folly/CachelinePadded.h>
#include <folly/Likely.h>
#include <folly/Portability.h>
#include <folly/ScopeGuard.h>
#include <folly/Utility.h>
#include <folly/detail/Futex.h>
#include <folly/lang/Align.h>
#include <folly/portability/Asm.h>
#include <folly/synchronization/AtomicNotification.h>
#include <folly/synchronization/AtomicUtil.h>
#include <folly/synchronization/WaitOptions.h>
#include <folly/synchronization/detail/Sleeper.h>
#include <folly/synchronization/detail/Spin.h>

#include <glog/logging.h>

#include <atomic>
#include <cstdint>
#include <limits>
#include <stdexcept>
#include <thread>

namespace folly {
namespace detail {
namespace distributed_mutex {
// kUnlocked is used to show unlocked state
//
// When locking threads encounter kUnlocked in the underlying storage, they
// can just acquire the lock without any further effort
constexpr auto kUnlocked = std::uintptr_t{0b0};
// kLocked is used to show that the mutex is currently locked, and future
// attempts to lock the mutex should enqueue on the central storage
//
// Locking threads find this on central storage only when there is a
// contention chain that is undergoing wakeups, in every other case, a locker
// will either find kUnlocked or an arbitrary address with the kLocked bit set
constexpr auto kLocked = std::uintptr_t{0b1};
// kTimedWaiter is set when there is at least one timed waiter on the mutex
//
// Timed waiters do not follow the sleeping strategy employed by regular,
// non-timed threads.  They sleep on the central mutex atomic through an
// extended futex() interface that allows sleeping with the same semantics for
// non-standard integer widths
//
// When a regular non-timed thread unlocks or enqueues on the mutex, and sees
// a timed waiter, it takes ownership of all the timed waiters.  The thread
// that has taken ownership of the timed waiter releases the timed waiters
// when it gets a chance at the critical section.  At which point it issues a
// wakeup to single timed waiter, timed waiters always issue wake() calls to
// other timed waiters
constexpr auto kTimedWaiter = std::uintptr_t{0b10};

// kUninitialized means that the thread has just enqueued, and has not yet
// gotten to initializing itself with the address of its successor
//
// this becomes significant for threads that are trying to wake up the
// uninitialized thread, if they see that the thread is not yet initialized,
// they can do nothing but spin, and wait for the thread to get initialized
constexpr auto kUninitialized = std::uint32_t{0b0};
// kWaiting will be set in the waiter's futex structs while they are spinning
// while waiting for the mutex
constexpr auto kWaiting = std::uint32_t{0b1};
// kWake will be set by threads that are waking up waiters that have enqueued
constexpr auto kWake = std::uint32_t{0b10};
// kSkipped will be set by a waker when they see that a waiter has been
// preempted away by the kernel, in this case the thread that got skipped will
// have to wake up and put itself back on the queue
constexpr auto kSkipped = std::uint32_t{0b11};
// kAboutToWait will be set by a waiter that enqueues itself with the purpose
// of waiting on a futex
constexpr auto kAboutToWait = std::uint32_t{0b100};
// kSleeping will be set by a waiter right before enqueueing on a futex.  When
// a thread wants to wake up a waiter that has enqueued on a futex, it should
// set the futex to contain kWake
//
// a thread that is unlocking and wants to skip over a sleeping thread also
// calls futex_.exchange(kSleeping) on the sleeping thread's futex word.  It
// does this to 1. detect whether the sleeping thread had actually gone to
// sleeping on the futex word so it can skip it, and 2. to synchronize with
// other non atomic writes in the sleeping thread's context (such as the write
// to track the next waiting thread).
//
// We reuse kSleeping instead of say using another constant kEarlyDelivery to
// avoid situations where a thread has to enter kernel mode due to calling
// futexWait() twice because of the presence of a waking thread.  This
// situation can arise when an unlocking thread goes to skip over a sleeping
// thread, sees that the thread has slept and move on, but the sleeping thread
// had not yet entered futex().  This interleaving causes the thread calling
// futex() to return spuriously, as the futex word is not what it should be
constexpr auto kSleeping = std::uint32_t{0b101};

// The number of spins that we are allowed to do before we resort to marking a
// thread as having slept
//
// This is just a magic number from benchmarks
constexpr auto kScheduledAwaySpinThreshold = std::chrono::nanoseconds{200};
// The maximum number of spins before a thread starts yielding its processor
// in hopes of getting skipped
constexpr auto kMaxSpins = 4000;

/**
 * Write only data that is available to the thread that is waking up another.
 * Only the waking thread is allowed to write to this, the thread to be woken
 * is allowed to read from this after a wakeup has been issued
 *
 * Because of the write only semantics of the data here, acquire-release (or
 * stronger) memory ordering is needed to write to this
 */
class WakerMetadata {
 public:
  // This is the thread that initiated wakeups for the contention chain.
  // There can only ever be one thread that initiates the wakeup for a
  // chain in the spin only version of this mutex.  When a thread that just
  // woke up sees this as the next thread to wake up, it knows that it is the
  // terminal node in the contention chain.  This means that it was the one
  // that took off the thread that had acquired the mutex off the centralized
  // state.  Therefore, the current thread is the last in it's contention
  // chain.  It will fall back to centralized storage to pick up the next
  // waiter or release the mutex
  //
  // When we move to a full sleeping implementation, this might need to change
  // to a small_vector<> to account for failed wakeups, or we can put threads
  // to sleep on the central futex, which is an easier implementation
  // strategy.  Although, since this is allocated on the stack, we can set a
  // prohitively large threshold to avoid heap allocations, this strategy
  // however, might cause increased cache misses on wakeup signalling
  std::uintptr_t waker_{0};
};

/**
 * Waiter encapsulates the state required for waiting on the mutex, this
 * contains potentially heavy state and is intended to be allocated on the
 * stack as part of a lock() function call
 */
template <template <typename> class Atomic>
class Waiter {
 public:
  explicit Waiter(std::uint64_t futex) : futex_{futex} {}

  // the atomic that this thread will spin on while waiting for the mutex to
  // be unlocked
  Atomic<std::uint64_t> futex_{kUninitialized};
  // metadata for the waker
  WakerMetadata wakerMetadata_{};
  // The successor of this node.  This will be the thread that had its address
  // on the mutex previously
  std::uintptr_t next_{0};
  // the list of threads that the waker had previously seen to be sleeping on
  // a futex(),
  //
  // this is given to the current thread as a means to pass on
  // information.  When the current thread goes to unlock the mutex and does
  // not see contention, it should go and wake up the head of this list.  If
  // the current thread sees a contention chain on the mutex, it should pass
  // on this list to the next thread that gets woken up
  std::uintptr_t waiters_{0};
  // The futex that this waiter will sleep on
  //
  // how can we reuse futex_ from above for futex management?
  Futex<Atomic> sleeper_{kUninitialized};
};

/**
 * Get the time since epoch in nanoseconds
 *
 * This is faster than std::chrono::steady_clock because it avoids a VDSO
 * access to get the timestamp counter
 *
 * Note that the hardware timestamp counter on x86, like std::steady_clock is
 * guaranteed to be monotonically increasing -
 * https://c9x.me/x86/html/file_module_x86_id_278.html
 */
inline std::chrono::nanoseconds time() {
  return std::chrono::nanoseconds{asm_rdtsc()};
}

/**
 * Zero out the other bits used by the implementation and return just an
 * address from a uintptr_t
 */
template <typename Type>
Type* extractAddress(std::uintptr_t from) {
  // shift one bit off the end, to get all 1s followed by a single 0
  auto mask = std::numeric_limits<std::uintptr_t>::max();
  mask >>= 1;
  mask <<= 1;
  CHECK(!(mask & 0b1));

  return reinterpret_cast<Type*>(from & mask);
}

/**
 * Strips the given nanoseconds into only the least significant 56 bits by
 * moving the least significant 56 bits over by 8 zeroing out the bottom 8
 * bits to be used as a medium of information transfer for the thread wait
 * nodes
 */
inline std::uint64_t strip(std::chrono::nanoseconds t) {
  auto time = t.count();
  return time << 8;
}

/**
 * Recover the timestamp value from an integer that has the timestamp encoded
 * in it
 */
inline std::uint64_t recover(std::uint64_t from) {
  return from >> 8;
}

template <template <typename> class Atomic, bool TimePublishing>
class DistributedMutex<Atomic, TimePublishing>::DistributedMutexStateProxy {
 public:
  /// DistributedMutexStateProxy is movable, so the caller can contain their
  /// critical section by moving the proxy around
  DistributedMutexStateProxy(DistributedMutexStateProxy&& other)
      : next_{exchange(other.next_, nullptr)},
        expected_{exchange(other.expected_, 0)},
        wakerMetadata_{exchange(other.wakerMetadata_, {})},
        waiters_{exchange(other.waiters_, nullptr)},
        ready_{exchange(other.ready_, nullptr)} {}

  /// The proxy is valid when a mutex acquisition attempt was successful,
  /// lock() is guaranteed to return a valid proxy, try_lock() is not
  explicit operator bool() const {
    return expected_;
  }

  // private:
  /// friend the mutex class, since that will be accessing state private to
  /// this class
  friend class DistributedMutex<Atomic, TimePublishing>;

  DistributedMutexStateProxy(
      CachelinePadded<Waiter<Atomic>>* next,
      std::uintptr_t expected,
      bool timedWaiter = false,
      WakerMetadata wakerMetadata = {},
      CachelinePadded<Waiter<Atomic>>* waiters = nullptr,
      CachelinePadded<Waiter<Atomic>>* ready = nullptr)
      : next_{next},
        expected_{expected},
        timedWaiters_{timedWaiter},
        wakerMetadata_{wakerMetadata},
        waiters_{waiters},
        ready_{ready} {}

  // the next thread that is to be woken up, this being null at the time of
  // unlock() shows that the current thread acquired the mutex without
  // contention or it was the terminal thread in the queue of threads waking up
  CachelinePadded<Waiter<Atomic>>* next_{nullptr};
  // this is the value that the current thread should expect to find on
  // unlock, and if this value is not there on unlock, the current thread
  // should assume that other threads are enqueued waiting for the mutex
  //
  // note that if the mutex has the same state set at unlock time, and this is
  // set to an address (and not say kLocked in the case of a terminal waker)
  // then it must have been the case that no other thread had enqueued itself,
  // since threads in the domain of this mutex do not share stack space
  //
  // if we want to support stack sharing, we can solve the problem by looping
  // at lock time, and setting a variable that says whether we have acquired
  // the lock or not perhaps
  std::uintptr_t expected_{0};
  // a boolean that will be set when the mutex has timed waiters that the
  // current thread is responsible for waking, in such a case, the current
  // thread will issue an atomic_notify_one() call after unlocking the mutex
  //
  // note that a timed waiter will itself always have this flag set.  This is
  // done so we can avoid having to issue a atomic_notify_all() call (and
  // subsequently a thundering herd) when waking up timed-wait threads
  bool timedWaiters_{false};
  // metadata passed along from the thread that woke this thread up
  WakerMetadata wakerMetadata_{};
  // the list of threads that are waiting on a futex
  //
  // the current threads is meant to wake up this list of waiters if it is
  // able to commit an unlock() on the mutex without seeing a contention chain
  CachelinePadded<Waiter<Atomic>>* waiters_{nullptr};
  // after a thread has woken up from a futex() call, it will have the rest of
  // the threads that it were waiting behind it in this list, a thread that
  // unlocks has to wake up threads from this list if it has any, before it
  // goes to sleep to prevent pathological unfairness
  CachelinePadded<Waiter<Atomic>>* ready_{nullptr};
};

template <template <typename> class Atomic, bool TimePublishing>
DistributedMutex<Atomic, TimePublishing>::DistributedMutex()
    : state_{kUnlocked} {}

template <typename Waiter>
bool spin(Waiter& waiter) {
  auto spins = 0;
  while (true) {
    // publish our current time in the futex as a part of the spin waiting
    // process
    //
    // if we are under the maximum number of spins allowed before sleeping, we
    // publish the exact timestamp, otherwise we publish the minimum possible
    // timestamp to force the waking thread to skip us
    ++spins;
    auto now = (spins < kMaxSpins) ? time() : decltype(time())::zero();
    auto data = strip(now) | kWaiting;
    auto signal = waiter.futex_.exchange(data, std::memory_order_acq_rel);
    signal &= std::numeric_limits<std::uint8_t>::max();

    // if we got skipped, make a note of it and return if we got a skipped
    // signal or a signal to wake up
    auto skipped = signal == kSkipped;
    if (skipped || (signal == kWake)) {
      return !skipped;
    }

    // if we are under the spin threshold, pause to allow the other
    // hyperthread to run.  If not, then sleep
    if (spins < kMaxSpins) {
      asm_volatile_pause();
    } else {
      Sleeper::sleep();
    }
  }
}

template <typename Waiter>
void doFutexWake(Waiter* waiter) {
  if (waiter) {
    // We can use a simple store operation here and not worry about checking
    // to see if the thread had actually started waiting on the futex, that is
    // already done in tryWake() when a sleeping thread is collected
    //
    // We now do not know whether the waiter had already enqueued on the futex
    // or whether it had just stored kSleeping in its futex and was about to
    // call futexWait().  We treat both these scenarios the same
    //
    // the below can theoretically cause a problem if we set the
    // wake signal and the waiter was in between setting kSleeping in its
    // futex and enqueueing on the futex.  In this case the waiter will just
    // return from futexWait() immediately.  This leaves the address that the
    // waiter was using for futexWait() possibly dangling, and the thread that
    // we woke in the exchange above might have used that address for some
    // other object
    //
    // however, even if the thread had indeed woken up simply becasue of the
    // above exchange(), the futexWake() below is not incorrect.  It is not
    // incorrect because futexWake() does not actually change the memory of
    // the futex word.  It just uses the address to do a lookup in the kernel
    // futex table.  And even if we call futexWake() on some other address,
    // and that address was being used to wait on futex() that thread will
    // protect itself from spurious wakeups, check the value in the futex word
    // and enqueue itself back on the futex
    //
    // this dangilng pointer possibility is why we use a pointer to the futex
    // word, and avoid dereferencing after the store() operation
    auto sleeper = &(*waiter)->sleeper_;
    sleeper->store(kWake, std::memory_order_release);
    futexWake(sleeper, 1);
  }
}

template <typename Waiter>
bool doFutexWait(Waiter* waiter, Waiter*& next) {
  // first we get ready to sleep by calling exchange() on the futex with a
  // kSleeping value
  DCHECK((*waiter)->futex_.load(std::memory_order_relaxed) == kAboutToWait);

  // note the semantics of using a futex here, when we exchange the sleeper_
  // with kSleeping, we are getting ready to sleep, but before sleeping we get
  // ready to sleep, and we return from futexWait() when the value of
  // sleeper_ might have changed.  We can also wake up because of a spurious
  // wakeup, so we always check against the value in sleeper_ after returning
  // from futexWait(), if the value is not kWake, then we continue
  auto pre = (*waiter)->sleeper_.exchange(kSleeping, std::memory_order_acq_rel);

  // Seeing a kSleeping on a futex word before we set it ourselves means only
  // one thing - an unlocking thread caught us before we went to futex(), and
  // we now have the lock, so we abort
  //
  // if we were given an early delivery, we can return from this function with
  // a true, meaning that we now have the lock
  if (pre == kSleeping) {
    return true;
  }

  // if we reach here then were were not given an early delivery, and any
  // thread that goes to wake us up will see a consistent view of the rest of
  // the contention chain (since the next_ variable is set before the
  // kSleeping exchange above)
  while (pre != kWake) {
    // before enqueueing on the futex, we wake any waiters that we were
    // possibly responsible for
    doFutexWake(exchange(next, nullptr));

    // then we wait on the futex
    //
    // note that we have to protect ourselves against spurious wakeups here.
    // Because the corresponding futexWake() above does not synchronize
    // wakeups around the futex word.  Because doing so would become
    // inefficient
    futexWait(&(*waiter)->sleeper_, kSleeping);
    pre = (*waiter)->sleeper_.load(std::memory_order_acquire);
    DCHECK((pre == kSleeping) || (pre == kWake));
  }

  // when coming out of a futex, we might have some other sleeping threads
  // that we were supposed to wake up, assign that to the next pointer
  DCHECK(next == nullptr);
  next = extractAddress<Waiter>((*waiter)->next_);
  return false;
}

template <typename Waiter>
bool wait(Waiter* waiter, bool shouldSleep, Waiter*& next) {
  if (shouldSleep) {
    return doFutexWait(waiter, next);
  }

  return spin(**waiter);
}

inline void recordTimedWaiterAndClearTimedBit(
    bool& timedWaiter,
    std::uintptr_t& previous) {
  // the previous value in the mutex can never be kTimedWaiter, timed waiters
  // always set (kTimedWaiter | kLocked) in the mutex word when they try and
  // acquire the mutex
  DCHECK(previous != kTimedWaiter);

  if (UNLIKELY(previous & kTimedWaiter)) {
    // record whether there was a timed waiter in the previous mutex state, and
    // clear the timed bit from the previous state
    timedWaiter = true;
    previous = previous & (~kTimedWaiter);
  }
}

template <template <typename> class Atomic, bool TimePublishing>
typename DistributedMutex<Atomic, TimePublishing>::DistributedMutexStateProxy
DistributedMutex<Atomic, TimePublishing>::lock() {
  // first try and acquire the lock as a fast path, the underlying
  // implementation is slightly faster than using std::atomic::exchange() as
  // is used in this function.  So we get a small perf boost in the
  // uncontended case
  if (auto state = try_lock()) {
    return state;
  }

  auto previous = std::uintptr_t{0};
  auto waitMode = kUninitialized;
  auto nextWaitMode = kAboutToWait;
  auto timedWaiter = false;
  CachelinePadded<Waiter<Atomic>>* nextSleeper = nullptr;
  while (true) {
    // construct the state needed to wait
    auto&& state = CachelinePadded<Waiter<Atomic>>{waitMode};
    auto&& address = reinterpret_cast<std::uintptr_t>(&state);
    DCHECK(!(address & 0b1));

    // set the locked bit in the address we will be persisting in the mutex
    address |= kLocked;

    // attempt to acquire the mutex, mutex acquisition is successful if the
    // previous value is zeroed out
    //
    // we use memory_order_acq_rel here because we want the read-modify-write
    // operation to be both acquire and release.  Acquire becasue if this is a
    // successful lock acquisition, we want to acquire state any other thread
    // has released from a prior unlock.  We want release semantics becasue
    // other threads that read the address of this value should see the full
    // well-initialized node we are going to wait on if the mutex acquisition
    // was unsuccessful
    previous = state_.exchange(address, std::memory_order_acq_rel);
    recordTimedWaiterAndClearTimedBit(timedWaiter, previous);
    state->next_ = previous;
    if (previous == kUnlocked) {
      return {nullptr, address, timedWaiter, {}, nullptr, nextSleeper};
    }
    DCHECK(previous & kLocked);

    // wait until we get a signal from another thread, if this returns false,
    // we got skipped and had probably been scheduled out, so try again
    if (!wait(&state, (waitMode == kAboutToWait), nextSleeper)) {
      std::swap(waitMode, nextWaitMode);
      continue;
    }

    // at this point it is safe to access the other fields in the waiter state,
    // since the thread that woke us up is gone and nobody will be touching this
    // state again, note that this requires memory ordering, and this is why we
    // use memory_order_acquire (among other reasons) in the above wait
    //
    // first we see if the value we took off the mutex state was the thread that
    // initated the wakeups, if so, we are the terminal node of the current
    // contention chain.  If we are the terminal node, then we should expect to
    // see a kLocked in the mutex state when we unlock, if we see that, we can
    // commit the unlock to the centralized mutex state.  If not, we need to
    // continue wakeups
    //
    // a nice consequence of passing kLocked as the current address if we are
    // the terminal node is that it naturally just works with the algorithm.  If
    // we get a contention chain when coming out of a contention chain, the tail
    // of the new contention chain will have kLocked set as the previous, which,
    // as it happens "just works", since we have now established a recursive
    // relationship until broken
    auto next = previous;
    auto expected = address;
    if (previous == state->wakerMetadata_.waker_) {
      next = 0;
      expected = kLocked;
    }

    // if we are just coming out of a futex call, then it means that the next
    // waiter we are responsible for is also a waiter waiting on a futex, so
    // we return that list in the list of ready threads.  We wlil be waking up
    // the ready threads on unlock no matter what
    return {extractAddress<CachelinePadded<Waiter<Atomic>>>(next),
            expected,
            timedWaiter,
            state->wakerMetadata_,
            extractAddress<CachelinePadded<Waiter<Atomic>>>(state->waiters_),
            nextSleeper};
  }
}

inline bool preempted(std::uint64_t value) {
  auto currentTime = recover(strip(time()));
  auto nodeTime = recover(value);
  auto preempted = currentTime > nodeTime + kScheduledAwaySpinThreshold.count();

  // we say that the thread has been preempted if its timestamp says so, and
  // also if it is neither uninitialized nor skipped
  DCHECK(value != kSkipped);
  return (preempted) && (value != kUninitialized);
}

inline bool isSleeper(std::uintptr_t value) {
  return (value == kAboutToWait);
}

template <typename Waiter>
std::uintptr_t tryWake(
    bool publishing,
    Waiter* waiter,
    std::uintptr_t value,
    WakerMetadata metadata,
    Waiter*& sleepers) {
  // first we see if we can wake the current thread that is spinning
  if ((!publishing || !preempted(value)) && !isSleeper(value)) {
    // we need release here because of the write to wakerMetadata_
    (*waiter)->wakerMetadata_ = metadata;
    (*waiter)->waiters_ = reinterpret_cast<std::uintptr_t>(sleepers);
    (*waiter)->futex_.store(kWake, std::memory_order_release);
    return 0;
  }

  // if the thread is not a sleeper, and we were not able to catch it before
  // preemption, we can just return a false, it is safe to read next_ because
  // the thread was preempted.  Preemption signals can only come after the
  // thread has set the next_ pointer, since the timestamp writes only start
  // occurring after that point
  //
  // if a thread was preempted it must have stored next_ in the waiter struct,
  // as the store to futex_ that resets the value from kUninitialized happens
  // after the write to next
  CHECK(publishing);
  if (!isSleeper(value)) {
    // go on to the next one
    //
    // Also, we need a memory_order_release here to prevent missed wakeups.  A
    // missed wakeup here can happen when we see that a thread had been
    // preempted and skip it.  Then go on to release the lock, and then when
    // the thread which got skipped does an exchange on the central storage,
    // still sees the locked bit, and never gets woken up
    //
    // Can we relax this?
    DCHECK(preempted(value));
    auto next = (*waiter)->next_;
    (*waiter)->futex_.store(kSkipped, std::memory_order_release);
    return next;
  }

  // if we are here the thread is a sleeper
  //
  // we attempt to catch the thread before it goes to futex().  If we are able
  // to catch the thread before it sleeps on a futex, we are done, and don't
  // need to go any further
  //
  // if we are not able to catch the thread before it goes to futex, we
  // collect the current thread in the list of sleeping threads represented by
  // sleepers, and return the next thread in the list and return false along
  // with the previous next value
  //
  // it is safe to read the next_ pointer in the waiter struct if we were
  // unable to catch the thread before it went to futex() because we use
  // acquire-release ordering for the exchange operation below.  And if we see
  // that the thread was already sleeping, we have synchronized with the write
  // to next_ in the context of the sleeping thread
  //
  // Also we need to set the value of waiters_ and wakerMetadata_ in the
  // thread before doing the exchange because we need to pass on the list of
  // sleepers in the event that we were able to catch the thread before it
  // went to futex().  If we were unable to catch the thread before it slept,
  // these fields will be ignored when the thread wakes up anyway
  DCHECK(isSleeper(value));
  (*waiter)->wakerMetadata_ = metadata;
  (*waiter)->waiters_ = reinterpret_cast<std::uintptr_t>(sleepers);
  auto pre = (*waiter)->sleeper_.exchange(kSleeping, std::memory_order_acq_rel);

  // we were able to catch the thread before it went to sleep, return true
  if (pre != kSleeping) {
    return 0;
  }

  // otherwise return false, with the value of next_, it is safe to read next
  // because of the same logic as when a thread was preempted
  //
  // we also need to collect this sleeper in the list of sleepers being built
  // up
  auto next = (*waiter)->next_;
  (*waiter)->next_ = reinterpret_cast<std::uintptr_t>(sleepers);
  sleepers = waiter;
  return next;
}

template <typename Waiter>
bool wake(
    bool publishing,
    Waiter& waiter,
    WakerMetadata metadata,
    Waiter*& sleepers) {
  // loop till we find a node that is either at the end of the list (as
  // specified by metadata) or we find a node that is active (as specified by
  // the last published timestamp of the node)
  auto current = &waiter;
  while (current) {
    auto value = (*current)->futex_.load(std::memory_order_acquire);
    auto next = tryWake(publishing, current, value, metadata, sleepers);
    if (!next) {
      return true;
    }

    // we need to read the value of the next node in the list before skipping
    // it, this is because after we skip it the node might wake up and enqueue
    // itself, and thereby gain a new next node
    CHECK(publishing);
    current =
        (next == metadata.waker_) ? nullptr : extractAddress<Waiter>(next);
  }

  return false;
}

template <typename Atomic>
void wakeTimedWaiters(Atomic* state, bool timedWaiters) {
  if (UNLIKELY(timedWaiters)) {
    atomic_notify_one(state);
  }
}

template <typename Atomic, typename Proxy, typename Sleepers>
bool tryUnlockClean(Atomic& state, Proxy& proxy, Sleepers sleepers) {
  auto expected = proxy.expected_;
  while (true) {
    if (state.compare_exchange_strong(
            expected,
            kUnlocked,
            std::memory_order_release,
            std::memory_order_relaxed)) {
      // if we were able to commit an unlocked, we need to wake up the futex
      // waiters, if any
      doFutexWake(sleepers);
      return true;
    }

    // if we failed the compare_exchange_strong() above, we check to see if
    // the failure was because of the presence of a timed waiter.  If that
    // was the case then we try one more time with the kTimedWaiter bit set
    if (UNLIKELY(expected == (proxy.expected_ | kTimedWaiter))) {
      proxy.timedWaiters_ = true;
      continue;
    }

    // otherwise break, we have a contention chain
    return false;
  }
}

template <template <typename> class Atomic, bool Publish>
void DistributedMutex<Atomic, Publish>::unlock(
    DistributedMutex::DistributedMutexStateProxy proxy) {
  // we always wake up ready threads and timed waiters if we saw either
  DCHECK(proxy) << "Invalid proxy passed to DistributedMutex::unlock()";
  SCOPE_EXIT {
    doFutexWake(proxy.ready_);
    wakeTimedWaiters(&state_, proxy.timedWaiters_);
  };

  // if there is a wait queue we are responsible for, try and start wakeups,
  // don't bother with the mutex state
  auto sleepers = proxy.waiters_;
  if (proxy.next_) {
    if (wake(Publish, *proxy.next_, proxy.wakerMetadata_, sleepers)) {
      return;
    }

    // At this point, if are in the if statement, we were not the terminal
    // node of the wakeup chain.  Terminal nodes have the next_ pointer set to
    // null in lock()
    //
    // So we need to pretend we were the end of the contention chain.  Coming
    // out of a contention chain always has the kLocked state set in the
    // mutex.  Unless there is another contention chain lined up, which does
    // not matter since we are the terminal node anyway
    proxy.expected_ = kLocked;
  }

  while (true) {
    // otherwise, since we don't have anyone we need to wake up, we try and
    // release the mutex just as is
    //
    // if this is successful, we can return, the unlock was successful, we have
    // committed a nice kUnlocked to the central storage, yay
    if (tryUnlockClean(state_, proxy, sleepers)) {
      return;
    }

    // here we have a contention chain built up on the mutex.  We grab the
    // wait queue and start executing wakeups.  We leave a locked bit on the
    // centralized storage and handoff control to the head of the queue
    //
    // we use memory_order_acq_rel here because we want to see the
    // full well-initialized node that the other thread is waiting on
    //
    // If we are unable to wake the contention chain, it is possible that when
    // we come back to looping here, a new contention chain will form.  In
    // that case we need to use kLocked as the waker_ value because the
    // terminal node of the new chain will see kLocked in the central storage
    auto head = state_.exchange(kLocked, std::memory_order_acq_rel);
    recordTimedWaiterAndClearTimedBit(proxy.timedWaiters_, head);
    auto next = extractAddress<CachelinePadded<Waiter<Atomic>>>(head);
    DCHECK((head & kLocked) && (head != kLocked)) << "incorrect state " << head;
    if (wake(Publish, *next, {exchange(proxy.expected_, kLocked)}, sleepers)) {
      break;
    }
  }
}

template <template <typename> class Atomic, bool TimePublishing>
typename DistributedMutex<Atomic, TimePublishing>::DistributedMutexStateProxy
DistributedMutex<Atomic, TimePublishing>::try_lock() {
  // Try and set the least significant bit of the centralized lock state to 1,
  // indicating locked.
  //
  // If this succeeds, it must have been the case that we had a kUnlocked (or
  // 0) in the centralized storage before, since that is the only case where a
  // 0 can be found.  So we assert that in debug mode
  //
  // If this fails, then it is a no-op
  auto previous = atomic_fetch_set(state_, 0, std::memory_order_acquire);
  if (!previous) {
    return {nullptr, kLocked};
  }

  return {nullptr, 0};
}

template <typename Atomic, typename Deadline, typename MakeProxy>
auto timedLock(Atomic& state, Deadline deadline, MakeProxy proxy) {
  while (true) {
    // we put a bit on the central state to show that there is a timed waiter
    // and go to sleep on the central state
    //
    // when this thread goes to unlock the mutex, it will expect a 0b1 in the
    // mutex state (0b1, not 0b11), but then it will see that the value in the
    // mutex state is 0b11 and not 0b1, meaning that there might have been
    // another timed waiter.  Even though there might not have been another
    // timed waiter in the time being.  This sort of missed wakeup is
    // desirable for timed waiters; it helps avoid thundering herds of timed
    // waiters.  Because the mutex is packed in 8 bytes, and we need an
    // address to be stored in those 8 bytes, we don't have much room to play
    // with.  The only other solution is to issue a futexWake(INT_MAX) to wake
    // up all waiters when a clean unlock is committed, when a thread saw a
    // timed waiter in the mutex previously.
    //
    // putting a 0b11 here works for a set of reasons that is a superset of
    // the set of reasons that make it okay to put a kLocked (0b1) in the
    // mutex state.  Now that the thread has put (kTimedWaiter | kLocked)
    // (0b11) in the mutex state and it expects a kLocked (0b1), there are two
    // scenarios possible.  The first being when there is no contention chain
    // formation in the mutex from the time a timed waiter got a lock to
    // unlock.  In this case, the unlocker sees a 0b11 in the mutex state,
    // adjusts to the presence of a timed waiter and cleanly unlocks with a
    // kUnlocked (0b0).  The second is when there is a contention chain.
    // When a thread puts its address in the mutex and sees the timed bit, it
    // records the presence of a timed waiter, and then pretends as if it
    // hadn't seen the timed bit.  So future contention chain releases, will
    // terminate with a kLocked (0b1) and not a (kLocked | kTimedWaiter)
    // (0b11).  This just works naturally with the rest of the algorithm
    // without incurring a perf hit for the regular non-timed case
    //
    // this strategy does however mean, that when threads try to acquire the
    // mutex and all time out, there will be a wasteful syscall to issue wakeups
    // to waiting threads.  We don't do anything to try and minimize this
    //
    // we need to use a fetch_or() here because we need to convey two bits of
    // information - 1, whether the mutex is locked or not, and 2, whether
    // there is a timed waiter.  The alternative here is to use the second bit
    // to convey information only, we can use a fetch_set() on the second bit
    // to make this faster, but that comes at the expense of requiring regular
    // fast path lock attempts.  Which use a single bit read-modify-write for
    // better performance
    auto data = kTimedWaiter | kLocked;
    auto previous = state.fetch_or(data, std::memory_order_acquire);
    if (!(previous & 0b1)) {
      DCHECK(!previous);
      return proxy(nullptr, kLocked, true);
    }

    // wait on the futex until signalled, if we get a timeout, the try_lock
    // fails
    auto result = atomic_wait_until(&state, previous | data, deadline);
    if (result == std::cv_status::timeout) {
      return proxy(nullptr, std::uintptr_t{0}, false);
    }
  }
}

template <template <typename> class Atomic, bool TimePublishing>
template <typename Clock, typename Duration>
typename DistributedMutex<Atomic, TimePublishing>::DistributedMutexStateProxy
DistributedMutex<Atomic, TimePublishing>::try_lock_until(
    const std::chrono::time_point<Clock, Duration>& deadline) {
  // fast path for the uncontended case
  //
  // we get the time after trying to acquire the mutex because in the
  // uncontended case, the price of getting the time is about 1/3 of the
  // actual mutex acquisition.  So we only pay the price of that extra bit of
  // latency when needed
  //
  // this is even higher when VDSO is involved on architectures that do not
  // offer a direct interface to the timestamp counter
  if (auto state = try_lock()) {
    return state;
  }

  // fall back to the timed locking algorithm
  using Proxy = DistributedMutexStateProxy;
  return timedLock(state_, deadline, [](auto... as) { return Proxy{as...}; });
}

template <template <typename> class Atomic, bool TimePublishing>
template <typename Rep, typename Period>
typename DistributedMutex<Atomic, TimePublishing>::DistributedMutexStateProxy
DistributedMutex<Atomic, TimePublishing>::try_lock_for(
    const std::chrono::duration<Rep, Period>& duration) {
  // fast path for the uncontended case.  Reasoning for doing this here is the
  // same as in try_lock_until()
  if (auto state = try_lock()) {
    return state;
  }

  // fall back to the timed locking algorithm
  using Proxy = DistributedMutexStateProxy;
  auto deadline = std::chrono::steady_clock::now() + duration;
  return timedLock(state_, deadline, [](auto... as) { return Proxy{as...}; });
}
} // namespace distributed_mutex
} // namespace detail
} // namespace folly
