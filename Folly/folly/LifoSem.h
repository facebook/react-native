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

#pragma once

#include <string.h>
#include <stdint.h>
#include <atomic>
#include <algorithm>
#include <memory>
#include <system_error>

#include <folly/AtomicStruct.h>
#include <folly/Baton.h>
#include <folly/IndexedMemPool.h>
#include <folly/Likely.h>
#include <folly/detail/CacheLocality.h>

namespace folly {

template <template<typename> class Atom = std::atomic,
          class BatonType = Baton<Atom>>
struct LifoSemImpl;

/// LifoSem is a semaphore that wakes its waiters in a manner intended to
/// maximize performance rather than fairness.  It should be preferred
/// to a mutex+condvar or POSIX sem_t solution when all of the waiters
/// are equivalent.  It is faster than a condvar or sem_t, and it has a
/// shutdown state that might save you a lot of complexity when it comes
/// time to shut down your work pipelines.  LifoSem is larger than sem_t,
/// but that is only because it uses padding and alignment to avoid
/// false sharing.
///
/// LifoSem allows multi-post and multi-tryWait, and provides a shutdown
/// state that awakens all waiters.  LifoSem is faster than sem_t because
/// it performs exact wakeups, so it often requires fewer system calls.
/// It provides all of the functionality of sem_t except for timed waiting.
/// It is called LifoSem because its wakeup policy is approximately LIFO,
/// rather than the usual FIFO.
///
/// The core semaphore operations provided are:
///
/// -- post() -- if there is a pending waiter, wake it up, otherwise
/// increment the value of the semaphore.  If the value of the semaphore
/// is already 2^32-1, does nothing.  Compare to sem_post().
///
/// -- post(n) -- equivalent to n calls to post(), but much more efficient.
/// sem_t has no equivalent to this method.
///
/// -- bool tryWait() -- if the semaphore's value is positive, decrements it
/// and returns true, otherwise returns false.  Compare to sem_trywait().
///
/// -- uint32_t tryWait(uint32_t n) -- attempts to decrement the semaphore's
/// value by n, returning the amount by which it actually was decremented
/// (a value from 0 to n inclusive).  Not atomic.  Equivalent to n calls
/// to tryWait().  sem_t has no equivalent to this method.
///
/// -- wait() -- waits until tryWait() can succeed.  Compare to sem_wait().
///
/// LifoSem also has the notion of a shutdown state, in which any calls
/// that would block (or are already blocked) throw ShutdownSemError.
/// Note the difference between a call to wait() and a call to wait()
/// that might block.  In the former case tryWait() would succeed, and no
/// isShutdown() check is performed.  In the latter case an exception is
/// thrown.  This behavior allows a LifoSem controlling work distribution
/// to drain.  If you want to immediately stop all waiting on shutdown,
/// you can just check isShutdown() yourself (preferrably wrapped in
/// an UNLIKELY).  This fast-stop behavior is easy to add, but difficult
/// to remove if you want the draining behavior, which is why we have
/// chosen the former.  Since wait() is the only method that can block,
/// it is the only one that is affected by the shutdown state.
///
/// All LifoSem operations operations except valueGuess() are guaranteed
/// to be linearizable.
typedef LifoSemImpl<> LifoSem;


/// The exception thrown when wait()ing on an isShutdown() LifoSem
struct ShutdownSemError : public std::runtime_error {
  explicit ShutdownSemError(const std::string& msg);
  virtual ~ShutdownSemError() noexcept;
};

namespace detail {

// Internally, a LifoSem is either a value or a linked list of wait nodes.
// This union is captured in the LifoSemHead type, which holds either a
// value or an indexed pointer to the list.  LifoSemHead itself is a value
// type, the head is a mutable atomic box containing a LifoSemHead value.
// Each wait node corresponds to exactly one waiter.  Values can flow
// through the semaphore either by going into and out of the head's value,
// or by direct communication from a poster to a waiter.  The former path
// is taken when there are no pending waiters, the latter otherwise.  The
// general flow of a post is to try to increment the value or pop-and-post
// a wait node.  Either of those have the effect of conveying one semaphore
// unit.  Waiting is the opposite, either a decrement of the value or
// push-and-wait of a wait node.  The generic LifoSemBase abstracts the
// actual mechanism by which a wait node's post->wait communication is
// performed, which is why we have LifoSemRawNode and LifoSemNode.

/// LifoSemRawNode is the actual pooled storage that backs LifoSemNode
/// for user-specified Handoff types.  This is done so that we can have
/// a large static IndexedMemPool of nodes, instead of per-type pools
template <template<typename> class Atom>
struct LifoSemRawNode {
  std::aligned_storage<sizeof(void*),alignof(void*)>::type raw;

