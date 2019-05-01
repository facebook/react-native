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
#include <atomic>
#include <cassert>
#include <cstring>
#include <limits>
#include <type_traits>

#include <boost/noncopyable.hpp>

#include <folly/Traits.h>
#include <folly/concurrency/CacheLocality.h>
#include <folly/detail/TurnSequencer.h>
#include <folly/portability/Unistd.h>

namespace folly {

namespace detail {

template <typename T, template <typename> class Atom>
struct SingleElementQueue;

template <typename T>
class MPMCPipelineStageImpl;

/// MPMCQueue base CRTP template
template <typename>
class MPMCQueueBase;

} // namespace detail

/// MPMCQueue<T> is a high-performance bounded concurrent queue that
/// supports multiple producers, multiple consumers, and optional blocking.
/// The queue has a fixed capacity, for which all memory will be allocated
/// up front.  The bulk of the work of enqueuing and dequeuing can be
/// performed in parallel.
///
/// MPMCQueue is linearizable.  That means that if a call to write(A)
/// returns before a call to write(B) begins, then A will definitely end up
/// in the queue before B, and if a call to read(X) returns before a call
/// to read(Y) is started, that X will be something from earlier in the
/// queue than Y.  This also means that if a read call returns a value, you
/// can be sure that all previous elements of the queue have been assigned
/// a reader (that reader might not yet have returned, but it exists).
///
/// The underlying implementation uses a ticket dispenser for the head and
/// the tail, spreading accesses across N single-element queues to produce
/// a queue with capacity N.  The ticket dispensers use atomic increment,
/// which is more robust to contention than a CAS loop.  Each of the
/// single-element queues uses its own CAS to serialize access, with an
/// adaptive spin cutoff.  When spinning fails on a single-element queue
/// it uses futex()'s _BITSET operations to reduce unnecessary wakeups
/// even if multiple waiters are present on an individual queue (such as
/// when the MPMCQueue's capacity is smaller than the number of enqueuers
/// or dequeuers).
///
/// In benchmarks (contained in tao/queues/ConcurrentQueueTests)
/// it handles 1 to 1, 1 to N, N to 1, and N to M thread counts better
/// than any of the alternatives present in fbcode, for both small (~10)
/// and large capacities.  In these benchmarks it is also faster than
/// tbb::concurrent_bounded_queue for all configurations.  When there are
/// many more threads than cores, MPMCQueue is _much_ faster than the tbb
/// queue because it uses futex() to block and unblock waiting threads,
/// rather than spinning with sched_yield.
///
/// NOEXCEPT INTERACTION: tl;dr; If it compiles you're fine.  Ticket-based
/// queues separate the assignment of queue positions from the actual
/// construction of the in-queue elements, which means that the T
/// constructor used during enqueue must not throw an exception.  This is
/// enforced at compile time using type traits, which requires that T be
/// adorned with accurate noexcept information.  If your type does not
/// use noexcept, you will have to wrap it in something that provides
/// the guarantee.  We provide an alternate safe implementation for types
/// that don't use noexcept but that are marked folly::IsRelocatable
/// and std::is_nothrow_constructible, which is common for folly types.
/// In particular, if you can declare FOLLY_ASSUME_FBVECTOR_COMPATIBLE
/// then your type can be put in MPMCQueue.
///
/// If you have a pool of N queue consumers that you want to shut down
/// after the queue has drained, one way is to enqueue N sentinel values
/// to the queue.  If the producer doesn't know how many consumers there
/// are you can enqueue one sentinel and then have each consumer requeue
/// two sentinels after it receives it (by requeuing 2 the shutdown can
/// complete in O(log P) time instead of O(P)).
template <
    typename T,
    template <typename> class Atom = std::atomic,
    bool Dynamic = false>
class MPMCQueue : public detail::MPMCQueueBase<MPMCQueue<T, Atom, Dynamic>> {
  friend class detail::MPMCPipelineStageImpl<T>;
  using Slot = detail::SingleElementQueue<T, Atom>;

 public:
  explicit MPMCQueue(size_t queueCapacity)
      : detail::MPMCQueueBase<MPMCQueue<T, Atom, Dynamic>>(queueCapacity) {
    this->stride_ = this->computeStride(queueCapacity);
    this->slots_ = new Slot[queueCapacity + 2 * this->kSlotPadding];
  }

