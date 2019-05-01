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

#include <atomic>
#include <chrono>
#include <memory>

#include <glog/logging.h>

#include <folly/ConstexprMath.h>
#include <folly/Optional.h>
#include <folly/concurrency/CacheLocality.h>
#include <folly/lang/Align.h>
#include <folly/synchronization/Hazptr.h>
#include <folly/synchronization/SaturatingSemaphore.h>
#include <folly/synchronization/WaitOptions.h>
#include <folly/synchronization/detail/Spin.h>

namespace folly {

/// UnboundedQueue supports a variety of options for unbounded
/// dynamically expanding an shrinking queues, including variations of:
/// - Single vs. multiple producers
/// - Single vs. multiple consumers
/// - Blocking vs. spin-waiting
/// - Non-waiting, timed, and waiting consumer operations.
/// Producer operations never wait or fail (unless out-of-memory).
///
/// Template parameters:
/// - T: element type
/// - SingleProducer: true if there can be only one producer at a
///   time.
/// - SingleConsumer: true if there can be only one consumer at a
///   time.
/// - MayBlock: true if consumers may block, false if they only
///   spin. A performance tuning parameter.
/// - LgSegmentSize (default 8): Log base 2 of number of elements per
///   segment. A performance tuning parameter. See below.
/// - LgAlign (default 7): Log base 2 of alignment directive; can be
///   used to balance scalability (avoidance of false sharing) with
///   memory efficiency.
///
/// When to use UnboundedQueue:
/// - If a small bound may lead to deadlock or performance degradation
///   under bursty patterns.
/// - If there is no risk of the queue growing too much.
///
/// When not to use UnboundedQueue:
/// - If there is risk of the queue growing too much and a large bound
///   is acceptable, then use DynamicBoundedQueue.
/// - If the queue must not allocate on enqueue or it must have a
///   small bound, then use fixed-size MPMCQueue or (if non-blocking
///   SPSC) ProducerConsumerQueue.
///
/// Template Aliases:
///   USPSCQueue<T, MayBlock, LgSegmentSize, LgAlign>
///   UMPSCQueue<T, MayBlock, LgSegmentSize, LgAlign>
///   USPMCQueue<T, MayBlock, LgSegmentSize, LgAlign>
///   UMPMCQueue<T, MayBlock, LgSegmentSize, LgAlign>
///
/// Functions:
///   Producer operations never wait or fail (unless OOM)
///     void enqueue(const T&);
///     void enqueue(T&&);
///         Adds an element to the end of the queue.
///
///   Consumer operations:
///     void dequeue(T&);
///         Extracts an element from the front of the queue. Waits
///         until an element is available if needed.
///     bool try_dequeue(T&);
///     folly::Optional<T> try_dequeue();
///         Tries to extract an element from the front of the queue
///         if available.
///     bool try_dequeue_until(T&, time_point& deadline);
///     folly::Optional<T> try_dequeue_until(time_point& deadline);
///         Tries to extract an element from the front of the queue
///         if available until the specified deadline.
///     bool try_dequeue_for(T&, duration&);
///     folly::Optional<T> try_dequeue_for(duration&);
///         Tries to extract an element from the front of the queue if
///         available until the expiration of the specified duration.
///     const T* try_peek();
///         Returns pointer to the element at the front of the queue
///         if available, or nullptr if the queue is empty. Only for
///         SPSC and MPSC.
///
///   Secondary functions:
///     size_t size();
///         Returns an estimate of the size of the queue.
///     bool empty();
///         Returns true only if the queue was empty during the call.
///     Note: size() and empty() are guaranteed to be accurate only if
///     the queue is not changed concurrently.
///
/// Usage examples:
/// @code
///   /* UMPSC, doesn't block, 1024 int elements per segment */
///   UMPSCQueue<int, false, 10> q;
///   q.enqueue(1);
///   q.enqueue(2);
///   q.enqueue(3);
///   ASSERT_FALSE(q.empty());
///   ASSERT_EQ(q.size(), 3);
///   int v;
///   q.dequeue(v);
///   ASSERT_EQ(v, 1);
///   ASSERT_TRUE(try_dequeue(v));
///   ASSERT_EQ(v, 2);
///   ASSERT_TRUE(try_dequeue_until(v, now() + seconds(1)));
///   ASSERT_EQ(v, 3);
///   ASSERT_TRUE(q.empty());
///   ASSERT_EQ(q.size(), 0);
///   ASSERT_FALSE(try_dequeue(v));
///   ASSERT_FALSE(try_dequeue_for(v, microseconds(100)));
/// @endcode
///
/// Design:
/// - The queue is composed of one or more segments. Each segment has
///   a fixed size of 2^LgSegmentSize entries. Each segment is used
///   exactly once.
/// - Each entry is composed of a futex and a single element.
/// - The queue contains two 64-bit ticket variables. The producer
///   ticket counts the number of producer tickets issued so far, and
///   the same for the consumer ticket. Each ticket number corresponds
///   to a specific entry in a specific segment.
/// - The queue maintains two pointers, head and tail. Head points to
///   the segment that corresponds to the current consumer
///   ticket. Similarly, tail pointer points to the segment that
///   corresponds to the producer ticket.
/// - Segments are organized as a singly linked list.
/// - The producer with the first ticket in the current producer
///   segment has primary responsibility for allocating and linking
///   the next segment. Other producers and connsumers may help do so
///   when needed if that thread is delayed.
/// - The producer with the last ticket in the current producer
///   segment is primarily responsible for advancing the tail pointer
///   to the next segment. Other producers and consumers may help do
///   so when needed if that thread is delayed.
/// - Similarly, the consumer with the last ticket in the current
///   consumer segment is primarily responsible for advancing the head
///   pointer to the next segment. Other consumers may help do so when
///   needed if that thread is delayed.
/// - The tail pointer must not lag behind the head pointer.
///   Otherwise, the algorithm cannot be certain about the removal of
///   segment and would have to incur higher costs to ensure safe
///   reclamation.  Consumers must ensure that head never overtakes
///   tail.
///
/// Memory Usage:
/// - An empty queue contains one segment. A nonempty queue contains
///   one or two more segment than fits its contents.
/// - Removed segments are not reclaimed until there are no threads,
///   producers or consumers, with references to them or their
///   predecessors. That is, a lagging thread may delay the reclamation
///   of a chain of removed segments.
/// - The template parameter LgAlign can be used to reduce memory usage
///   at the cost of increased chance of false sharing.
///
/// Performance considerations:
/// - All operations take constant time, excluding the costs of
///   allocation, reclamation, interference from other threads, and
///   waiting for actions by other threads.
/// - In general, using the single producer and or single consumer
///   variants yield better performance than the MP and MC
///   alternatives.
/// - SPSC without blocking is the fastest configuration. It doesn't
///   include any read-modify-write atomic operations, full fences, or
///   system calls in the critical path.
/// - MP adds a fetch_add to the critical path of each producer operation.
/// - MC adds a fetch_add or compare_exchange to the critical path of
///   each consumer operation.
/// - The possibility of consumers blocking, even if they never do,
///   adds a compare_exchange to the critical path of each producer
///   operation.
/// - MPMC, SPMC, MPSC require the use of a deferred reclamation
///   mechanism to guarantee that segments removed from the linked
///   list, i.e., unreachable from the head pointer, are reclaimed
///   only after they are no longer needed by any lagging producers or
///   consumers.
/// - The overheads of segment allocation and reclamation are intended
///   to be mostly out of the critical path of the queue's throughput.
/// - If the template parameter LgSegmentSize is changed, it should be
///   set adequately high to keep the amortized cost of allocation and
///   reclamation low.
/// - It is recommended to measure performance with different variants
///   when applicable, e.g., UMPMC vs UMPSC. Depending on the use
///   case, sometimes the variant with the higher sequential overhead
///   may yield better results due to, for example, more favorable
///   producer-consumer balance or favorable timing for avoiding
///   costly blocking.

template <
    typename T,
    bool SingleProducer,
    bool SingleConsumer,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = constexpr_log2(hardware_destructive_interference_size),
    template <typename> class Atom = std::atomic>
class UnboundedQueue {
  using Ticket = uint64_t;
  class Entry;
  class Segment;

