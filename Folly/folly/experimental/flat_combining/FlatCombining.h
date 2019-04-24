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

#include <folly/Function.h>
#include <folly/IndexedMemPool.h>
#include <folly/Portability.h>
#include <folly/concurrency/CacheLocality.h>
#include <folly/synchronization/SaturatingSemaphore.h>

#include <atomic>
#include <cassert>
#include <mutex>
#include <thread>

namespace folly {

/// Flat combining (FC) was introduced in the SPAA 2010 paper Flat
/// Combining and the Synchronization-Parallelism Tradeoff, by Danny
/// Hendler, Itai Incze, Nir Shavit, and Moran Tzafrir.
/// http://mcg.cs.tau.ac.il/projects/projects/flat-combining
///
/// FC is an alternative to coarse-grained locking for making
/// sequential data structures thread-safe while minimizing the
/// synchronization overheads and cache coherence traffic associated
/// with locking.
///
/// Under FC, when a thread finds the lock contended, it can
/// request (using a request record) that the lock holder execute its
/// operation on the shared data structure. There can be a designated
/// combiner thread or any thread can act as the combiner when it
/// holds the lock.
///
/// Potential advantages of FC include:
/// - Reduced cache coherence traffic
/// - Reduced synchronization overheads, as the overheads of releasing
///   and acquiring the lock are eliminated from the critical path of
///   operating on the data structure.
/// - Opportunities for smart combining, where executing multiple
///   operations together may take less time than executing the
///   operations separately, e.g., K delete_min operations on a
///   priority queue may be combined to take O(K + log N) time instead
///   of O(K * log N).
///
/// This implementation of flat combining supports:

/// - A simple interface that requires minimal extra code by the
///   user. To use this interface efficiently the user-provided
///   functions must be copyable to folly::Function without dynamic
///   allocation. If this is impossible or inconvenient, the user is
///   encouraged to use the custom interface described below.
/// - A custom interface that supports custom combining and custom
///   request structure, either for the sake of smart combining or for
///   efficiently supporting operations that are not be copyable to
///   folly::Function without dynamic allocation.
/// - Both synchronous and asynchronous operations.
/// - Request records with and without thread-caching.
/// - Combining with and without a dedicated combiner thread.
///
/// This implementation differs from the algorithm in the SPAA 2010 paper:
/// - It does not require thread caching of request records
/// - It supports a dedicated combiner
/// - It supports asynchronous operations
///
/// The generic FC class template supports generic data structures and
/// utilities with arbitrary operations. The template supports static
/// polymorphism for the combining function to enable custom smart
/// combining.
///
/// A simple example of using the FC template:
///   class ConcurrentFoo : public FlatCombining<ConcurrentFoo> {
///     Foo foo_; // sequential data structure
///    public:
///     T bar(V& v) { // thread-safe execution of foo_.bar(v)
///       T result;
///       // Note: fn must be copyable to folly::Function without dynamic
///       // allocation. Otherwise, it is recommended to use the custom
///       // interface and manage the function arguments and results
///       // explicitly in a custom request structure.
///       auto fn = [&] { result = foo_.bar(v); };
///       this->requestFC(fn);
///       return result;
///     }
///   };
///
/// See test/FlatCombiningExamples.h for more examples. See the
/// comments for requestFC() below for a list of simple and custom
/// variants of that function.

template <
    typename T, // concurrent data structure using FC interface
    typename Mutex = std::mutex,
    template <typename> class Atom = std::atomic,
    typename Req = /* default dummy type */ bool>
class FlatCombining {
  using SavedFn = folly::Function<void()>;

 public:
  /// Combining request record.
  class Rec {
    alignas(hardware_destructive_interference_size)
        folly::SaturatingSemaphore<false, Atom> valid_;
    folly::SaturatingSemaphore<false, Atom> done_;
    folly::SaturatingSemaphore<false, Atom> disconnected_;
    size_t index_;
    size_t next_;
    uint64_t last_;
    Req req_;
    SavedFn fn_;

   public:
    Rec() {
      setDone();
      setDisconnected();
    }

    void setValid() {
      valid_.post();
    }

    void clearValid() {
      valid_.reset();
    }

    bool isValid() const {
      return valid_.ready();
    }

    void setDone() {
      done_.post();
    }

    void clearDone() {
      done_.reset();
    }

    bool isDone() const {
      return done_.ready();
    }

    void awaitDone() {
      done_.wait();
    }

    void setDisconnected() {
      disconnected_.post();
    }

    void clearDisconnected() {
      disconnected_.reset();
    }