  MPMCQueue() noexcept {}
};

/// The dynamic version of MPMCQueue allows dynamic expansion of queue
/// capacity, such that a queue may start with a smaller capacity than
/// specified and expand only if needed. Users may optionally specify
/// the initial capacity and the expansion multiplier.
///
/// The design uses a seqlock to enforce mutual exclusion among
/// expansion attempts. Regular operations read up-to-date queue
/// information (slots array, capacity, stride) inside read-only
/// seqlock sections, which are unimpeded when no expansion is in
/// progress.
///
/// An expansion computes a new capacity, allocates a new slots array,
/// and updates stride. No information needs to be copied from the
/// current slots array to the new one. When this happens, new slots
/// will not have sequence numbers that match ticket numbers. The
/// expansion needs to compute a ticket offset such that operations
/// that use new arrays can adjust the calculations of slot indexes
/// and sequence numbers that take into account that the new slots
/// start with sequence numbers of zero. The current ticket offset is
/// packed with the seqlock in an atomic 64-bit integer. The initial
/// offset is zero.
///
/// Lagging write and read operations with tickets lower than the
/// ticket offset of the current slots array (i.e., the minimum ticket
/// number that can be served by the current array) must use earlier
/// closed arrays instead of the current one. Information about closed
/// slots arrays (array address, capacity, stride, and offset) is
/// maintained in a logarithmic-sized structure. Each entry in that
/// structure never needs to be changed once set. The number of closed
/// arrays is half the value of the seqlock (when unlocked).
///
/// The acquisition of the seqlock to perform an expansion does not
/// prevent the issuing of new push and pop tickets concurrently. The
/// expansion must set the new ticket offset to a value that couldn't
/// have been issued to an operation that has already gone through a
/// seqlock read-only section (and hence obtained information for
/// older closed arrays).
///
/// Note that the total queue capacity can temporarily exceed the
/// specified capacity when there are lagging consumers that haven't
/// yet consumed all the elements in closed arrays. Users should not
/// rely on the capacity of dynamic queues for synchronization, e.g.,
/// they should not expect that a thread will definitely block on a
/// call to blockingWrite() when the queue size is known to be equal
/// to its capacity.
///
/// Note that some writeIfNotFull() and tryWriteUntil() operations may
/// fail even if the size of the queue is less than its maximum
/// capacity and despite the success of expansion, if the operation
/// happens to acquire a ticket that belongs to a closed array. This
/// is a transient condition. Typically, one or two ticket values may
/// be subject to such condition per expansion.
///
/// The dynamic version is a partial specialization of MPMCQueue with
/// Dynamic == true
template <typename T, template <typename> class Atom>
class MPMCQueue<T, Atom, true>
    : public detail::MPMCQueueBase<MPMCQueue<T, Atom, true>> {
  friend class detail::MPMCQueueBase<MPMCQueue<T, Atom, true>>;
  using Slot = detail::SingleElementQueue<T, Atom>;

  struct ClosedArray {
    uint64_t offset_{0};
    Slot* slots_{nullptr};
    size_t capacity_{0};
    int stride_{0};
  };

 public:
  explicit MPMCQueue(size_t queueCapacity)
      : detail::MPMCQueueBase<MPMCQueue<T, Atom, true>>(queueCapacity) {
    size_t cap = std::min<size_t>(kDefaultMinDynamicCapacity, queueCapacity);
    initQueue(cap, kDefaultExpansionMultiplier);
  }

  explicit MPMCQueue(
      size_t queueCapacity,
      size_t minCapacity,
      size_t expansionMultiplier)
      : detail::MPMCQueueBase<MPMCQueue<T, Atom, true>>(queueCapacity) {
    minCapacity = std::max<size_t>(1, minCapacity);
    size_t cap = std::min<size_t>(minCapacity, queueCapacity);
    expansionMultiplier = std::max<size_t>(2, expansionMultiplier);
    initQueue(cap, expansionMultiplier);
  }

  MPMCQueue() noexcept {
    dmult_ = 0;
    closed_ = nullptr;
  }

  MPMCQueue(MPMCQueue<T, Atom, true>&& rhs) noexcept {
    this->capacity_ = rhs.capacity_;
    this->slots_ = rhs.slots_;
    this->stride_ = rhs.stride_;
    this->dstate_.store(
        rhs.dstate_.load(std::memory_order_relaxed), std::memory_order_relaxed);
    this->dcapacity_.store(
        rhs.dcapacity_.load(std::memory_order_relaxed),
        std::memory_order_relaxed);
    this->pushTicket_.store(
        rhs.pushTicket_.load(std::memory_order_relaxed),
        std::memory_order_relaxed);
    this->popTicket_.store(
        rhs.popTicket_.load(std::memory_order_relaxed),
        std::memory_order_relaxed);
    this->pushSpinCutoff_.store(
        rhs.pushSpinCutoff_.load(std::memory_order_relaxed),
        std::memory_order_relaxed);
    this->popSpinCutoff_.store(
        rhs.popSpinCutoff_.load(std::memory_order_relaxed),
        std::memory_order_relaxed);
    dmult_ = rhs.dmult_;
    closed_ = rhs.closed_;

    rhs.capacity_ = 0;
    rhs.slots_ = nullptr;
    rhs.stride_ = 0;
    rhs.dstate_.store(0, std::memory_order_relaxed);
    rhs.dcapacity_.store(0, std::memory_order_relaxed);
    rhs.pushTicket_.store(0, std::memory_order_relaxed);
    rhs.popTicket_.store(0, std::memory_order_relaxed);
    rhs.pushSpinCutoff_.store(0, std::memory_order_relaxed);
    rhs.popSpinCutoff_.store(0, std::memory_order_relaxed);
    rhs.dmult_ = 0;
    rhs.closed_ = nullptr;
  }

  MPMCQueue<T, Atom, true> const& operator=(MPMCQueue<T, Atom, true>&& rhs) {
    if (this != &rhs) {
      this->~MPMCQueue();
      new (this) MPMCQueue(std::move(rhs));
    }
    return *this;
  }

  ~MPMCQueue() {
    if (closed_ != nullptr) {
      for (int i = getNumClosed(this->dstate_.load()) - 1; i >= 0; --i) {
        delete[] closed_[i].slots_;
      }
      delete[] closed_;
    }
  }

  size_t allocatedCapacity() const noexcept {
    return this->dcapacity_.load(std::memory_order_relaxed);
  }

  template <typename... Args>
  void blockingWrite(Args&&... args) noexcept {
    uint64_t ticket = this->pushTicket_++;
    Slot* slots;
    size_t cap;
    int stride;
    uint64_t state;
    uint64_t offset;
    do {
      if (!trySeqlockReadSection(state, slots, cap, stride)) {
        asm_volatile_pause();
        continue;
      }
      if (maybeUpdateFromClosed(state, ticket, offset, slots, cap, stride)) {
        // There was an expansion after this ticket was issued.
        break;
      }
      if (slots[this->idx((ticket - offset), cap, stride)].mayEnqueue(
              this->turn(ticket - offset, cap))) {
        // A slot is ready. No need to expand.
        break;
      } else if (
          this->popTicket_.load(std::memory_order_relaxed) + cap > ticket) {
        // May block, but a pop is in progress. No need to expand.
        // Get seqlock read section info again in case an expansion
        // occurred with an equal or higher ticket.
        continue;
      } else {
        // May block. See if we can expand.
        if (tryExpand(state, cap)) {
          // This or another thread started an expansion. Get updated info.
          continue;
        } else {
          // Can't expand.
          break;
        }
      }
    } while (true);
    this->enqueueWithTicketBase(
        ticket - offset, slots, cap, stride, std::forward<Args>(args)...);
  }

  void blockingReadWithTicket(uint64_t& ticket, T& elem) noexcept {
    ticket = this->popTicket_++;
    Slot* slots;
    size_t cap;
    int stride;
    uint64_t state;
    uint64_t offset;
    while (!trySeqlockReadSection(state, slots, cap, stride)) {
      asm_volatile_pause();
    }
    // If there was an expansion after the corresponding push ticket
    // was issued, adjust accordingly
    maybeUpdateFromClosed(state, ticket, offset, slots, cap, stride);
    this->dequeueWithTicketBase(ticket - offset, slots, cap, stride, elem);
  }

 private:
  enum {
    kSeqlockBits = 6,
    kDefaultMinDynamicCapacity = 10,
    kDefaultExpansionMultiplier = 10,
  };

  size_t dmult_;

  //  Info about closed slots arrays for use by lagging operations
  ClosedArray* closed_;

  void initQueue(const size_t cap, const size_t mult) {
    this->stride_ = this->computeStride(cap);
    this->slots_ = new Slot[cap + 2 * this->kSlotPadding];
    this->dstate_.store(0);
    this->dcapacity_.store(cap);
    dmult_ = mult;
    size_t maxClosed = 0;
    for (size_t expanded = cap; expanded < this->capacity_; expanded *= mult) {
      ++maxClosed;
    }
    closed_ = (maxClosed > 0) ? new ClosedArray[maxClosed] : nullptr;
  }

  bool tryObtainReadyPushTicket(
      uint64_t& ticket,
      Slot*& slots,
      size_t& cap,
      int& stride) noexcept {
    uint64_t state;
    do {
      ticket = this->pushTicket_.load(std::memory_order_acquire); // A
      if (!trySeqlockReadSection(state, slots, cap, stride)) {
        asm_volatile_pause();
        continue;
      }

      // If there was an expansion with offset greater than this ticket,
      // adjust accordingly
      uint64_t offset;
      maybeUpdateFromClosed(state, ticket, offset, slots, cap, stride);

      if (slots[this->idx((ticket - offset), cap, stride)].mayEnqueue(
              this->turn(ticket - offset, cap))) {
        // A slot is ready.
        if (this->pushTicket_.compare_exchange_strong(ticket, ticket + 1)) {
          // Adjust ticket
          ticket -= offset;
          return true;
        } else {
          continue;
        }
      } else {
        if (ticket != this->pushTicket_.load(std::memory_order_relaxed)) { // B
          // Try again. Ticket changed.
          continue;
        }
        // Likely to block.
        // Try to expand unless the ticket is for a closed array
        if (offset == getOffset(state)) {
          if (tryExpand(state, cap)) {
            // This or another thread started an expansion. Get up-to-date info.
            continue;
          }
        }
        return false;
      }
    } while (true);
  }

  bool tryObtainPromisedPushTicket(
      uint64_t& ticket,
      Slot*& slots,
      size_t& cap,
      int& stride) noexcept {
    uint64_t state;
    do {
      ticket = this->pushTicket_.load(std::memory_order_acquire);
      auto numPops = this->popTicket_.load(std::memory_order_acquire);
      if (!trySeqlockReadSection(state, slots, cap, stride)) {
        asm_volatile_pause();
        continue;
      }

      const auto curCap = cap;
      // If there was an expansion with offset greater than this ticket,
      // adjust accordingly
      uint64_t offset;
      maybeUpdateFromClosed(state, ticket, offset, slots, cap, stride);

      int64_t n = ticket - numPops;

      if (n >= static_cast<ssize_t>(cap)) {
        if ((cap == curCap) && tryExpand(state, cap)) {
          // This or another thread started an expansion. Start over.
          continue;
        }
        // Can't expand.
        ticket -= offset;
        return false;
      }

      if (this->pushTicket_.compare_exchange_strong(ticket, ticket + 1)) {
        // Adjust ticket
        ticket -= offset;
        return true;
      }
    } while (true);
  }

  bool tryObtainReadyPopTicket(
      uint64_t& ticket,
      Slot*& slots,
      size_t& cap,
      int& stride) noexcept {
    uint64_t state;
    do {
      ticket = this->popTicket_.load(std::memory_order_relaxed);
      if (!trySeqlockReadSection(state, slots, cap, stride)) {
        asm_volatile_pause();
        continue;
      }

      // If there was an expansion after the corresponding push ticket
      // was issued, adjust accordingly
      uint64_t offset;
      maybeUpdateFromClosed(state, ticket, offset, slots, cap, stride);

      if (slots[this->idx((ticket - offset), cap, stride)].mayDequeue(
              this->turn(ticket - offset, cap))) {
        if (this->popTicket_.compare_exchange_strong(ticket, ticket + 1)) {
          // Adjust ticket
          ticket -= offset;
          return true;
        }
      } else {
        return false;
      }
    } while (true);
  }

  bool tryObtainPromisedPopTicket(
      uint64_t& ticket,
      Slot*& slots,
      size_t& cap,
      int& stride) noexcept {
    uint64_t state;
    do {
      ticket = this->popTicket_.load(std::memory_order_acquire);
      auto numPushes = this->pushTicket_.load(std::memory_order_acquire);
      if (!trySeqlockReadSection(state, slots, cap, stride)) {
        asm_volatile_pause();
        continue;
      }

      uint64_t offset;
      // If there was an expansion after the corresponding push
      // ticket was issued, adjust accordingly
      maybeUpdateFromClosed(state, ticket, offset, slots, cap, stride);

      if (ticket >= numPushes) {
        ticket -= offset;
        return false;
      }
      if (this->popTicket_.compare_exchange_strong(ticket, ticket + 1)) {
        ticket -= offset;
        return true;
      }
    } while (true);
  }

  /// Enqueues an element with a specific ticket number
  template <typename... Args>
  void enqueueWithTicket(const uint64_t ticket, Args&&... args) noexcept {
    Slot* slots;
    size_t cap;
    int stride;
    uint64_t state;
    uint64_t offset;

    while (!trySeqlockReadSection(state, slots, cap, stride)) {
    }

    // If there was an expansion after this ticket was issued, adjust
    // accordingly
    maybeUpdateFromClosed(state, ticket, offset, slots, cap, stride);

    this->enqueueWithTicketBase(
        ticket - offset, slots, cap, stride, std::forward<Args>(args)...);
  }

  uint64_t getOffset(const uint64_t state) const noexcept {
    return state >> kSeqlockBits;
  }

  int getNumClosed(const uint64_t state) const noexcept {
    return (state & ((1 << kSeqlockBits) - 1)) >> 1;
  }

  /// Try to expand the queue. Returns true if this expansion was
  /// successful or a concurent expansion is in progress. Returns
  /// false if the queue has reached its maximum capacity or
  /// allocation has failed.
  bool tryExpand(const uint64_t state, const size_t cap) noexcept {
    if (cap == this->capacity_) {
      return false;
    }
    // Acquire seqlock
    uint64_t oldval = state;
    assert((state & 1) == 0);
    if (this->dstate_.compare_exchange_strong(oldval, state + 1)) {
      assert(cap == this->dcapacity_.load());
      uint64_t ticket =
          1 + std::max(this->pushTicket_.load(), this->popTicket_.load());
      size_t newCapacity = std::min(dmult_ * cap, this->capacity_);
      Slot* newSlots =
          new (std::nothrow) Slot[newCapacity + 2 * this->kSlotPadding];
      if (newSlots == nullptr) {
        // Expansion failed. Restore the seqlock
        this->dstate_.store(state);
        return false;
      }
      // Successful expansion
      // calculate the current ticket offset
      uint64_t offset = getOffset(state);
      // calculate index in closed array
      int index = getNumClosed(state);
      assert((index << 1) < (1 << kSeqlockBits));
      // fill the info for the closed slots array
      closed_[index].offset_ = offset;
      closed_[index].slots_ = this->dslots_.load();
      closed_[index].capacity_ = cap;
      closed_[index].stride_ = this->dstride_.load();
      // update the new slots array info
      this->dslots_.store(newSlots);
      this->dcapacity_.store(newCapacity);
      this->dstride_.store(this->computeStride(newCapacity));
      // Release the seqlock and record the new ticket offset
      this->dstate_.store((ticket << kSeqlockBits) + (2 * (index + 1)));
      return true;
    } else { // failed to acquire seqlock
      // Someone acaquired the seqlock. Go back to the caller and get
      // up-to-date info.
      return true;
    }
  }

  /// Seqlock read-only section
  bool trySeqlockReadSection(
      uint64_t& state,
      Slot*& slots,
      size_t& cap,
      int& stride) noexcept {
    state = this->dstate_.load(std::memory_order_acquire);
    if (state & 1) {
      // Locked.
      return false;
    }
    // Start read-only section.
    slots = this->dslots_.load(std::memory_order_relaxed);
    cap = this->dcapacity_.load(std::memory_order_relaxed);
    stride = this->dstride_.load(std::memory_order_relaxed);
    // End of read-only section. Validate seqlock.
    std::atomic_thread_fence(std::memory_order_acquire);
    return (state == this->dstate_.load(std::memory_order_relaxed));
  }

  /// If there was an expansion after ticket was issued, update local variables
  /// of the lagging operation using the most recent closed array with
  /// offset <= ticket and return true. Otherwise, return false;
  bool maybeUpdateFromClosed(
      const uint64_t state,
      const uint64_t ticket,
      uint64_t& offset,
      Slot*& slots,
      size_t& cap,
      int& stride) noexcept {
    offset = getOffset(state);
    if (ticket >= offset) {
      return false;
    }
    for (int i = getNumClosed(state) - 1; i >= 0; --i) {
      offset = closed_[i].offset_;
      if (offset <= ticket) {
        slots = closed_[i].slots_;
        cap = closed_[i].capacity_;
        stride = closed_[i].stride_;
        return true;
      }
    }
    // A closed array with offset <= ticket should have been found
    assert(false);
    return false;
  }
};

namespace detail {

/// CRTP specialization of MPMCQueueBase
template <
    template <typename T, template <typename> class Atom, bool Dynamic>
    class Derived,
    typename T,
    template <typename> class Atom,
    bool Dynamic>
class MPMCQueueBase<Derived<T, Atom, Dynamic>> : boost::noncopyable {
  // Note: Using CRTP static casts in several functions of this base
  // template instead of making called functions virtual or duplicating
  // the code of calling functions in the derived partially specialized
  // template