  static constexpr bool SPSC = SingleProducer && SingleConsumer;
  static constexpr size_t Stride = SPSC || (LgSegmentSize <= 1) ? 1 : 27;
  static constexpr size_t SegmentSize = 1u << LgSegmentSize;
  static constexpr size_t Align = 1u << LgAlign;

  static_assert(
      std::is_nothrow_destructible<T>::value,
      "T must be nothrow_destructible");
  static_assert((Stride & 1) == 1, "Stride must be odd");
  static_assert(LgSegmentSize < 32, "LgSegmentSize must be < 32");
  static_assert(LgAlign < 16, "LgAlign must be < 16");

  struct Consumer {
    Atom<Segment*> head;
    Atom<Ticket> ticket;
    explicit Consumer(Segment* s) : head(s), ticket(0) {}
  };
  struct Producer {
    Atom<Segment*> tail;
    Atom<Ticket> ticket;
    explicit Producer(Segment* s) : tail(s), ticket(0) {}
  };

  alignas(Align) Consumer c_;
  alignas(Align) Producer p_;

 public:
  /** constructor */
  UnboundedQueue()
      : c_(new Segment(0)), p_(c_.head.load(std::memory_order_relaxed)) {}

  /** destructor */
  ~UnboundedQueue() {
    cleanUpRemainingItems();
    reclaimRemainingSegments();
  }

