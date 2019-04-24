/*
 * Copyright 2017-present Facebook, Inc.
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

#include <folly/concurrency/CacheLocality.h>
#include <folly/concurrency/UnboundedQueue.h>

#include <glog/logging.h>

#include <atomic>
#include <chrono>

namespace folly {

/// DynamicBoundedQueue supports:
/// - Dynamic memory usage that grows and shrink in proportion to the
///   number of elements in the queue.
/// - Adjustable capacity that helps throttle pathological cases of
///   producer-consumer imbalance that may lead to excessive memory
///   usage.
/// - The adjustable capacity can also help prevent deadlock by
///   allowing users to temporarily increase capacity substantially to
///   guarantee accommodating producer requests that cannot wait.
/// - SPSC, SPMC, MPSC, MPMC variants.
/// - Blocking and spinning-only variants.
/// - Inter-operable non-waiting, timed until, timed for, and waiting
///   variants of producer and consumer operations.
/// - Optional variable element weights.
///
/// Element Weights
/// - Queue elements may have variable weights (calculated using a
///   template parameter) that are by default 1.
/// - Element weights count towards the queue's capacity.
/// - Elements weights are not priorities and do not affect element
///   order. Queues with variable element weights follow FIFO order,
///   the same as default queues.
///
/// When to use DynamicBoundedQueue:
/// - If a small maximum capacity may lead to deadlock or performance
///   degradation under bursty patterns and a larger capacity is
///   sufficient.
/// - If the typical queue size is expected to be much lower than the
///   maximum capacity
/// - If an unbounded queue is susceptible to growing too much.
/// - If support for variable element weights is needed.
///
/// When not to use DynamicBoundedQueue?
/// - If dynamic memory allocation is unacceptable or if the maximum
///   capacity needs to be small, then use fixed-size MPMCQueue or (if
///   non-blocking SPSC) ProducerConsumerQueue.
/// - If there is no risk of the queue growing too much, then use
///   UnboundedQueue.
///
/// Setting capacity
/// - The general rule is to set the capacity as high as acceptable.
///   The queue performs best when it is not near full capacity.
/// - The implementation may allow extra slack in capacity (~10%) for
///   amortizing some costly steps. Therefore, precise capacity is not
///   guaranteed and cannot be relied on for synchronization; i.e.,
///   this queue cannot be used as a semaphore.
///
/// Performance expectations:
/// - As long as the queue size is below capacity in the common case,
///   performance is comparable to MPMCQueue and better in cases of
///   higher producer demand.
/// - Performance degrades gracefully at full capacity.
/// - It is recommended to measure performance with different variants
///   when applicable, e.g., DMPMC vs DMPSC. Depending on the use
///   case, sometimes the variant with the higher sequential overhead
///   may yield better results due to, for example, more favorable
///   producer-consumer balance or favorable timing for avoiding
///   costly blocking.
/// - See DynamicBoundedQueueTest.cpp for some benchmark results.
///
/// Template parameters:
/// - T: element type
/// - SingleProducer: true if there can be only one producer at a
///   time.
/// - SingleConsumer: true if there can be only one consumer at a
///   time.
/// - MayBlock: true if producers or consumers may block.
/// - LgSegmentSize (default 8): Log base 2 of number of elements per
///   UnboundedQueue segment.
/// - LgAlign (default 7): Log base 2 of alignment directive; can be
///   used to balance scalability (avoidance of false sharing) with
///   memory efficiency.
/// - WeightFn (DefaultWeightFn<T>): A customizable weight computing type
///   for computing the weights of elements. The default weight is 1.
///
/// Template Aliases:
///   DSPSCQueue<T, MayBlock, LgSegmentSize, LgAlign>
///   DMPSCQueue<T, MayBlock, LgSegmentSize, LgAlign>
///   DSPMCQueue<T, MayBlock, LgSegmentSize, LgAlign>
///   DMPMCQueue<T, MayBlock, LgSegmentSize, LgAlign>
///
/// Functions:
///   Constructor
///     Takes a capacity value as an argument.
///
///   Producer functions:
///     void enqueue(const T&);
///     void enqueue(T&&);
///         Adds an element to the end of the queue. Waits until
///         capacity is available if necessary.
///     bool try_enqueue(const T&);
///     bool try_enqueue(T&&);
///         Tries to add an element to the end of the queue if
///         capacity allows it. Returns true if successful. Otherwise
///         Returns false.
///     bool try_enqueue_until(const T&, time_point& deadline);
///     bool try_enqueue_until(T&&, time_point& deadline);
///         Tries to add an element to the end of the queue if
///         capacity allows it until the specified deadline. Returns
///         true if successful, otherwise false.
///     bool try_enqueue_for(const T&, duration&);
///     bool try_enqueue_for(T&&, duration&);
///         Tries to add an element to the end of the queue if
///         capacity allows until the expiration of the specified
///         duration. Returns true if successful, otherwise false.
///
///   Consumer functions:
///     void dequeue(T&);
///         Extracts an element from the front of the queue. Waits
///         until an element is available if necessary.
///     bool try_dequeue(T&);
///         Tries to extracts an element from the front of the queue
///         if available. Returns true if successful, otherwise false.
///     bool try_dequeue_until(T&, time_point& deadline);
///         Tries to extracts an element from the front of the queue
///         if available until the specified daedline. Returns true
///         if successful. Otherwise Returns false.
///     bool try_dequeue_for(T&, duration&);
///         Tries to extracts an element from the front of the queue
///         if available until the expiration of the specified
///         duration.  Returns true if successful. Otherwise Returns
///         false.
///
///   Secondary functions:
///     void reset_capacity(size_t capacity);
///        Changes the capacity of the queue. Does not affect the
///        current contents of the queue. Guaranteed only to affect
///        subsequent enqueue operations. May or may not affect
///        concurrent operations. Capacity must be at least 1000.
///     Weight weight();
///        Returns an estimate of the total weight of the elements in
///        the queue.
///     size_t size();
///         Returns an estimate of the total number of elements.
///     bool empty();
///         Returns true only if the queue was empty during the call.
///     Note: weight(), size(), and empty() are guaranteed to be
///     accurate only if there are no concurrent changes to the queue.
///
/// Usage example with default weight:
/// @code
///   /* DMPSC, doesn't block, 1024 int elements per segment */
///   DMPSCQueue<int, false, 10> q(100000);
///   ASSERT_TRUE(q.empty());
///   ASSERT_EQ(q.size(), 0);
///   q.enqueue(1));
///   ASSERT_TRUE(q.try_enqueue(2));
///   ASSERT_TRUE(q.try_enqueue_until(3, deadline));
///   ASSERT_TRUE(q.try_enqueue(4, duration));
///   // ... enqueue more elements until capacity is full
///   // See above comments about imprecise capacity guarantees
///   ASSERT_FALSE(q.try_enqueue(100001)); // can't enqueue but can't wait
///   size_t sz = q.size();
///   ASSERT_GE(sz, 100000);
///   q.reset_capacity(1000000000); // set huge capacity
///   ASSERT_TRUE(q.try_enqueue(100001)); // now enqueue succeeds
///   q.reset_capacity(100000); // set capacity back to 100,000
///   ASSERT_FALSE(q.try_enqueue(100002));
///   ASSERT_EQ(q.size(), sz + 1);
///   int v;
///   q.dequeue(v);
///   ASSERT_EQ(v, 1);
///   ASSERT_TRUE(q.try_dequeue(v));
///   ASSERT_EQ(v, 2);
///   ASSERT_TRUE(q.try_dequeue_until(v, deadline));
///   ASSERT_EQ(v, 3);
///   ASSERT_TRUE(q.try_dequeue_for(v, duration));
///   ASSERT_EQ(v, 4);
///   ASSERT_EQ(q.size(), sz - 3);
/// @endcode
///
/// Usage example with custom weights:
/// @code
///   struct CustomWeightFn {
///     uint64_t operator()(int val) { return val / 100; }
///   };
///   DMPMCQueue<int, false, 10, CustomWeightFn> q(20);
///   ASSERT_TRUE(q.empty());
///   q.enqueue(100);
///   ASSERT_TRUE(q.try_enqueue(200));
///   ASSERT_TRUE(q.try_enqueue_until(500, now() + seconds(1)));
///   ASSERT_EQ(q.size(), 3);
///   ASSERT_EQ(q.weight(), 8);
///   ASSERT_FALSE(q.try_enqueue_for(1700, microseconds(1)));
///   q.reset_capacity(1000000); // set capacity to 1000000 instead of 20
///   ASSERT_TRUE(q.try_enqueue_for(1700, microseconds(1)));
///   q.reset_capacity(20); // set capacity to 20 again
///   ASSERT_FALSE(q.try_enqueue(100));
///   ASSERT_EQ(q.size(), 4);
///   ASSERT_EQ(q.weight(), 25);
///   int v;
///   q.dequeue(v);
///   ASSERT_EQ(v, 100);
///   ASSERT_TRUE(q.try_dequeue(v));
///   ASSERT_EQ(v, 200);
///   ASSERT_TRUE(q.try_dequeue_until(v, now() + seconds(1)));
///   ASSERT_EQ(v, 500);
///   ASSERT_EQ(q.size(), 1);
///   ASSERT_EQ(q.weight(), 17);
/// @endcode
///
/// Design:
/// - The implementation is on top of UnboundedQueue.
/// - The main FIFO functionality is in UnboundedQueue.
///   DynamicBoundedQueue manages keeping the total queue weight
///   within the specified capacity.
/// - For the sake of scalability, the data structures are designed to
///   minimize interference between producers on one side and
///   consumers on the other.
/// - Producers add to a debit variable the weight of the added
///   element and check capacity.
/// - Consumers add to a credit variable the weight of the removed
///   element.
/// - Producers, for the sake of scalability, use fetch_add to add to
///   the debit variable and subtract if it exceeded capacity,
///   rather than using compare_exchange to avoid overshooting.
/// - Consumers, infrequently, transfer credit to a transfer variable
///   and unblock any blocked producers. The transfer variable can be
///   used by producers to decrease their debit when needed.
/// - Note that a low capacity will trigger frequent credit transfer
///   by consumers that may degrade performance. Capacity should not
///   be set too low.
/// - Transfer of credit by consumers is triggered when the amount of
///   credit reaches a threshold (1/10 of capacity).
/// - The waiting of consumers is handled in UnboundedQueue.
///   The waiting of producers is handled in this template.
/// - For a producer operation, if the difference between debit and
///   capacity (plus some slack to account for the transfer threshold)
///   does not accommodate the weight of the new element, it first
///   tries to transfer credit that may have already been made
///   available by consumers. If this is insufficient and MayBlock is
///   true, then the producer uses a futex to block until new credit
///   is transferred by a consumer.
///
/// Memory Usage:
/// - Aside from three cache lines for managing capacity, the memory
///   for queue elements is managed using UnboundedQueue and grows and
///   shrinks dynamically with the number of elements.
/// - The template parameter LgAlign can be used to reduce memory usage
///   at the cost of increased chance of false sharing.