  static_assert(
      std::is_nothrow_constructible<T, T&&>::value ||
          folly::IsRelocatable<T>::value,
      "T must be relocatable or have a noexcept move constructor");

 public:
  typedef T value_type;

  using Slot = detail::SingleElementQueue<T, Atom>;

  explicit MPMCQueueBase(size_t queueCapacity)
      : capacity_(queueCapacity),
        pushTicket_(0),
        popTicket_(0),
        pushSpinCutoff_(0),
        popSpinCutoff_(0) {
    if (queueCapacity == 0) {
      throw std::invalid_argument(
          "MPMCQueue with explicit capacity 0 is impossible"
          // Stride computation in derived classes would sigfpe if capacity is 0
      );
    }

    // ideally this would be a static assert, but g++ doesn't allow it
    assert(
        alignof(MPMCQueue<T, Atom>) >= hardware_destructive_interference_size);
    assert(
        static_cast<uint8_t*>(static_cast<void*>(&popTicket_)) -
            static_cast<uint8_t*>(static_cast<void*>(&pushTicket_)) >=
        static_cast<ptrdiff_t>(hardware_destructive_interference_size));
  }

  /// A default-constructed queue is useful because a usable (non-zero
  /// capacity) queue can be moved onto it or swapped with it
  MPMCQueueBase() noexcept
      : capacity_(0),
        slots_(nullptr),
        stride_(0),
        dstate_(0),
        dcapacity_(0),
        pushTicket_(0),
        popTicket_(0),
        pushSpinCutoff_(0),
        popSpinCutoff_(0) {}