  /** enqueue */
  FOLLY_ALWAYS_INLINE void enqueue(const T& arg) {
    enqueueImpl(arg);
  }

  FOLLY_ALWAYS_INLINE void enqueue(T&& arg) {
    enqueueImpl(std::move(arg));
  }

  /** dequeue */
  FOLLY_ALWAYS_INLINE void dequeue(T& item) noexcept {
    dequeueImpl(item);
  }

  /** try_dequeue */
  FOLLY_ALWAYS_INLINE bool try_dequeue(T& item) noexcept {
    auto o = try_dequeue();
    if (LIKELY(o.has_value())) {
      item = std::move(*o);
      return true;
    }
    return false;
  }

  FOLLY_ALWAYS_INLINE folly::Optional<T> try_dequeue() noexcept {
    return tryDequeueUntil(std::chrono::steady_clock::time_point::min());
  }

  /** try_dequeue_until */
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE bool try_dequeue_until(
      T& item,
      const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
    folly::Optional<T> o = try_dequeue_until(deadline);

    if (LIKELY(o.has_value())) {
      item = std::move(*o);
      return true;
    }

    return false;
  }

  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE folly::Optional<T> try_dequeue_until(
      const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
    return tryDequeueUntil(deadline);
  }

  /** try_dequeue_for */
  template <typename Rep, typename Period>
  FOLLY_ALWAYS_INLINE bool try_dequeue_for(
      T& item,
      const std::chrono::duration<Rep, Period>& duration) noexcept {
    folly::Optional<T> o = try_dequeue_for(duration);

    if (LIKELY(o.has_value())) {
      item = std::move(*o);
      return true;
    }

    return false;
  }

  template <typename Rep, typename Period>
  FOLLY_ALWAYS_INLINE folly::Optional<T> try_dequeue_for(
      const std::chrono::duration<Rep, Period>& duration) noexcept {
    folly::Optional<T> o = try_dequeue();
    if (LIKELY(o.has_value())) {
      return o;
    }
    return tryDequeueUntil(std::chrono::steady_clock::now() + duration);
  }

  /** try_peek */
  FOLLY_ALWAYS_INLINE const T* try_peek() noexcept {
    /* This function is supported only for USPSC and UMPSC queues. */
    DCHECK(SingleConsumer);
    return tryPeekUntil(std::chrono::steady_clock::time_point::min());
  }

  /** size */
  size_t size() const noexcept {
    auto p = producerTicket();
    auto c = consumerTicket();
    return p > c ? p - c : 0;
  }

  /** empty */
  bool empty() const noexcept {
    auto c = consumerTicket();
    auto p = producerTicket();
    return p <= c;
  }