    bool isDisconnected() const {
      return disconnected_.ready();
    }

    void setIndex(const size_t index) {
      index_ = index;
    }

    size_t getIndex() const {
      return index_;
    }

    void setNext(const size_t next) {
      next_ = next;
    }

    size_t getNext() const {
      return next_;
    }

    void setLast(const uint64_t pass) {
      last_ = pass;
    }

    uint64_t getLast() const {
      return last_;
    }

    Req& getReq() {
      return req_;
    }

    template <typename Func>
    void setFn(Func&& fn) {
      static_assert(
          std::is_nothrow_constructible<
              folly::Function<void()>,
              _t<std::decay<Func>>>::value,
          "Try using a smaller function object that can fit in folly::Function "
          "without allocation, or use the custom interface of requestFC() to "
          "manage the requested function's arguments and results explicitly "
          "in a custom request structure without allocation.");
      fn_ = std::forward<Func>(fn);
      assert(fn_);
    }

    void clearFn() {
      fn_ = {};
      assert(!fn_);
    }

    SavedFn& getFn() {
      return fn_;
    }

    void complete() {
      clearValid();
      assert(!isDone());
      setDone();
    }
  };

  using Pool = folly::
      IndexedMemPool<Rec, 32, 4, Atom, IndexedMemPoolTraitsLazyRecycle<Rec>>;

 public:
  /// The constructor takes three optional arguments:
  /// - Optional dedicated combiner thread (default true)
  /// - Number of records (if 0, then kDefaultNumRecs)
  /// - A hint for the max. number of combined operations per
  ///   combining session that is checked at the beginning of each pass
  ///   on the request records (if 0, then kDefaultMaxops)
  explicit FlatCombining(
      const bool dedicated = true,
      const uint32_t numRecs = 0, // number of combining records
      const uint32_t maxOps = 0 // hint of max ops per combining session
      )
      : numRecs_(numRecs == 0 ? kDefaultNumRecs : numRecs),
        maxOps_(maxOps == 0 ? kDefaultMaxOps : maxOps),
        recs_(NULL_INDEX),
        dedicated_(dedicated),
        recsPool_(numRecs_) {
    if (dedicated_) {
      // dedicated combiner thread
      combiner_ = std::thread([this] { dedicatedCombining(); });
    }
  }

  /// Destructor: If there is a dedicated combiner, the destructor
  /// flags it to shutdown. Otherwise, the destructor waits for all
  /// pending asynchronous requests to be completed.
  ~FlatCombining() {
    if (dedicated_) {
      shutdown();
      combiner_.join();
    } else {
      drainAll();
    }
  }

  // Wait for all pending operations to complete. Useful primarily
  // when there are asynchronous operations without a dedicated
  // combiner.
  void drainAll() {
    for (size_t i = getRecsHead(); i != NULL_INDEX; i = nextIndex(i)) {
      Rec& rec = recsPool_[i];
      awaitDone(rec);
    }
  }

  // Give the caller exclusive access.
  void acquireExclusive() {
    m_.lock();
  }

  // Try to give the caller exclusive access. Returns true iff successful.
  bool tryExclusive() {
    return m_.try_lock();
  }

  // Release exclusive access. The caller must have exclusive access.
  void releaseExclusive() {
    m_.unlock();
  }

  // Give the lock holder ownership of the mutex and exclusive access.
  // No need for explicit release.
  template <typename LockHolder>
  void holdLock(LockHolder& l) {
    l = LockHolder(m_);
  }

  // Give the caller's lock holder ownership of the mutex but without
  // exclusive access. The caller can later use the lock holder to try
  // to acquire exclusive access.
  template <typename LockHolder>
  void holdLock(LockHolder& l, std::defer_lock_t) {
    l = LockHolder(m_, std::defer_lock);
  }

  // Execute an operation without combining
  template <typename OpFunc>
  void requestNoFC(OpFunc& opFn) {
    std::lock_guard<Mutex> guard(m_);
    opFn();
  }