  /// IMPORTANT: The move constructor is here to make it easier to perform
  /// the initialization phase, it is not safe to use when there are any
  /// concurrent accesses (this is not checked).
  MPMCQueueBase(MPMCQueueBase<Derived<T, Atom, Dynamic>>&& rhs) noexcept
      : capacity_(rhs.capacity_),
        slots_(rhs.slots_),
        stride_(rhs.stride_),
        dstate_(rhs.dstate_.load(std::memory_order_relaxed)),
        dcapacity_(rhs.dcapacity_.load(std::memory_order_relaxed)),
        pushTicket_(rhs.pushTicket_.load(std::memory_order_relaxed)),
        popTicket_(rhs.popTicket_.load(std::memory_order_relaxed)),
        pushSpinCutoff_(rhs.pushSpinCutoff_.load(std::memory_order_relaxed)),
        popSpinCutoff_(rhs.popSpinCutoff_.load(std::memory_order_relaxed)) {
    // relaxed ops are okay for the previous reads, since rhs queue can't
    // be in concurrent use

    // zero out rhs
    rhs.capacity_ = 0;
    rhs.slots_ = nullptr;
    rhs.stride_ = 0;
    rhs.dstate_.store(0, std::memory_order_relaxed);
    rhs.dcapacity_.store(0, std::memory_order_relaxed);
    rhs.pushTicket_.store(0, std::memory_order_relaxed);
    rhs.popTicket_.store(0, std::memory_order_relaxed);
    rhs.pushSpinCutoff_.store(0, std::memory_order_relaxed);
    rhs.popSpinCutoff_.store(0, std::memory_order_relaxed);
  }

  /// IMPORTANT: The move operator is here to make it easier to perform
  /// the initialization phase, it is not safe to use when there are any
  /// concurrent accesses (this is not checked).
  MPMCQueueBase<Derived<T, Atom, Dynamic>> const& operator=(
      MPMCQueueBase<Derived<T, Atom, Dynamic>>&& rhs) {
    if (this != &rhs) {
      this->~MPMCQueueBase();
      new (this) MPMCQueueBase(std::move(rhs));
    }
    return *this;
  }

  /// MPMCQueue can only be safely destroyed when there are no
  /// pending enqueuers or dequeuers (this is not checked).
  ~MPMCQueueBase() {
    delete[] slots_;
  }

  /// Returns the number of writes (including threads that are blocked waiting
  /// to write) minus the number of reads (including threads that are blocked
  /// waiting to read). So effectively, it becomes:
  /// elements in queue + pending(calls to write) - pending(calls to read).
  /// If nothing is pending, then the method returns the actual number of
  /// elements in the queue.
  /// The returned value can be negative if there are no writers and the queue
  /// is empty, but there is one reader that is blocked waiting to read (in
  /// which case, the returned size will be -1).
  ssize_t size() const noexcept {
    // since both pushes and pops increase monotonically, we can get a
    // consistent snapshot either by bracketing a read of popTicket_ with
    // two reads of pushTicket_ that return the same value, or the other
    // way around.  We maximize our chances by alternately attempting
    // both bracketings.
    uint64_t pushes = pushTicket_.load(std::memory_order_acquire); // A
    uint64_t pops = popTicket_.load(std::memory_order_acquire); // B
    while (true) {
      uint64_t nextPushes = pushTicket_.load(std::memory_order_acquire); // C
      if (pushes == nextPushes) {
        // pushTicket_ didn't change from A (or the previous C) to C,
        // so we can linearize at B (or D)
        return ssize_t(pushes - pops);
      }
      pushes = nextPushes;
      uint64_t nextPops = popTicket_.load(std::memory_order_acquire); // D
      if (pops == nextPops) {
        // popTicket_ didn't chance from B (or the previous D), so we
        // can linearize at C
        return ssize_t(pushes - pops);
      }
      pops = nextPops;
    }
  }