template <typename T>
struct DefaultWeightFn {
  template <typename Arg>
  uint64_t operator()(Arg&&) const noexcept {
    return 1;
  }
};

template <
    typename T,
    bool SingleProducer,
    bool SingleConsumer,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = 7,
    typename WeightFn = DefaultWeightFn<T>,
    template <typename> class Atom = std::atomic>
class DynamicBoundedQueue {
  using Weight = uint64_t;

  enum WaitingState : uint32_t {
    NOTWAITING = 0,
    WAITING = 1,
  };

  static constexpr bool SPSC = SingleProducer && SingleConsumer;
  static constexpr size_t Align = 1u << LgAlign;

  static_assert(LgAlign < 16, "LgAlign must be < 16");

  /// Data members

  // Read mostly by producers
  alignas(Align) Atom<Weight> debit_; // written frequently only by producers
  Atom<Weight> capacity_; // written rarely by capacity resets

  // Read mostly by consumers
  alignas(Align) Atom<Weight> credit_; // written frequently only by consumers
  Atom<Weight> threshold_; // written rarely only by capacity resets

  // Normally written and read rarely by producers and consumers
  // May be read frequently by producers when capacity is full
  alignas(Align) Atom<Weight> transfer_;
  detail::Futex<Atom> waiting_;