  /// The IndexedMemPool index of the next node in this chain, or 0
  /// if none.  This will be set to uint32_t(-1) if the node is being
  /// posted due to a shutdown-induced wakeup
  uint32_t next;

  bool isShutdownNotice() const { return next == uint32_t(-1); }
  void clearShutdownNotice() { next = 0; }
  void setShutdownNotice() { next = uint32_t(-1); }

  typedef folly::IndexedMemPool<LifoSemRawNode<Atom>,32,200,Atom> Pool;

  /// Storage for all of the waiter nodes for LifoSem-s that use Atom
  static Pool& pool();
};

/// Use this macro to declare the static storage that backs the raw nodes
/// for the specified atomic type
#define LIFOSEM_DECLARE_POOL(Atom, capacity)                 \
  namespace folly {                                          \
  namespace detail {                                         \
  template <>                                                \
  LifoSemRawNode<Atom>::Pool& LifoSemRawNode<Atom>::pool() { \
    static Pool* instance = new Pool((capacity));            \
    return *instance;                                        \
  }                                                          \
  }                                                          \
  }

/// Handoff is a type not bigger than a void* that knows how to perform a
/// single post() -> wait() communication.  It must have a post() method.
/// If it has a wait() method then LifoSemBase's wait() implementation
/// will work out of the box, otherwise you will need to specialize
/// LifoSemBase::wait accordingly.
template <typename Handoff, template<typename> class Atom>
struct LifoSemNode : public LifoSemRawNode<Atom> {

  static_assert(sizeof(Handoff) <= sizeof(LifoSemRawNode<Atom>::raw),
      "Handoff too big for small-object optimization, use indirection");
  static_assert(alignof(Handoff) <=
                alignof(decltype(LifoSemRawNode<Atom>::raw)),
      "Handoff alignment constraint not satisfied");

  template <typename ...Args>
  void init(Args&&... args) {
    new (&this->raw) Handoff(std::forward<Args>(args)...);
  }

  void destroy() {
    handoff().~Handoff();
#ifndef NDEBUG
    memset(&this->raw, 'F', sizeof(this->raw));
#endif
  }

  Handoff& handoff() {
    return *static_cast<Handoff*>(static_cast<void*>(&this->raw));
  }

  const Handoff& handoff() const {
    return *static_cast<const Handoff*>(static_cast<const void*>(&this->raw));
  }
};

template <typename Handoff, template<typename> class Atom>
struct LifoSemNodeRecycler {
  void operator()(LifoSemNode<Handoff,Atom>* elem) const {
    elem->destroy();
    auto idx = LifoSemRawNode<Atom>::pool().locateElem(elem);
    LifoSemRawNode<Atom>::pool().recycleIndex(idx);
  }
};

/// LifoSemHead is a 64-bit struct that holds a 32-bit value, some state
/// bits, and a sequence number used to avoid ABA problems in the lock-free
/// management of the LifoSem's wait lists.  The value can either hold
/// an integral semaphore value (if there are no waiters) or a node index
/// (see IndexedMemPool) for the head of a list of wait nodes
class LifoSemHead {
  // What we really want are bitfields:
  //  uint64_t data : 32; uint64_t isNodeIdx : 1; uint64_t seq : 31;
  // Unfortunately g++ generates pretty bad code for this sometimes (I saw
  // -O3 code from gcc 4.7.1 copying the bitfields one at a time instead of
  // in bulk, for example).  We can generate better code anyway by assuming
  // that setters won't be given values that cause under/overflow, and
  // putting the sequence at the end where its planned overflow doesn't
  // need any masking.
  //
  // data == 0 (empty list) with isNodeIdx is conceptually the same
  // as data == 0 (no unclaimed increments) with !isNodeIdx, we always
  // convert the former into the latter to make the logic simpler.
  enum {
    IsNodeIdxShift = 32,
    IsShutdownShift = 33,
    SeqShift = 34,
  };
  enum : uint64_t {
    IsNodeIdxMask = uint64_t(1) << IsNodeIdxShift,
    IsShutdownMask = uint64_t(1) << IsShutdownShift,
    SeqIncr = uint64_t(1) << SeqShift,
    SeqMask = ~(SeqIncr - 1),
  };