 private:
  /** enqueueImpl */
  template <typename Arg>
  FOLLY_ALWAYS_INLINE void enqueueImpl(Arg&& arg) {
    if (SPSC) {
      Segment* s = tail();
      enqueueCommon(s, std::forward<Arg>(arg));
    } else {
      // Using hazptr_holder instead of hazptr_local because it is
      // possible that the T ctor happens to use hazard pointers.
      hazptr_holder<Atom> hptr;
      Segment* s = hptr.get_protected(p_.tail);
      enqueueCommon(s, std::forward<Arg>(arg));
    }
  }

  /** enqueueCommon */
  template <typename Arg>
  FOLLY_ALWAYS_INLINE void enqueueCommon(Segment* s, Arg&& arg) {
    Ticket t = fetchIncrementProducerTicket();
    if (!SingleProducer) {
      s = findSegment(s, t);
    }
    DCHECK_GE(t, s->minTicket());
    DCHECK_LT(t, s->minTicket() + SegmentSize);
    size_t idx = index(t);
    Entry& e = s->entry(idx);
    e.putItem(std::forward<Arg>(arg));
    if (responsibleForAlloc(t)) {
      allocNextSegment(s);
    }
    if (responsibleForAdvance(t)) {
      advanceTail(s);
    }
  }

  /** dequeueImpl */
  FOLLY_ALWAYS_INLINE void dequeueImpl(T& item) noexcept {
    if (SPSC) {
      Segment* s = head();
      dequeueCommon(s, item);
    } else {
      // Using hazptr_holder instead of hazptr_local because it is
      // possible to call the T dtor and it may happen to use hazard
      // pointers.
      hazptr_holder<Atom> hptr;
      Segment* s = hptr.get_protected(c_.head);
      dequeueCommon(s, item);
    }
  }

  /** dequeueCommon */
  FOLLY_ALWAYS_INLINE void dequeueCommon(Segment* s, T& item) noexcept {
    Ticket t = fetchIncrementConsumerTicket();
    if (!SingleConsumer) {
      s = findSegment(s, t);
    }
    size_t idx = index(t);
    Entry& e = s->entry(idx);
    e.takeItem(item);
    if (responsibleForAdvance(t)) {
      advanceHead(s);
    }
  }

  /** tryDequeueUntil */
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE folly::Optional<T> tryDequeueUntil(
      const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
    if (SingleConsumer) {
      Segment* s = head();
      return tryDequeueUntilSC(s, deadline);
    } else {
      // Using hazptr_holder instead of hazptr_local because it is
      //  possible to call ~T() and it may happen to use hazard pointers.
      hazptr_holder<Atom> hptr;
      Segment* s = hptr.get_protected(c_.head);
      return tryDequeueUntilMC(s, deadline);
    }
  }

  /** tryDequeueUntilSC */
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE folly::Optional<T> tryDequeueUntilSC(
      Segment* s,
      const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
    Ticket t = consumerTicket();
    DCHECK_GE(t, s->minTicket());
    DCHECK_LT(t, (s->minTicket() + SegmentSize));
    size_t idx = index(t);
    Entry& e = s->entry(idx);
    if (UNLIKELY(!tryDequeueWaitElem(e, t, deadline))) {
      return folly::Optional<T>();
    }
    setConsumerTicket(t + 1);
    auto ret = e.takeItem();
    if (responsibleForAdvance(t)) {
      advanceHead(s);
    }
    return ret;
  }

  /** tryDequeueUntilMC */
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE folly::Optional<T> tryDequeueUntilMC(
      Segment* s,
      const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
    while (true) {
      Ticket t = consumerTicket();
      if (UNLIKELY(t >= (s->minTicket() + SegmentSize))) {
        s = getAllocNextSegment(s, t);
        DCHECK(s);
        continue;
      }
      size_t idx = index(t);
      Entry& e = s->entry(idx);
      if (UNLIKELY(!tryDequeueWaitElem(e, t, deadline))) {
        return folly::Optional<T>();
      }
      if (!c_.ticket.compare_exchange_weak(
              t, t + 1, std::memory_order_acq_rel, std::memory_order_acquire)) {
        continue;
      }
      auto ret = e.takeItem();
      if (responsibleForAdvance(t)) {
        advanceHead(s);
      }
      return ret;
    }
  }