  // Underlying unbounded queue
  UnboundedQueue<
      T,
      SingleProducer,
      SingleConsumer,
      MayBlock,
      LgSegmentSize,
      LgAlign,
      Atom>
      q_;

 public:
  /** constructor */
  explicit DynamicBoundedQueue(Weight capacity)
      : debit_(0),
        capacity_(capacity + threshold(capacity)), // capacity slack
        credit_(0),
        threshold_(threshold(capacity)),
        transfer_(0),
        waiting_(0) {}

  /** destructor */
  ~DynamicBoundedQueue() {}

  /// Enqueue functions

  /** enqueue */
  FOLLY_ALWAYS_INLINE void enqueue(const T& v) {
    enqueueImpl(v);
  }

  FOLLY_ALWAYS_INLINE void enqueue(T&& v) {
    enqueueImpl(std::move(v));
  }

  /** try_enqueue */
  FOLLY_ALWAYS_INLINE bool try_enqueue(const T& v) {
    return tryEnqueueImpl(v);
  }

  FOLLY_ALWAYS_INLINE bool try_enqueue(T&& v) {
    return tryEnqueueImpl(std::move(v));
  }

  /** try_enqueue_until */
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE bool try_enqueue_until(
      const T& v,
      const std::chrono::time_point<Clock, Duration>& deadline) {
    return tryEnqueueUntilImpl(v, deadline);
  }

  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE bool try_enqueue_until(
      T&& v,
      const std::chrono::time_point<Clock, Duration>& deadline) {
    return tryEnqueueUntilImpl(std::move(v), deadline);
  }