 public:

  uint64_t bits;

  //////// getters

  inline uint32_t idx() const {
    assert(isNodeIdx());
    assert(uint32_t(bits) != 0);
    return uint32_t(bits);
  }
  inline uint32_t value() const {
    assert(!isNodeIdx());
    return uint32_t(bits);
  }
  inline constexpr bool isNodeIdx() const {
    return (bits & IsNodeIdxMask) != 0;
  }
  inline constexpr bool isShutdown() const {
    return (bits & IsShutdownMask) != 0;
  }
  inline constexpr uint32_t seq() const {
    return uint32_t(bits >> SeqShift);
  }

  //////// setter-like things return a new struct

  /// This should only be used for initial construction, not for setting
  /// the value, because it clears the sequence number
  static inline constexpr LifoSemHead fresh(uint32_t value) {
    return LifoSemHead{ value };
  }

  /// Returns the LifoSemHead that results from popping a waiter node,
  /// given the current waiter node's next ptr
  inline LifoSemHead withPop(uint32_t idxNext) const {
    assert(isNodeIdx());
    if (idxNext == 0) {
      // no isNodeIdx bit or data bits.  Wraparound of seq bits is okay
      return LifoSemHead{ (bits & (SeqMask | IsShutdownMask)) + SeqIncr };
    } else {
      // preserve sequence bits (incremented with wraparound okay) and
      // isNodeIdx bit, replace all data bits
      return LifoSemHead{
          (bits & (SeqMask | IsShutdownMask | IsNodeIdxMask)) +
          SeqIncr + idxNext };
    }
  }

  /// Returns the LifoSemHead that results from pushing a new waiter node
  inline LifoSemHead withPush(uint32_t _idx) const {
    assert(isNodeIdx() || value() == 0);
    assert(!isShutdown());
    assert(_idx != 0);
    return LifoSemHead{ (bits & SeqMask) | IsNodeIdxMask | _idx };
  }

  /// Returns the LifoSemHead with value increased by delta, with
  /// saturation if the maximum value is reached
  inline LifoSemHead withValueIncr(uint32_t delta) const {
    assert(!isNodeIdx());
    auto rv = LifoSemHead{ bits + SeqIncr + delta };
    if (UNLIKELY(rv.isNodeIdx())) {
      // value has overflowed into the isNodeIdx bit
      rv = LifoSemHead{ (rv.bits & ~IsNodeIdxMask) | (IsNodeIdxMask - 1) };
    }
    return rv;
  }

  /// Returns the LifoSemHead that results from decrementing the value
  inline LifoSemHead withValueDecr(uint32_t delta) const {
    assert(delta > 0 && delta <= value());
    return LifoSemHead{ bits + SeqIncr - delta };
  }

  /// Returns the LifoSemHead with the same state as the current node,
  /// but with the shutdown bit set
  inline LifoSemHead withShutdown() const {
    return LifoSemHead{ bits | IsShutdownMask };
  }

  inline constexpr bool operator== (const LifoSemHead& rhs) const {
    return bits == rhs.bits;
  }
  inline constexpr bool operator!= (const LifoSemHead& rhs) const {
    return !(*this == rhs);
  }
};

/// LifoSemBase is the engine for several different types of LIFO
/// semaphore.  LifoSemBase handles storage of positive semaphore values
/// and wait nodes, but the actual waiting and notification mechanism is
/// up to the client.
///
/// The Handoff type is responsible for arranging one wakeup notification.
/// See LifoSemNode for more information on how to make your own.
template <typename Handoff,
          template<typename> class Atom = std::atomic>
struct LifoSemBase {

  /// Constructor
  constexpr explicit LifoSemBase(uint32_t initialValue = 0)
      : head_(LifoSemHead::fresh(initialValue)), padding_() {}

  LifoSemBase(LifoSemBase const&) = delete;
  LifoSemBase& operator=(LifoSemBase const&) = delete;

  /// Silently saturates if value is already 2^32-1
  void post() {
    auto idx = incrOrPop(1);
    if (idx != 0) {
      idxToNode(idx).handoff().post();
    }
  }

  /// Equivalent to n calls to post(), except may be much more efficient.
  /// At any point in time at which the semaphore's value would exceed
  /// 2^32-1 if tracked with infinite precision, it may be silently
  /// truncated to 2^32-1.  This saturation is not guaranteed to be exact,
  /// although it is guaranteed that overflow won't result in wrap-around.
  /// There would be a substantial performance and complexity cost in
  /// guaranteeing exact saturation (similar to the cost of maintaining
  /// linearizability near the zero value, but without as much of
  /// a benefit).
  void post(uint32_t n) {
    uint32_t idx;
    while (n > 0 && (idx = incrOrPop(n)) != 0) {
      // pop accounts for only 1
      idxToNode(idx).handoff().post();
      --n;
    }
  }