  /** tryDequeueWaitElem */
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE bool tryDequeueWaitElem(
      Entry& e,
      Ticket t,
      const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
    if (LIKELY(e.tryWaitUntil(deadline))) {
      return true;
    }
    return t < producerTicket();
  }

  /** tryPeekUntil */
  template <typename Clock, typename Duration>
  FOLLY_ALWAYS_INLINE const T* tryPeekUntil(
      const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
    Segment* s = head();
    Ticket t = consumerTicket();
    DCHECK_GE(t, s->minTicket());
    DCHECK_LT(t, (s->minTicket() + SegmentSize));
    size_t idx = index(t);
    Entry& e = s->entry(idx);
    if (UNLIKELY(!tryDequeueWaitElem(e, t, deadline))) {
      return nullptr;
    }
    return e.peekItem();
  }

  /** findSegment */
  FOLLY_ALWAYS_INLINE
  Segment* findSegment(Segment* s, const Ticket t) noexcept {
    while (UNLIKELY(t >= (s->minTicket() + SegmentSize))) {
      s = getAllocNextSegment(s, t);
      DCHECK(s);
    }
    return s;
  }

  /** getAllocNextSegment */
  Segment* getAllocNextSegment(Segment* s, Ticket t) noexcept {
    Segment* next = s->nextSegment();
    if (!next) {
      DCHECK_GE(t, s->minTicket() + SegmentSize);
      auto diff = t - (s->minTicket() + SegmentSize);
      if (diff > 0) {
        auto dur = std::chrono::microseconds(diff);
        auto deadline = std::chrono::steady_clock::now() + dur;
        WaitOptions opt;
        opt.spin_max(dur);
        detail::spin_pause_until(
            deadline, opt, [s] { return s->nextSegment(); });
        next = s->nextSegment();
        if (next) {
          return next;
        }
      }
      next = allocNextSegment(s);
    }
    DCHECK(next);
    return next;
  }

  /** allocNextSegment */
  Segment* allocNextSegment(Segment* s) {
    auto t = s->minTicket() + SegmentSize;
    Segment* next = new Segment(t);
    next->acquire_ref_safe(); // defined in hazptr_obj_base_linked
    if (!s->casNextSegment(next)) {
      delete next;
      next = s->nextSegment();
    }
    DCHECK(next);
    return next;
  }

  /** advanceTail */
  void advanceTail(Segment* s) noexcept {
    if (SPSC) {
      Segment* next = s->nextSegment();
      DCHECK(next);
      setTail(next);
    } else {
      Ticket t = s->minTicket() + SegmentSize;
      advanceTailToTicket(t);
    }
  }

  /** advanceTailToTicket */
  void advanceTailToTicket(Ticket t) noexcept {
    Segment* s = tail();
    while (s->minTicket() < t) {
      Segment* next = s->nextSegment();
      if (!next) {
        next = allocNextSegment(s);
      }
      DCHECK(next);
      casTail(s, next);
      s = tail();
    }
  }

  /** advanceHead */
  void advanceHead(Segment* s) noexcept {
    if (SPSC) {
      while (tail() == s) {
        /* Wait for producer to advance tail. */
        asm_volatile_pause();
      }
      Segment* next = s->nextSegment();
      DCHECK(next);
      setHead(next);
      reclaimSegment(s);
    } else {
      Ticket t = s->minTicket() + SegmentSize;
      advanceHeadToTicket(t);
    }
  }

  /** advanceHeadToTicket */
  void advanceHeadToTicket(Ticket t) noexcept {
    /* Tail must not lag behind head. Otherwise, the algorithm cannot
       be certain about removal of segments. */
    advanceTailToTicket(t);
    Segment* s = head();
    if (SingleConsumer) {
      DCHECK_EQ(s->minTicket() + SegmentSize, t);
      Segment* next = s->nextSegment();
      DCHECK(next);
      setHead(next);
      reclaimSegment(s);
    } else {
      while (s->minTicket() < t) {
        Segment* next = s->nextSegment();
        DCHECK(next);
        if (casHead(s, next)) {
          reclaimSegment(s);
          s = next;
        }
      }
    }
  }