  /** try_enqueue_for */
  template <typename Rep, typename Period>
  FOLLY_ALWAYS_INLINE bool try_enqueue_for(
      const T& v,
      const std::chrono::duration<Rep, Period>& duration) {
    return tryEnqueueForImpl(v, duration);
  }

  template <typename Rep, typename Period>
  FOLLY_ALWAYS_INLINE bool try_enqueue_for(
      T&& v,
      const std::chrono::duration<Rep, Period>& duration) {
    return tryEnqueueForImpl(std::move(v), duration);
  }

  /// Dequeue functions

  /** dequeue */
  FOLLY_ALWAYS_INLINE void dequeue(T& elem) {
    q_.dequeue(elem);
    addCredit(WeightFn()(elem));
  }

  /** try_dequeue */
  FOLLY_ALWAYS_INLINE bool try_dequeue(T& elem) {
    if (q_.try_dequeue(elem)) {
      addCredit(WeightFn()(elem));
      return true;
    }
    return false;
  }

  /** try_dequeue_until */
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE bool try_dequeue_until(
      T& elem,
      const std::chrono::time_point<Clock, Duration>& deadline) {
    if (q_.try_dequeue_until(elem, deadline)) {
      addCredit(WeightFn()(elem));
      return true;
    }
    return false;
  }

  /** try_dequeue_for */
  template <typename Rep, typename Period>
  FOLLY_ALWAYS_INLINE bool try_dequeue_for(
      T& elem,
      const std::chrono::duration<Rep, Period>& duration) {
    if (q_.try_dequeue_for(elem, duration)) {
      addCredit(WeightFn()(elem));
      return true;
    }
    return false;
  }

  /// Secondary functions

  /** reset_capacity */
  void reset_capacity(Weight capacity) noexcept {
    Weight thresh = threshold(capacity);
    capacity_.store(capacity + thresh, std::memory_order_release);
    threshold_.store(thresh, std::memory_order_release);
  }

  /** weight */
  Weight weight() const noexcept {
    auto d = getDebit();
    auto c = getCredit();
    auto t = getTransfer();
    return d > (c + t) ? d - (c + t) : 0;
  }

  /** size */
  size_t size() const noexcept {
    return q_.size();
  }

  /** empty */
  bool empty() const noexcept {
    return q_.empty();
  }