  // This function first tries to execute the operation without
  // combining. If unuccessful, it allocates a combining record if
  // needed. If there are no available records, it waits for exclusive
  // access and executes the operation. If a record is available and
  // ready for use, it fills the record and indicates that the request
  // is valid for combining. If the request is synchronous (by default
  // or necessity), it waits for the operation to be completed by a
  // combiner and optionally extracts the result, if any.
  //
  // This function can be called in several forms:
  //   Simple forms that do not require the user to define a Req structure
  //   or to override any request processing member functions:
  //     requestFC(opFn)
  //     requestFC(opFn, rec) // provides its own pre-allocated record
  //     requestFC(opFn, rec, syncop) // asynchronous if syncop == false
  //   Custom forms that require the user to define a Req structure and to
  //   override some request processing member functions:
  //     requestFC(opFn, fillFn)
  //     requestFC(opFn, fillFn, rec)
  //     requestFC(opFn, fillFn, rec, syncop)
  //     requestFC(opFn, fillFn, resFn)
  //     requestFC(opFn, fillFn, resFn, rec)
  template <typename OpFunc>
  void requestFC(OpFunc&& opFn, Rec* rec = nullptr, bool syncop = true) {
    auto dummy = [](Req&) {};
    requestOp(
        std::forward<OpFunc>(opFn),
        dummy /* fillFn */,
        dummy /* resFn */,
        rec,
        syncop,
        false /* simple */);
  }
  template <typename OpFunc, typename FillFunc>
  void requestFC(
      OpFunc&& opFn,
      const FillFunc& fillFn,
      Rec* rec = nullptr,
      bool syncop = true) {
    auto dummy = [](Req&) {};
    requestOp(
        std::forward<OpFunc>(opFn),
        fillFn,
        dummy /* resFn */,
        rec,
        syncop,
        true /* custom */);
  }
  template <typename OpFunc, typename FillFunc, typename ResFn>
  void requestFC(
      OpFunc&& opFn,
      const FillFunc& fillFn,
      const ResFn& resFn,
      Rec* rec = nullptr) {
    // must wait for result to execute resFn -- so it must be synchronous
    requestOp(
        std::forward<OpFunc>(opFn),
        fillFn,
        resFn,
        rec,
        true /* sync */,
        true /* custom*/);
  }

  // Allocate a record.
  Rec* allocRec() {
    auto idx = recsPool_.allocIndex();
    if (idx == NULL_INDEX) {
      return nullptr;
    }
    Rec& rec = recsPool_[idx];
    rec.setIndex(idx);
    return &rec;
  }

  // Free a record
  void freeRec(Rec* rec) {
    if (rec == nullptr) {
      return;
    }
    auto idx = rec->getIndex();
    recsPool_.recycleIndex(idx);
  }

  // Returns the number of uncombined operations so far.
  uint64_t getNumUncombined() const {
    return uncombined_;
  }

  // Returns the number of combined operations so far.
  uint64_t getNumCombined() const {
    return combined_;
  }

  // Returns the number of combining passes so far.
  uint64_t getNumPasses() const {
    return passes_;
  }

  // Returns the number of combining sessions so far.
  uint64_t getNumSessions() const {
    return sessions_;
  }

 protected:
  const size_t NULL_INDEX = 0;
  const uint32_t kDefaultMaxOps = 100;
  const uint64_t kDefaultNumRecs = 64;
  const uint64_t kIdleThreshold = 10;

  alignas(hardware_destructive_interference_size) Mutex m_;

  alignas(hardware_destructive_interference_size)
      folly::SaturatingSemaphore<true, Atom> pending_;
  Atom<bool> shutdown_{false};

  alignas(hardware_destructive_interference_size) uint32_t numRecs_;
  uint32_t maxOps_;
  Atom<size_t> recs_;
  bool dedicated_;
  std::thread combiner_;
  Pool recsPool_;

  alignas(hardware_destructive_interference_size) uint64_t uncombined_ = 0;
  uint64_t combined_ = 0;
  uint64_t passes_ = 0;
  uint64_t sessions_ = 0;

  template <typename OpFunc, typename FillFunc, typename ResFn>
  void requestOp(
      OpFunc&& opFn,
      const FillFunc& fillFn,
      const ResFn& resFn,
      Rec* rec,
      bool syncop,
      const bool custom) {
    std::unique_lock<Mutex> l(this->m_, std::defer_lock);
    if (l.try_lock()) {
      // No contention
      ++uncombined_;
      tryCombining();
      opFn();
      return;
    }

    // Try FC
    bool tc = (rec != nullptr);
    if (!tc) {
      // if an async op doesn't have a thread-cached record then turn
      // it into a synchronous op.
      syncop = true;
      rec = allocRec();
    }
    if (rec == nullptr) {
      // Can't use FC - Must acquire lock
      l.lock();
      ++uncombined_;
      tryCombining();
      opFn();
      return;
    }

    // Use FC
    // Wait if record is in use
    awaitDone(*rec);
    rec->clearDone();
    // Fill record
    if (custom) {
      // Fill the request (custom)
      Req& req = rec->getReq();
      fillFn(req);
      rec->clearFn();
    } else {
      rec->setFn(std::forward<OpFunc>(opFn));
    }
    // Indicate that record is valid
    assert(!rec->isValid());
    rec->setValid();
    // end of combining critical path
    setPending();
    // store-load order setValid before isDisconnected
    std::atomic_thread_fence(std::memory_order_seq_cst);
    if (rec->isDisconnected()) {
      rec->clearDisconnected();
      pushRec(rec->getIndex());
      setPending();
    }
    // If synchronous wait for the request to be completed
    if (syncop) {
      awaitDone(*rec);
      if (custom) {
        Req& req = rec->getReq();
        resFn(req); // Extract the result (custom)
      }
      if (!tc) {
        freeRec(rec); // Free the temporary record.
      }
    }
  }