  /** reclaimSegment */
  void reclaimSegment(Segment* s) noexcept {
    if (SPSC) {
      delete s;
    } else {
      s->retire(); // defined in hazptr_obj_base_linked
    }
  }

  /** cleanUpRemainingItems */
  void cleanUpRemainingItems() {
    auto end = producerTicket();
    auto s = head();
    for (auto t = consumerTicket(); t < end; ++t) {
      if (t >= s->minTicket() + SegmentSize) {
        s = s->nextSegment();
      }
      DCHECK_LT(t, (s->minTicket() + SegmentSize));
      auto idx = index(t);
      auto& e = s->entry(idx);
      e.destroyItem();
    }
  }

  /** reclaimRemainingSegments */
  void reclaimRemainingSegments() {
    auto h = head();
    auto s = h->nextSegment();
    h->setNextSegment(nullptr);
    reclaimSegment(h);
    while (s) {
      auto next = s->nextSegment();
      delete s;
      s = next;
    }
  }

  FOLLY_ALWAYS_INLINE size_t index(Ticket t) const noexcept {
    return (t * Stride) & (SegmentSize - 1);
  }

  FOLLY_ALWAYS_INLINE bool responsibleForAlloc(Ticket t) const noexcept {
    return (t & (SegmentSize - 1)) == 0;
  }

  FOLLY_ALWAYS_INLINE bool responsibleForAdvance(Ticket t) const noexcept {
    return (t & (SegmentSize - 1)) == (SegmentSize - 1);
  }

  FOLLY_ALWAYS_INLINE Segment* head() const noexcept {
    return c_.head.load(std::memory_order_acquire);
  }

  FOLLY_ALWAYS_INLINE Segment* tail() const noexcept {
    return p_.tail.load(std::memory_order_acquire);
  }

  FOLLY_ALWAYS_INLINE Ticket producerTicket() const noexcept {
    return p_.ticket.load(std::memory_order_acquire);
  }

  FOLLY_ALWAYS_INLINE Ticket consumerTicket() const noexcept {
    return c_.ticket.load(std::memory_order_acquire);
  }

  void setHead(Segment* s) noexcept {
    DCHECK(SingleConsumer);
    c_.head.store(s, std::memory_order_relaxed);
  }

  void setTail(Segment* s) noexcept {
    DCHECK(SPSC);
    p_.tail.store(s, std::memory_order_release);
  }

  bool casHead(Segment*& s, Segment* next) noexcept {
    DCHECK(!SingleConsumer);
    return c_.head.compare_exchange_strong(
        s, next, std::memory_order_release, std::memory_order_acquire);
  }

  void casTail(Segment*& s, Segment* next) noexcept {
    DCHECK(!SPSC);
    p_.tail.compare_exchange_strong(
        s, next, std::memory_order_release, std::memory_order_relaxed);
  }

  FOLLY_ALWAYS_INLINE void setProducerTicket(Ticket t) noexcept {
    p_.ticket.store(t, std::memory_order_release);
  }

  FOLLY_ALWAYS_INLINE void setConsumerTicket(Ticket t) noexcept {
    c_.ticket.store(t, std::memory_order_release);
  }

  FOLLY_ALWAYS_INLINE Ticket fetchIncrementConsumerTicket() noexcept {
    if (SingleConsumer) {
      Ticket oldval = consumerTicket();
      setConsumerTicket(oldval + 1);
      return oldval;
    } else { // MC
      return c_.ticket.fetch_add(1, std::memory_order_acq_rel);
    }
  }

  FOLLY_ALWAYS_INLINE Ticket fetchIncrementProducerTicket() noexcept {
    if (SingleProducer) {
      Ticket oldval = producerTicket();
      setProducerTicket(oldval + 1);
      return oldval;
    } else { // MP
      return p_.ticket.fetch_add(1, std::memory_order_acq_rel);
    }
  }

  /**
   *  Entry
   */
  class Entry {
    folly::SaturatingSemaphore<MayBlock, Atom> flag_;
    typename std::aligned_storage<sizeof(T), alignof(T)>::type item_;