 private:
  /// Private functions ///

  // Calculation of threshold to move credits in bulk from consumers
  // to producers
  constexpr Weight threshold(Weight capacity) const noexcept {
    return capacity / 10;
  }

  // Functions called frequently by producers

  template <typename Arg>
  FOLLY_ALWAYS_INLINE void enqueueImpl(Arg&& v) {
    tryEnqueueUntilImpl(
        std::forward<Arg>(v), std::chrono::steady_clock::time_point::max());
  }

  template <typename Arg>
  FOLLY_ALWAYS_INLINE bool tryEnqueueImpl(Arg&& v) {
    return tryEnqueueUntilImpl(
        std::forward<Arg>(v), std::chrono::steady_clock::time_point::min());
  }

  template <typename Clock, typename Duration, typename Arg>
  FOLLY_ALWAYS_INLINE bool tryEnqueueUntilImpl(
      Arg&& v,
      const std::chrono::time_point<Clock, Duration>& deadline) {
    Weight weight = WeightFn()(std::forward<Arg>(v));
    if (LIKELY(tryAddDebit(weight))) {
      q_.enqueue(std::forward<Arg>(v));
      return true;
    }
    return tryEnqueueUntilSlow(std::forward<Arg>(v), deadline);
  }

  template <typename Rep, typename Period, typename Arg>
  FOLLY_ALWAYS_INLINE bool tryEnqueueForImpl(
      Arg&& v,
      const std::chrono::duration<Rep, Period>& duration) {
    if (LIKELY(tryEnqueueImpl(std::forward<Arg>(v)))) {
      return true;
    }
    auto deadline = std::chrono::steady_clock::now() + duration;
    return tryEnqueueUntilSlow(std::forward<Arg>(v), deadline);
  }

  FOLLY_ALWAYS_INLINE bool tryAddDebit(Weight weight) noexcept {
    Weight capacity = getCapacity();
    Weight before = fetchAddDebit(weight);
    if (LIKELY(before + weight <= capacity)) {
      return true;
    } else {
      subDebit(weight);
      return false;
    }
  }

  FOLLY_ALWAYS_INLINE Weight getCapacity() const noexcept {
    return capacity_.load(std::memory_order_acquire);
  }

  FOLLY_ALWAYS_INLINE Weight fetchAddDebit(Weight weight) noexcept {
    Weight before;
    if (SingleProducer) {
      before = getDebit();
      debit_.store(before + weight, std::memory_order_relaxed);
    } else {
      before = debit_.fetch_add(weight, std::memory_order_acq_rel);
    }
    return before;
  }

  FOLLY_ALWAYS_INLINE Weight getDebit() const noexcept {
    return debit_.load(std::memory_order_acquire);
  }

  // Functions called frequently by consumers

  FOLLY_ALWAYS_INLINE void addCredit(Weight weight) noexcept {
    Weight before = fetchAddCredit(weight);
    Weight thresh = getThreshold();
    if (before + weight >= thresh && before < thresh) {
      transferCredit();
    }
  }

  FOLLY_ALWAYS_INLINE Weight fetchAddCredit(Weight weight) noexcept {
    Weight before;
    if (SingleConsumer) {
      before = getCredit();
      credit_.store(before + weight, std::memory_order_relaxed);
    } else {
      before = credit_.fetch_add(weight, std::memory_order_acq_rel);
    }
    return before;
  }

  FOLLY_ALWAYS_INLINE Weight getCredit() const noexcept {
    return credit_.load(std::memory_order_acquire);
  }

  FOLLY_ALWAYS_INLINE Weight getThreshold() const noexcept {
    return threshold_.load(std::memory_order_acquire);
  }

  /** Functions called infrequently by producers */

  void subDebit(Weight weight) noexcept {
    Weight before;
    if (SingleProducer) {
      before = getDebit();
      debit_.store(before - weight, std::memory_order_relaxed);
    } else {
      before = debit_.fetch_sub(weight, std::memory_order_acq_rel);
    }
    DCHECK_GE(before, weight);
  }