  void pushRec(size_t idx) {
    Rec& rec = recsPool_[idx];
    while (true) {
      auto head = recs_.load(std::memory_order_acquire);
      rec.setNext(head); // there shouldn't be a data race here
      if (recs_.compare_exchange_weak(head, idx)) {
        return;
      }
    }
  }

  size_t getRecsHead() {
    return recs_.load(std::memory_order_acquire);
  }

  size_t nextIndex(size_t idx) {
    return recsPool_[idx].getNext();
  }

  void clearPending() {
    pending_.reset();
  }

  void setPending() {
    pending_.post();
  }

  bool isPending() const {
    return pending_.ready();
  }

  void awaitPending() {
    pending_.wait();
  }

  uint64_t combiningSession() {
    uint64_t combined = 0;
    do {
      uint64_t count = static_cast<T*>(this)->combiningPass();
      if (count == 0) {
        break;
      }
      combined += count;
      ++this->passes_;
    } while (combined < this->maxOps_);
    return combined;
  }

  void tryCombining() {
    if (!dedicated_) {
      while (isPending()) {
        clearPending();
        ++sessions_;
        combined_ += combiningSession();
      }
    }
  }

  void dedicatedCombining() {
    while (true) {
      awaitPending();
      clearPending();
      if (shutdown_.load()) {
        break;
      }
      while (true) {
        uint64_t count;
        ++sessions_;
        {
          std::lock_guard<Mutex> guard(m_);
          count = combiningSession();
          combined_ += count;
        }
        if (count < maxOps_) {
          break;
        }
      }
    }
  }

  void awaitDone(Rec& rec) {
    if (dedicated_) {
      rec.awaitDone();
    } else {
      awaitDoneTryLock(rec);
    }
  }

  /// Waits for the request to be done and occasionally tries to
  /// acquire the lock and to do combining. Used only in the absence
  /// of a dedicated combiner.
  void awaitDoneTryLock(Rec& rec) {
    assert(!dedicated_);
    int count = 0;
    while (!rec.isDone()) {
      if (count == 0) {
        std::unique_lock<Mutex> l(m_, std::defer_lock);
        if (l.try_lock()) {
          setPending();
          tryCombining();
        }
      } else {
        folly::asm_volatile_pause();
        if (++count == 1000) {
          count = 0;
        }
      }
    }
  }

  void shutdown() {
    shutdown_.store(true);
    setPending();
  }

  /// The following member functions may be overridden for customization

  void combinedOp(Req&) {
    throw std::runtime_error(
        "FlatCombining::combinedOp(Req&) must be overridden in the derived"
        " class if called.");
  }

  void processReq(Rec& rec) {
    SavedFn& opFn = rec.getFn();
    if (opFn) {
      // simple interface
      opFn();
    } else {
      // custom interface
      Req& req = rec.getReq();
      static_cast<T*>(this)->combinedOp(req); // defined in derived class
    }
    rec.setLast(passes_);
    rec.complete();
  }

  uint64_t combiningPass() {
    uint64_t count = 0;
    auto idx = getRecsHead();
    Rec* prev = nullptr;
    while (idx != NULL_INDEX) {
      Rec& rec = recsPool_[idx];
      auto next = rec.getNext();
      bool valid = rec.isValid();
      if (!valid && (passes_ - rec.getLast() > kIdleThreshold) &&
          (prev != nullptr)) {
        // Disconnect
        prev->setNext(next);
        rec.setDisconnected();
        // store-load order setDisconnected before isValid
        std::atomic_thread_fence(std::memory_order_seq_cst);
        valid = rec.isValid();
      } else {
        prev = &rec;
      }
      if (valid) {
        processReq(rec);
        ++count;
      }
      idx = next;
    }
    return count;
  }
};

} // namespace folly