  /// Returns true iff shutdown() has been called
  bool isShutdown() const {
    return UNLIKELY(head_.load(std::memory_order_acquire).isShutdown());
  }

  /// Prevents blocking on this semaphore, causing all blocking wait()
  /// calls to throw ShutdownSemError.  Both currently blocked wait() and
  /// future calls to wait() for which tryWait() would return false will
  /// cause an exception.  Calls to wait() for which the matching post()
  /// has already occurred will proceed normally.
  void shutdown() {
    // first set the shutdown bit
    auto h = head_.load(std::memory_order_acquire);
    while (!h.isShutdown()) {
      if (head_.compare_exchange_strong(h, h.withShutdown())) {
        // success
        h = h.withShutdown();
        break;
      }
      // compare_exchange_strong rereads h, retry
    }

    // now wake up any waiters
    while (h.isNodeIdx()) {
      auto& node = idxToNode(h.idx());
      auto repl = h.withPop(node.next);
      if (head_.compare_exchange_strong(h, repl)) {
        // successful pop, wake up the waiter and move on.  The next
        // field is used to convey that this wakeup didn't consume a value
        node.setShutdownNotice();
        node.handoff().post();
        h = repl;
      }
    }
  }

  /// Returns true iff value was decremented
  bool tryWait() {
    uint32_t n = 1;
    auto rv = decrOrPush(n, 0);
    assert((rv == WaitResult::DECR && n == 0) ||
           (rv != WaitResult::DECR && n == 1));
    // SHUTDOWN is okay here, since we don't actually wait
    return rv == WaitResult::DECR;
  }

  /// Equivalent to (but may be much more efficient than) n calls to
  /// tryWait().  Returns the total amount by which the semaphore's value
  /// was decreased
  uint32_t tryWait(uint32_t n) {
    auto const orig = n;
    while (n > 0) {
#ifndef NDEBUG
      auto prev = n;
#endif
      auto rv = decrOrPush(n, 0);
      assert((rv == WaitResult::DECR && n < prev) ||
             (rv != WaitResult::DECR && n == prev));
      if (rv != WaitResult::DECR) {
        break;
      }
    }
    return orig - n;
  }

  /// Blocks the current thread until there is a matching post or the
  /// semaphore is shut down.  Throws ShutdownSemError if the semaphore
  /// has been shut down and this method would otherwise be blocking.
  /// Note that wait() doesn't throw during shutdown if tryWait() would
  /// return true
  void wait() {
    // early check isn't required for correctness, but is an important
    // perf win if we can avoid allocating and deallocating a node
    if (tryWait()) {
      return;
    }

    // allocateNode() won't compile unless Handoff has a default
    // constructor
    UniquePtr node = allocateNode();

    auto rv = tryWaitOrPush(*node);
    if (UNLIKELY(rv == WaitResult::SHUTDOWN)) {
      assert(isShutdown());
      throw ShutdownSemError("wait() would block but semaphore is shut down");
    }

    if (rv == WaitResult::PUSH) {
      node->handoff().wait();
      if (UNLIKELY(node->isShutdownNotice())) {
        // this wait() didn't consume a value, it was triggered by shutdown
        assert(isShutdown());
        throw ShutdownSemError(
            "blocking wait() interrupted by semaphore shutdown");
      }

      // node->handoff().wait() can't return until after the node has
      // been popped and post()ed, so it is okay for the UniquePtr to
      // recycle the node now
    }
    // else node wasn't pushed, so it is safe to recycle
  }

  /// Returns a guess at the current value, designed for debugging.
  /// If there are no concurrent posters or waiters then this will
  /// be correct
  uint32_t valueGuess() const {
    // this is actually linearizable, but we don't promise that because
    // we may want to add striping in the future to help under heavy
    // contention
    auto h = head_.load(std::memory_order_acquire);
    return h.isNodeIdx() ? 0 : h.value();
  }

 protected:

  enum class WaitResult {
    PUSH,
    DECR,
    SHUTDOWN,
  };