  template <typename Clock, typename Duration, typename Arg>
  bool tryEnqueueUntilSlow(
      Arg&& v,
      const std::chrono::time_point<Clock, Duration>& deadline) {
    Weight weight = WeightFn()(std::forward<Arg>(v));
    if (canEnqueue(deadline, weight)) {
      q_.enqueue(std::forward<Arg>(v));
      return true;
    } else {
      return false;
    }
  }

  template <typename Clock, typename Duration>
  bool canEnqueue(
      const std::chrono::time_point<Clock, Duration>& deadline,
      Weight weight) noexcept {
    Weight capacity = getCapacity();
    while (true) {
      tryReduceDebit();
      Weight debit = getDebit();
      if ((debit + weight <= capacity) && tryAddDebit(weight)) {
        return true;
      }
      if (deadline < Clock::time_point::max() && Clock::now() >= deadline) {
        return false;
      }
      if (MayBlock) {
        if (canBlock(weight, capacity)) {
          detail::futexWaitUntil(&waiting_, WAITING, deadline);
        }
      } else {
        asm_volatile_pause();
      }
    }
  }

  bool canBlock(Weight weight, Weight capacity) noexcept {
    waiting_.store(WAITING, std::memory_order_relaxed);
    std::atomic_thread_fence(std::memory_order_seq_cst);
    tryReduceDebit();
    Weight debit = getDebit();
    return debit + weight > capacity;
  }

  bool tryReduceDebit() noexcept {
    Weight w = takeTransfer();
    if (w > 0) {
      subDebit(w);
    }
    return w > 0;
  }

  Weight takeTransfer() noexcept {
    Weight w = getTransfer();
    if (w > 0) {
      w = transfer_.exchange(0, std::memory_order_acq_rel);
    }
    return w;
  }

  Weight getTransfer() const noexcept {
    return transfer_.load(std::memory_order_acquire);
  }

  /** Functions called infrequently by consumers */

  void transferCredit() noexcept {
    Weight credit = takeCredit();
    transfer_.fetch_add(credit, std::memory_order_acq_rel);
    if (MayBlock) {
      std::atomic_thread_fence(std::memory_order_seq_cst);
      waiting_.store(NOTWAITING, std::memory_order_relaxed);
      detail::futexWake(&waiting_);
    }
  }

  Weight takeCredit() noexcept {
    Weight credit;
    if (SingleConsumer) {
      credit = credit_.load(std::memory_order_relaxed);
      credit_.store(0, std::memory_order_relaxed);
    } else {
      credit = credit_.exchange(0, std::memory_order_acq_rel);
    }
    return credit;
  }

}; // DynamicBoundedQueue

/// Aliases

/** DSPSCQueue */
template <
    typename T,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = 7,
    typename WeightFn = DefaultWeightFn<T>,
    template <typename> class Atom = std::atomic>
using DSPSCQueue = DynamicBoundedQueue<
    T,
    true,
    true,
    MayBlock,
    LgSegmentSize,
    LgAlign,
    WeightFn,
    Atom>;

/** DMPSCQueue */
template <
    typename T,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = 7,
    typename WeightFn = DefaultWeightFn<T>,
    template <typename> class Atom = std::atomic>
using DMPSCQueue = DynamicBoundedQueue<
    T,
    false,
    true,
    MayBlock,
    LgSegmentSize,
    LgAlign,
    WeightFn,
    Atom>;

/** DSPMCQueue */
template <
    typename T,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = 7,
    typename WeightFn = DefaultWeightFn<T>,
    template <typename> class Atom = std::atomic>
using DSPMCQueue = DynamicBoundedQueue<
    T,
    true,
    false,
    MayBlock,
    LgSegmentSize,
    LgAlign,
    WeightFn,
    Atom>;

/** DMPMCQueue */
template <
    typename T,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = 7,
    typename WeightFn = DefaultWeightFn<T>,
    template <typename> class Atom = std::atomic>
using DMPMCQueue = DynamicBoundedQueue<
    T,
    false,
    false,
    MayBlock,
    LgSegmentSize,
    LgAlign,
    WeightFn,
    Atom>;

} // namespace folly