  /// Returns true if there are no items available for dequeue
  bool isEmpty() const noexcept {
    return size() <= 0;
  }

  /// Returns true if there is currently no empty space to enqueue
  bool isFull() const noexcept {
    // careful with signed -> unsigned promotion, since size can be negative
    return size() >= static_cast<ssize_t>(capacity_);
  }

  /// Returns is a guess at size() for contexts that don't need a precise
  /// value, such as stats. More specifically, it returns the number of writes
  /// minus the number of reads, but after reading the number of writes, more
  /// writers could have came before the number of reads was sampled,
  /// and this method doesn't protect against such case.
  /// The returned value can be negative.
  ssize_t sizeGuess() const noexcept {
    return writeCount() - readCount();
  }

  /// Doesn't change
  size_t capacity() const noexcept {
    return capacity_;
  }

  /// Doesn't change for non-dynamic
  size_t allocatedCapacity() const noexcept {
    return capacity_;
  }

  /// Returns the total number of calls to blockingWrite or successful
  /// calls to write, including those blockingWrite calls that are
  /// currently blocking
  uint64_t writeCount() const noexcept {
    return pushTicket_.load(std::memory_order_acquire);
  }

  /// Returns the total number of calls to blockingRead or successful
  /// calls to read, including those blockingRead calls that are currently
  /// blocking
  uint64_t readCount() const noexcept {
    return popTicket_.load(std::memory_order_acquire);
  }

  /// Enqueues a T constructed from args, blocking until space is
  /// available.  Note that this method signature allows enqueue via
  /// move, if args is a T rvalue, via copy, if args is a T lvalue, or
  /// via emplacement if args is an initializer list that can be passed
  /// to a T constructor.
  template <typename... Args>
  void blockingWrite(Args&&... args) noexcept {
    enqueueWithTicketBase(
        pushTicket_++, slots_, capacity_, stride_, std::forward<Args>(args)...);
  }

  /// If an item can be enqueued with no blocking, does so and returns
  /// true, otherwise returns false.  This method is similar to
  /// writeIfNotFull, but if you don't have a specific need for that
  /// method you should use this one.
  ///
  /// One of the common usages of this method is to enqueue via the
  /// move constructor, something like q.write(std::move(x)).  If write
  /// returns false because the queue is full then x has not actually been
  /// consumed, which looks strange.  To understand why it is actually okay
  /// to use x afterward, remember that std::move is just a typecast that
  /// provides an rvalue reference that enables use of a move constructor
  /// or operator.  std::move doesn't actually move anything.  It could
  /// more accurately be called std::rvalue_cast or std::move_permission.
  template <typename... Args>
  bool write(Args&&... args) noexcept {
    uint64_t ticket;
    Slot* slots;
    size_t cap;
    int stride;
    if (static_cast<Derived<T, Atom, Dynamic>*>(this)->tryObtainReadyPushTicket(
            ticket, slots, cap, stride)) {
      // we have pre-validated that the ticket won't block
      enqueueWithTicketBase(
          ticket, slots, cap, stride, std::forward<Args>(args)...);
      return true;
    } else {
      return false;
    }
  }

  template <class Clock, typename... Args>
  bool tryWriteUntil(
      const std::chrono::time_point<Clock>& when,
      Args&&... args) noexcept {
    uint64_t ticket;
    Slot* slots;
    size_t cap;
    int stride;
    if (tryObtainPromisedPushTicketUntil(ticket, slots, cap, stride, when)) {
      // we have pre-validated that the ticket won't block, or rather that
      // it won't block longer than it takes another thread to dequeue an
      // element from the slot it identifies.
      enqueueWithTicketBase(
          ticket, slots, cap, stride, std::forward<Args>(args)...);
      return true;
    } else {
      return false;
    }
  }

  /// If the queue is not full, enqueues and returns true, otherwise
  /// returns false.  Unlike write this method can be blocked by another
  /// thread, specifically a read that has linearized (been assigned
  /// a ticket) but not yet completed.  If you don't really need this
  /// function you should probably use write.
  ///
  /// MPMCQueue isn't lock-free, so just because a read operation has
  /// linearized (and isFull is false) doesn't mean that space has been
  /// made available for another write.  In this situation write will
  /// return false, but writeIfNotFull will wait for the dequeue to finish.
  /// This method is required if you are composing queues and managing
  /// your own wakeup, because it guarantees that after every successful
  /// write a readIfNotEmpty will succeed.
  template <typename... Args>
  bool writeIfNotFull(Args&&... args) noexcept {
    uint64_t ticket;
    Slot* slots;
    size_t cap;
    int stride;
    if (static_cast<Derived<T, Atom, Dynamic>*>(this)
            ->tryObtainPromisedPushTicket(ticket, slots, cap, stride)) {
      // some other thread is already dequeuing the slot into which we
      // are going to enqueue, but we might have to wait for them to finish
      enqueueWithTicketBase(
          ticket, slots, cap, stride, std::forward<Args>(args)...);
      return true;
    } else {
      return false;
    }
  }

  /// Moves a dequeued element onto elem, blocking until an element
  /// is available
  void blockingRead(T& elem) noexcept {
    uint64_t ticket;
    static_cast<Derived<T, Atom, Dynamic>*>(this)->blockingReadWithTicket(
        ticket, elem);
  }

  /// Same as blockingRead() but also records the ticket nunmer
  void blockingReadWithTicket(uint64_t& ticket, T& elem) noexcept {
    assert(capacity_ != 0);
    ticket = popTicket_++;
    dequeueWithTicketBase(ticket, slots_, capacity_, stride_, elem);
  }

  /// If an item can be dequeued with no blocking, does so and returns
  /// true, otherwise returns false.
  bool read(T& elem) noexcept {
    uint64_t ticket;
    return readAndGetTicket(ticket, elem);
  }

  /// Same as read() but also records the ticket nunmer
  bool readAndGetTicket(uint64_t& ticket, T& elem) noexcept {
    Slot* slots;
    size_t cap;
    int stride;
    if (static_cast<Derived<T, Atom, Dynamic>*>(this)->tryObtainReadyPopTicket(
            ticket, slots, cap, stride)) {
      // the ticket has been pre-validated to not block
      dequeueWithTicketBase(ticket, slots, cap, stride, elem);
      return true;
    } else {
      return false;
    }
  }