   public:
    template <typename Arg>
    FOLLY_ALWAYS_INLINE void putItem(Arg&& arg) {
      new (&item_) T(std::forward<Arg>(arg));
      flag_.post();
    }

    FOLLY_ALWAYS_INLINE void takeItem(T& item) noexcept {
      flag_.wait();
      getItem(item);
    }

    FOLLY_ALWAYS_INLINE folly::Optional<T> takeItem() noexcept {
      flag_.wait();
      return getItem();
    }

    FOLLY_ALWAYS_INLINE const T* peekItem() noexcept {
      flag_.wait();
      return itemPtr();
    }

    template <typename Clock, typename Duration>
    FOLLY_ALWAYS_INLINE bool tryWaitUntil(
        const std::chrono::time_point<Clock, Duration>& deadline) noexcept {
      // wait-options from benchmarks on contended queues:
      auto const opt =
          flag_.wait_options().spin_max(std::chrono::microseconds(10));
      return flag_.try_wait_until(deadline, opt);
    }

    FOLLY_ALWAYS_INLINE void destroyItem() noexcept {
      itemPtr()->~T();
    }

   private:
    FOLLY_ALWAYS_INLINE void getItem(T& item) noexcept {
      item = std::move(*(itemPtr()));
      destroyItem();
    }

    FOLLY_ALWAYS_INLINE folly::Optional<T> getItem() noexcept {
      folly::Optional<T> ret = std::move(*(itemPtr()));
      destroyItem();
      return ret;
    }

    FOLLY_ALWAYS_INLINE T* itemPtr() noexcept {
      return static_cast<T*>(static_cast<void*>(&item_));
    }
  }; // Entry

  /**
   *  Segment
   */
  class Segment : public hazptr_obj_base_linked<Segment, Atom> {
    Atom<Segment*> next_{nullptr};
    const Ticket min_;
    alignas(Align) Entry b_[SegmentSize];

   public:
    explicit Segment(const Ticket t) noexcept : min_(t) {}

    Segment* nextSegment() const noexcept {
      return next_.load(std::memory_order_acquire);
    }

    void setNextSegment(Segment* next) {
      next_.store(next, std::memory_order_relaxed);
    }

    bool casNextSegment(Segment* next) noexcept {
      Segment* expected = nullptr;
      return next_.compare_exchange_strong(
          expected, next, std::memory_order_release, std::memory_order_relaxed);
    }

    FOLLY_ALWAYS_INLINE Ticket minTicket() const noexcept {
      DCHECK_EQ((min_ & (SegmentSize - 1)), Ticket(0));
      return min_;
    }

    FOLLY_ALWAYS_INLINE Entry& entry(size_t index) noexcept {
      return b_[index];
    }

    template <typename S>
    void push_links(bool m, S& s) {
      if (m == false) { // next_ is immutable
        auto p = nextSegment();
        if (p) {
          s.push(p);
        }
      }
    }
  }; // Segment

}; // UnboundedQueue

/* Aliases */

template <
    typename T,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = constexpr_log2(hardware_destructive_interference_size),
    template <typename> class Atom = std::atomic>
using USPSCQueue =
    UnboundedQueue<T, true, true, MayBlock, LgSegmentSize, LgAlign, Atom>;

template <
    typename T,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = constexpr_log2(hardware_destructive_interference_size),
    template <typename> class Atom = std::atomic>
using UMPSCQueue =
    UnboundedQueue<T, false, true, MayBlock, LgSegmentSize, LgAlign, Atom>;

template <
    typename T,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = constexpr_log2(hardware_destructive_interference_size),
    template <typename> class Atom = std::atomic>
using USPMCQueue =
    UnboundedQueue<T, true, false, MayBlock, LgSegmentSize, LgAlign, Atom>;

template <
    typename T,
    bool MayBlock,
    size_t LgSegmentSize = 8,
    size_t LgAlign = constexpr_log2(hardware_destructive_interference_size),
    template <typename> class Atom = std::atomic>
using UMPMCQueue =
    UnboundedQueue<T, false, false, MayBlock, LgSegmentSize, LgAlign, Atom>;

} // namespace folly