  /// The type of a std::unique_ptr that will automatically return a
  /// LifoSemNode to the appropriate IndexedMemPool
  typedef std::unique_ptr<LifoSemNode<Handoff, Atom>,
                          LifoSemNodeRecycler<Handoff, Atom>> UniquePtr;

  /// Returns a node that can be passed to decrOrLink
  template <typename... Args>
  UniquePtr allocateNode(Args&&... args) {
    auto idx = LifoSemRawNode<Atom>::pool().allocIndex();
    if (idx != 0) {
      auto& node = idxToNode(idx);
      node.clearShutdownNotice();
      try {
        node.init(std::forward<Args>(args)...);
      } catch (...) {
        LifoSemRawNode<Atom>::pool().recycleIndex(idx);
        throw;
      }
      return UniquePtr(&node);
    } else {
      return UniquePtr();
    }
  }

  /// Returns DECR if the semaphore value was decremented (and waiterNode
  /// was untouched), PUSH if a reference to the wait node was pushed,
  /// or SHUTDOWN if decrement was not possible and push wasn't allowed
  /// because isShutdown().  Ownership of the wait node remains the
  /// responsibility of the caller, who must not release it until after
  /// the node's Handoff has been posted.
  WaitResult tryWaitOrPush(LifoSemNode<Handoff, Atom>& waiterNode) {
    uint32_t n = 1;
    return decrOrPush(n, nodeToIdx(waiterNode));
  }

 private:

  FOLLY_ALIGN_TO_AVOID_FALSE_SHARING
  folly::AtomicStruct<LifoSemHead,Atom> head_;

  char padding_[folly::detail::CacheLocality::kFalseSharingRange -
      sizeof(LifoSemHead)];


  static LifoSemNode<Handoff, Atom>& idxToNode(uint32_t idx) {
    auto raw = &LifoSemRawNode<Atom>::pool()[idx];
    return *static_cast<LifoSemNode<Handoff, Atom>*>(raw);
  }

  static uint32_t nodeToIdx(const LifoSemNode<Handoff, Atom>& node) {
    return LifoSemRawNode<Atom>::pool().locateElem(&node);
  }

  /// Either increments by n and returns 0, or pops a node and returns it.
  /// If n + the stripe's value overflows, then the stripe's value
  /// saturates silently at 2^32-1
  uint32_t incrOrPop(uint32_t n) {
    while (true) {
      assert(n > 0);

      auto head = head_.load(std::memory_order_acquire);
      if (head.isNodeIdx()) {
        auto& node = idxToNode(head.idx());
        if (head_.compare_exchange_strong(head, head.withPop(node.next))) {
          // successful pop
          return head.idx();
        }
      } else {
        auto after = head.withValueIncr(n);
        if (head_.compare_exchange_strong(head, after)) {
          // successful incr
          return 0;
        }
      }
      // retry
    }
  }

  /// Returns DECR if some amount was decremented, with that amount
  /// subtracted from n.  If n is 1 and this function returns DECR then n
  /// must be 0 afterward.  Returns PUSH if no value could be decremented
  /// and idx was pushed, or if idx was zero and no push was performed but
  /// a push would have been performed with a valid node.  Returns SHUTDOWN
  /// if the caller should have blocked but isShutdown().  If idx == 0,
  /// may return PUSH even after isShutdown() or may return SHUTDOWN
  WaitResult decrOrPush(uint32_t& n, uint32_t idx) {
    assert(n > 0);

    while (true) {
      auto head = head_.load(std::memory_order_acquire);

      if (!head.isNodeIdx() && head.value() > 0) {
        // decr
        auto delta = std::min(n, head.value());
        if (head_.compare_exchange_strong(head, head.withValueDecr(delta))) {
          n -= delta;
          return WaitResult::DECR;
        }
      } else {
        // push
        if (idx == 0) {
          return WaitResult::PUSH;
        }

        if (UNLIKELY(head.isShutdown())) {
          return WaitResult::SHUTDOWN;
        }

        auto& node = idxToNode(idx);
        node.next = head.isNodeIdx() ? head.idx() : 0;
        if (head_.compare_exchange_strong(head, head.withPush(idx))) {
          // push succeeded
          return WaitResult::PUSH;
        }
      }
    }
    // retry
  }
};

} // namespace detail

template <template<typename> class Atom, class BatonType>
struct LifoSemImpl : public detail::LifoSemBase<BatonType, Atom> {
  constexpr explicit LifoSemImpl(uint32_t v = 0)
    : detail::LifoSemBase<BatonType, Atom>(v) {}
};

} // namespace folly