  template <class Clock, typename... Args>
  bool tryReadUntil(
      const std::chrono::time_point<Clock>& when,
      T& elem) noexcept {
    uint64_t ticket;
    Slot* slots;
    size_t cap;
    int stride;
    if (tryObtainPromisedPopTicketUntil(ticket, slots, cap, stride, when)) {
      // we have pre-validated that the ticket won't block, or rather that
      // it won't block longer than it takes another thread to enqueue an
      // element on the slot it identifies.
      dequeueWithTicketBase(ticket, slots, cap, stride, elem);
      return true;
    } else {
      return false;
    }
  }

  /// If the queue is not empty, dequeues and returns true, otherwise
  /// returns false.  If the matching write is still in progress then this
  /// method may block waiting for it.  If you don't rely on being able
  /// to dequeue (such as by counting completed write) then you should
  /// prefer read.
  bool readIfNotEmpty(T& elem) noexcept {
    uint64_t ticket;
    Slot* slots;
    size_t cap;
    int stride;
    if (static_cast<Derived<T, Atom, Dynamic>*>(this)
            ->tryObtainPromisedPopTicket(ticket, slots, cap, stride)) {
      // the matching enqueue already has a ticket, but might not be done
      dequeueWithTicketBase(ticket, slots, cap, stride, elem);
      return true;
    } else {
      return false;
    }
  }

 protected:
  enum {
    /// Once every kAdaptationFreq we will spin longer, to try to estimate
    /// the proper spin backoff
    kAdaptationFreq = 128,

    /// To avoid false sharing in slots_ with neighboring memory
    /// allocations, we pad it with this many SingleElementQueue-s at
    /// each end
    kSlotPadding =
        (hardware_destructive_interference_size - 1) / sizeof(Slot) + 1
  };

  /// The maximum number of items in the queue at once
  alignas(hardware_destructive_interference_size) size_t capacity_;

  /// Anonymous union for use when Dynamic = false and true, respectively
  union {
    /// An array of capacity_ SingleElementQueue-s, each of which holds
    /// either 0 or 1 item.  We over-allocate by 2 * kSlotPadding and don't
    /// touch the slots at either end, to avoid false sharing
    Slot* slots_;
    /// Current dynamic slots array of dcapacity_ SingleElementQueue-s
    Atom<Slot*> dslots_;
  };

  /// Anonymous union for use when Dynamic = false and true, respectively
  union {
    /// The number of slots_ indices that we advance for each ticket, to
    /// avoid false sharing.  Ideally slots_[i] and slots_[i + stride_]
    /// aren't on the same cache line
    int stride_;
    /// Current stride
    Atom<int> dstride_;
  };

  /// The following two memebers are used by dynamic MPMCQueue.
  /// Ideally they should be in MPMCQueue<T,Atom,true>, but we get
  /// better cache locality if they are in the same cache line as
  /// dslots_ and dstride_.
  ///
  /// Dynamic state. A packed seqlock and ticket offset
  Atom<uint64_t> dstate_;
  /// Dynamic capacity
  Atom<size_t> dcapacity_;

  /// Enqueuers get tickets from here
  alignas(hardware_destructive_interference_size) Atom<uint64_t> pushTicket_;

  /// Dequeuers get tickets from here
  alignas(hardware_destructive_interference_size) Atom<uint64_t> popTicket_;

  /// This is how many times we will spin before using FUTEX_WAIT when
  /// the queue is full on enqueue, adaptively computed by occasionally
  /// spinning for longer and smoothing with an exponential moving average
  alignas(
      hardware_destructive_interference_size) Atom<uint32_t> pushSpinCutoff_;

  /// The adaptive spin cutoff when the queue is empty on dequeue
  alignas(hardware_destructive_interference_size) Atom<uint32_t> popSpinCutoff_;

  /// Alignment doesn't prevent false sharing at the end of the struct,
  /// so fill out the last cache line
  char pad_[hardware_destructive_interference_size - sizeof(Atom<uint32_t>)];

  /// We assign tickets in increasing order, but we don't want to
  /// access neighboring elements of slots_ because that will lead to
  /// false sharing (multiple cores accessing the same cache line even
  /// though they aren't accessing the same bytes in that cache line).
  /// To avoid this we advance by stride slots per ticket.
  ///
  /// We need gcd(capacity, stride) to be 1 so that we will use all
  /// of the slots.  We ensure this by only considering prime strides,
  /// which either have no common divisors with capacity or else have
  /// a zero remainder after dividing by capacity.  That is sufficient
  /// to guarantee correctness, but we also want to actually spread the
  /// accesses away from each other to avoid false sharing (consider a
  /// stride of 7 with a capacity of 8).  To that end we try a few taking
  /// care to observe that advancing by -1 is as bad as advancing by 1
  /// when in comes to false sharing.
  ///
  /// The simple way to avoid false sharing would be to pad each
  /// SingleElementQueue, but since we have capacity_ of them that could
  /// waste a lot of space.
  static int computeStride(size_t capacity) noexcept {
    static const int smallPrimes[] = {2, 3, 5, 7, 11, 13, 17, 19, 23};

    int bestStride = 1;
    size_t bestSep = 1;
    for (int stride : smallPrimes) {
      if ((stride % capacity) == 0 || (capacity % stride) == 0) {
        continue;
      }
      size_t sep = stride % capacity;
      sep = std::min(sep, capacity - sep);
      if (sep > bestSep) {
        bestStride = stride;
        bestSep = sep;
      }
    }
    return bestStride;
  }

  /// Returns the index into slots_ that should be used when enqueuing or
  /// dequeuing with the specified ticket
  size_t idx(uint64_t ticket, size_t cap, int stride) noexcept {
    return ((ticket * stride) % cap) + kSlotPadding;
  }

  /// Maps an enqueue or dequeue ticket to the turn should be used at the
  /// corresponding SingleElementQueue
  uint32_t turn(uint64_t ticket, size_t cap) noexcept {
    assert(cap != 0);
    return uint32_t(ticket / cap);
  }

  /// Tries to obtain a push ticket for which SingleElementQueue::enqueue
  /// won't block.  Returns true on immediate success, false on immediate
  /// failure.
  bool tryObtainReadyPushTicket(
      uint64_t& ticket,
      Slot*& slots,
      size_t& cap,
      int& stride) noexcept {
    ticket = pushTicket_.load(std::memory_order_acquire); // A
    slots = slots_;
    cap = capacity_;
    stride = stride_;
    while (true) {
      if (!slots[idx(ticket, cap, stride)].mayEnqueue(turn(ticket, cap))) {
        // if we call enqueue(ticket, ...) on the SingleElementQueue
        // right now it would block, but this might no longer be the next
        // ticket.  We can increase the chance of tryEnqueue success under
        // contention (without blocking) by rechecking the ticket dispenser
        auto prev = ticket;
        ticket = pushTicket_.load(std::memory_order_acquire); // B
        if (prev == ticket) {
          // mayEnqueue was bracketed by two reads (A or prev B or prev
          // failing CAS to B), so we are definitely unable to enqueue
          return false;
        }
      } else {
        // we will bracket the mayEnqueue check with a read (A or prev B
        // or prev failing CAS) and the following CAS.  If the CAS fails
        // it will effect a load of pushTicket_
        if (pushTicket_.compare_exchange_strong(ticket, ticket + 1)) {
          return true;
        }
      }
    }
  }

  /// Tries until when to obtain a push ticket for which
  /// SingleElementQueue::enqueue  won't block.  Returns true on success, false
  /// on failure.
  /// ticket is filled on success AND failure.
  template <class Clock>
  bool tryObtainPromisedPushTicketUntil(
      uint64_t& ticket,
      Slot*& slots,
      size_t& cap,
      int& stride,
      const std::chrono::time_point<Clock>& when) noexcept {
    bool deadlineReached = false;
    while (!deadlineReached) {
      if (static_cast<Derived<T, Atom, Dynamic>*>(this)
              ->tryObtainPromisedPushTicket(ticket, slots, cap, stride)) {
        return true;
      }
      // ticket is a blocking ticket until the preceding ticket has been
      // processed: wait until this ticket's turn arrives. We have not reserved
      // this ticket so we will have to re-attempt to get a non-blocking ticket
      // if we wake up before we time-out.
      deadlineReached =
          !slots[idx(ticket, cap, stride)].tryWaitForEnqueueTurnUntil(
              turn(ticket, cap),
              pushSpinCutoff_,
              (ticket % kAdaptationFreq) == 0,
              when);
    }
    return false;
  }

  /// Tries to obtain a push ticket which can be satisfied if all
  /// in-progress pops complete.  This function does not block, but
  /// blocking may be required when using the returned ticket if some
  /// other thread's pop is still in progress (ticket has been granted but
  /// pop has not yet completed).
  bool tryObtainPromisedPushTicket(
      uint64_t& ticket,
      Slot*& slots,
      size_t& cap,
      int& stride) noexcept {
    auto numPushes = pushTicket_.load(std::memory_order_acquire); // A
    slots = slots_;
    cap = capacity_;
    stride = stride_;
    while (true) {
      ticket = numPushes;
      const auto numPops = popTicket_.load(std::memory_order_acquire); // B
      // n will be negative if pops are pending
      const int64_t n = int64_t(numPushes - numPops);
      if (n >= static_cast<ssize_t>(capacity_)) {
        // Full, linearize at B.  We don't need to recheck the read we
        // performed at A, because if numPushes was stale at B then the
        // real numPushes value is even worse
        return false;
      }
      if (pushTicket_.compare_exchange_strong(numPushes, numPushes + 1)) {
        return true;
      }
    }
  }

  /// Tries to obtain a pop ticket for which SingleElementQueue::dequeue
  /// won't block.  Returns true on immediate success, false on immediate
  /// failure.
  bool tryObtainReadyPopTicket(
      uint64_t& ticket,
      Slot*& slots,
      size_t& cap,
      int& stride) noexcept {
    ticket = popTicket_.load(std::memory_order_acquire);
    slots = slots_;
    cap = capacity_;
    stride = stride_;
    while (true) {
      if (!slots[idx(ticket, cap, stride)].mayDequeue(turn(ticket, cap))) {
        auto prev = ticket;
        ticket = popTicket_.load(std::memory_order_acquire);
        if (prev == ticket) {
          return false;
        }
      } else {
        if (popTicket_.compare_exchange_strong(ticket, ticket + 1)) {
          return true;
        }
      }
    }
  }

  /// Tries until when to obtain a pop ticket for which
  /// SingleElementQueue::dequeue won't block.  Returns true on success, false
  /// on failure.
  /// ticket is filled on success AND failure.
  template <class Clock>
  bool tryObtainPromisedPopTicketUntil(
      uint64_t& ticket,
      Slot*& slots,
      size_t& cap,
      int& stride,
      const std::chrono::time_point<Clock>& when) noexcept {
    bool deadlineReached = false;
    while (!deadlineReached) {
      if (static_cast<Derived<T, Atom, Dynamic>*>(this)
              ->tryObtainPromisedPopTicket(ticket, slots, cap, stride)) {
        return true;
      }
      // ticket is a blocking ticket until the preceding ticket has been
      // processed: wait until this ticket's turn arrives. We have not reserved
      // this ticket so we will have to re-attempt to get a non-blocking ticket
      // if we wake up before we time-out.
      deadlineReached =
          !slots[idx(ticket, cap, stride)].tryWaitForDequeueTurnUntil(
              turn(ticket, cap),
              pushSpinCutoff_,
              (ticket % kAdaptationFreq) == 0,
              when);
    }
    return false;
  }

  /// Similar to tryObtainReadyPopTicket, but returns a pop ticket whose
  /// corresponding push ticket has already been handed out, rather than
  /// returning one whose corresponding push ticket has already been
  /// completed.  This means that there is a possibility that the caller
  /// will block when using the ticket, but it allows the user to rely on
  /// the fact that if enqueue has succeeded, tryObtainPromisedPopTicket
  /// will return true.  The "try" part of this is that we won't have
  /// to block waiting for someone to call enqueue, although we might
  /// have to block waiting for them to finish executing code inside the
  /// MPMCQueue itself.
  bool tryObtainPromisedPopTicket(
      uint64_t& ticket,
      Slot*& slots,
      size_t& cap,
      int& stride) noexcept {
    auto numPops = popTicket_.load(std::memory_order_acquire); // A
    slots = slots_;
    cap = capacity_;
    stride = stride_;
    while (true) {
      ticket = numPops;
      const auto numPushes = pushTicket_.load(std::memory_order_acquire); // B
      if (numPops >= numPushes) {
        // Empty, or empty with pending pops.  Linearize at B.  We don't
        // need to recheck the read we performed at A, because if numPops
        // is stale then the fresh value is larger and the >= is still true
        return false;
      }
      if (popTicket_.compare_exchange_strong(numPops, numPops + 1)) {
        return true;
      }
    }
  }

  // Given a ticket, constructs an enqueued item using args
  template <typename... Args>
  void enqueueWithTicketBase(
      uint64_t ticket,
      Slot* slots,
      size_t cap,
      int stride,
      Args&&... args) noexcept {
    slots[idx(ticket, cap, stride)].enqueue(
        turn(ticket, cap),
        pushSpinCutoff_,
        (ticket % kAdaptationFreq) == 0,
        std::forward<Args>(args)...);
  }

  // To support tracking ticket numbers in MPMCPipelineStageImpl
  template <typename... Args>
  void enqueueWithTicket(uint64_t ticket, Args&&... args) noexcept {
    enqueueWithTicketBase(
        ticket, slots_, capacity_, stride_, std::forward<Args>(args)...);
  }

  // Given a ticket, dequeues the corresponding element
  void dequeueWithTicketBase(
      uint64_t ticket,
      Slot* slots,
      size_t cap,
      int stride,
      T& elem) noexcept {
    assert(cap != 0);
    slots[idx(ticket, cap, stride)].dequeue(
        turn(ticket, cap),
        popSpinCutoff_,
        (ticket % kAdaptationFreq) == 0,
        elem);
  }
};

/// SingleElementQueue implements a blocking queue that holds at most one
/// item, and that requires its users to assign incrementing identifiers
/// (turns) to each enqueue and dequeue operation.  Note that the turns
/// used by SingleElementQueue are doubled inside the TurnSequencer
template <typename T, template <typename> class Atom>
struct SingleElementQueue {
  ~SingleElementQueue() noexcept {
    if ((sequencer_.uncompletedTurnLSB() & 1) == 1) {
      // we are pending a dequeue, so we have a constructed item
      destroyContents();
    }
  }

  /// enqueue using in-place noexcept construction
  template <
      typename... Args,
      typename = typename std::enable_if<
          std::is_nothrow_constructible<T, Args...>::value>::type>
  void enqueue(
      const uint32_t turn,
      Atom<uint32_t>& spinCutoff,
      const bool updateSpinCutoff,
      Args&&... args) noexcept {
    sequencer_.waitForTurn(turn * 2, spinCutoff, updateSpinCutoff);
    new (&contents_) T(std::forward<Args>(args)...);
    sequencer_.completeTurn(turn * 2);
  }

  /// enqueue using move construction, either real (if
  /// is_nothrow_move_constructible) or simulated using relocation and
  /// default construction (if IsRelocatable and is_nothrow_constructible)
  template <
      typename = typename std::enable_if<
          (folly::IsRelocatable<T>::value &&
           std::is_nothrow_constructible<T>::value) ||
          std::is_nothrow_constructible<T, T&&>::value>::type>
  void enqueue(
      const uint32_t turn,
      Atom<uint32_t>& spinCutoff,
      const bool updateSpinCutoff,
      T&& goner) noexcept {
    enqueueImpl(
        turn,
        spinCutoff,
        updateSpinCutoff,
        std::move(goner),
        typename std::conditional<
            std::is_nothrow_constructible<T, T&&>::value,
            ImplByMove,
            ImplByRelocation>::type());
  }

  /// Waits until either:
  /// 1: the dequeue turn preceding the given enqueue turn has arrived
  /// 2: the given deadline has arrived
  /// Case 1 returns true, case 2 returns false.
  template <class Clock>
  bool tryWaitForEnqueueTurnUntil(
      const uint32_t turn,
      Atom<uint32_t>& spinCutoff,
      const bool updateSpinCutoff,
      const std::chrono::time_point<Clock>& when) noexcept {
    return sequencer_.tryWaitForTurn(
               turn * 2, spinCutoff, updateSpinCutoff, &when) !=
        TurnSequencer<Atom>::TryWaitResult::TIMEDOUT;
  }

  bool mayEnqueue(const uint32_t turn) const noexcept {
    return sequencer_.isTurn(turn * 2);
  }

  void dequeue(
      uint32_t turn,
      Atom<uint32_t>& spinCutoff,
      const bool updateSpinCutoff,
      T& elem) noexcept {
    dequeueImpl(
        turn,
        spinCutoff,
        updateSpinCutoff,
        elem,
        typename std::conditional<
            folly::IsRelocatable<T>::value,
            ImplByRelocation,
            ImplByMove>::type());
  }

  /// Waits until either:
  /// 1: the enqueue turn preceding the given dequeue turn has arrived
  /// 2: the given deadline has arrived
  /// Case 1 returns true, case 2 returns false.
  template <class Clock>
  bool tryWaitForDequeueTurnUntil(
      const uint32_t turn,
      Atom<uint32_t>& spinCutoff,
      const bool updateSpinCutoff,
      const std::chrono::time_point<Clock>& when) noexcept {
    return sequencer_.tryWaitForTurn(
               turn * 2 + 1, spinCutoff, updateSpinCutoff, &when) !=
        TurnSequencer<Atom>::TryWaitResult::TIMEDOUT;
  }

  bool mayDequeue(const uint32_t turn) const noexcept {
    return sequencer_.isTurn(turn * 2 + 1);
  }

 private:
  /// Storage for a T constructed with placement new
  typename std::aligned_storage<sizeof(T), alignof(T)>::type contents_;

  /// Even turns are pushes, odd turns are pops
  TurnSequencer<Atom> sequencer_;

  T* ptr() noexcept {
    return static_cast<T*>(static_cast<void*>(&contents_));
  }

  void destroyContents() noexcept {
    try {
      ptr()->~T();
    } catch (...) {
      // g++ doesn't seem to have std::is_nothrow_destructible yet
    }
#ifndef NDEBUG
    memset(&contents_, 'Q', sizeof(T));
#endif
  }

  /// Tag classes for dispatching to enqueue/dequeue implementation.
  struct ImplByRelocation {};
  struct ImplByMove {};

  /// enqueue using nothrow move construction.
  void enqueueImpl(
      const uint32_t turn,
      Atom<uint32_t>& spinCutoff,
      const bool updateSpinCutoff,
      T&& goner,
      ImplByMove) noexcept {
    sequencer_.waitForTurn(turn * 2, spinCutoff, updateSpinCutoff);
    new (&contents_) T(std::move(goner));
    sequencer_.completeTurn(turn * 2);
  }

  /// enqueue by simulating nothrow move with relocation, followed by
  /// default construction to a noexcept relocation.
  void enqueueImpl(
      const uint32_t turn,
      Atom<uint32_t>& spinCutoff,
      const bool updateSpinCutoff,
      T&& goner,
      ImplByRelocation) noexcept {
    sequencer_.waitForTurn(turn * 2, spinCutoff, updateSpinCutoff);
    memcpy(&contents_, &goner, sizeof(T));
    sequencer_.completeTurn(turn * 2);
    new (&goner) T();
  }

  /// dequeue by destructing followed by relocation.  This version is preferred,
  /// because as much work as possible can be done before waiting.
  void dequeueImpl(
      uint32_t turn,
      Atom<uint32_t>& spinCutoff,
      const bool updateSpinCutoff,
      T& elem,
      ImplByRelocation) noexcept {
    try {
      elem.~T();
    } catch (...) {
      // unlikely, but if we don't complete our turn the queue will die
    }
    sequencer_.waitForTurn(turn * 2 + 1, spinCutoff, updateSpinCutoff);
    memcpy(&elem, &contents_, sizeof(T));
    sequencer_.completeTurn(turn * 2 + 1);
  }

  /// dequeue by nothrow move assignment.
  void dequeueImpl(
      uint32_t turn,
      Atom<uint32_t>& spinCutoff,
      const bool updateSpinCutoff,
      T& elem,
      ImplByMove) noexcept {
    sequencer_.waitForTurn(turn * 2 + 1, spinCutoff, updateSpinCutoff);
    elem = std::move(*ptr());
    destroyContents();
    sequencer_.completeTurn(turn * 2 + 1);
  }
};

} // namespace detail

} // namespace folly
