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
#include <functional>
#include <limits>

#include <folly/Indestructible.h>
#include <folly/Optional.h>
#include <folly/detail/TurnSequencer.h>
#include <folly/executors/QueuedImmediateExecutor.h>
#include <folly/synchronization/detail/ThreadCachedInts.h>
#include <folly/synchronization/detail/ThreadCachedLists.h>

// Implementation of proposed RCU C++ API
// http://open-std.org/JTC1/SC22/WG21/docs/papers/2017/p0566r3.pdf

// Overview

// This file provides a low-overhead mechanism to guarantee ordering
// between operations on shared data. In the simplest usage pattern,
// readers enter a critical section, view some state, and leave the
// critical section, while writers modify shared state and then defer
// some cleanup operations. Proper use of these classes will guarantee
// that a cleanup operation that is deferred during a reader critical
// section will not be executed until after that critical section is
// over.

// Example

// As an example, suppose we have some configuration data that gets
// periodically updated. We need to protect ourselves on *every* read
// path, even if updates are only vanishly rare, because we don't know
// if some writer will come along and yank the data out from under us.
//
// Here's how that might look without deferral:
//
// void doSomething(IPAddress host);
//
// folly::SharedMutex sm;
// ConfigData* globalConfigData;
//
// void reader() {
//   while (true) {
//     sm.lock_shared();
//     IPAddress curManagementServer = globalConfigData->managementServerIP;
//     sm.unlock_shared();
//     doSomethingWith(curManagementServer);
//   }
// }
//
// void writer() {
//   while (true) {
//     std::this_thread::sleep_for(std::chrono::seconds(60));
//     ConfigData* oldConfigData = globalConfigData;
//     ConfigData* newConfigData = loadConfigDataFromRemoteServer();
//     sm.lock();
//     globalConfigData = newConfigData;
//     sm.unlock();
//     delete oldConfigData;
//   }
// }
//
// The readers have to lock_shared and unlock_shared every iteration, even
// during the overwhelming majority of the time in which there's no writer
// present. These functions are surprisingly expensive; there's around 30ns of
// overhead per critical section on my machine.
//
// Let's get rid of the locking. The readers and writer may proceed
// concurrently. Here's how this would look:
//
// void doSomething(IPAddress host);
//
// std::atomic<ConfigData*> globalConfigData;
//
// void reader() {
//   while (true) {
//     ConfigData* configData = globalConfigData.load();
//     IPAddress curManagementServer = configData->managementServerIP;
//     doSomethingWith(curManagementServer);
//  }
// }
//
// void writer() {
//   while (true) {
//     std::this_thread::sleep_for(std::chrono::seconds(60));
//     ConfigData* newConfigData = loadConfigDataFromRemoteServer();
//     globalConfigData.store(newConfigData);
//     // We can't delete the old ConfigData; we don't know when the readers
//     // will be done with it! I guess we have to leak it...
//   }
// }
//
// This works and is fast, but we don't ever reclaim the memory we
// allocated for the copy of the data. We need a way for the writer to
// know that no readers observed the old value of the pointer and are
// still using it. Tweaking this slightly, we want a way for the
// writer to say "I want some operation (deleting the old ConfigData)
// to happen, but only after I know that all readers that started
// before I requested the action have finished.". The classes in this
// namespace allow this. Here's how we'd express this idea:
//
// void doSomething(IPAddress host);
// std::atomic<ConfigData*> globalConfigData;
//
//
// void reader() {
//   while (true) {
//     IPAddress curManagementServer;
//     {
//       // We're about to do some reads we want to protect; if we read a
//       // pointer, we need to make sure that if the writer comes along and
//       // updates it, the writer's cleanup operation won't happen until we're
//       // done accessing the pointed-to data. We get a Guard on that
//       // domain; as long as it exists, no function subsequently passed to
//       // invokeEventually will execute.
//       rcu_reader guard;
//       ConfigData* configData = globalConfigData.load();
//       // We created a guard before we read globalConfigData; we know that the
//       // pointer will remain valid until the guard is destroyed.
//       curManagementServer = configData->managementServerIP;
//       // Guard is released here; retired objects may be freed.
//     }
//     doSomethingWith(curManagementServer);
//   }
// }
//
// void writer() {
//
//   while (true) {
//     std::this_thread::sleep_for(std::chrono::seconds(60));
//     ConfigData* oldConfigData = globalConfigData.load();
//     ConfigData* newConfigData = loadConfigDataFromRemoteServer();
//     globalConfigData.store(newConfigData);
//     rcu_retire(oldConfigData);
//     // alternatively, in a blocking manner:
//     //   synchronize_rcu();
//     //   delete oldConfigData;
//   }
// }
//
// This gets us close to the speed of the second solution, without
// leaking memory. A rcu_reader costs about 4 ns, faster than the
// lock_shared() / unlock_shared() pair in the more traditional
// mutex-based approach from our first attempt, and the writer
// never blocks the readers.

// Notes

// This implementation does implement an rcu_domain, and provides a default
// one for use per the standard implementation.
//
// rcu_domain:
//   A "universe" of deferred execution. Each rcu_domain has an
//   executor on which deferred functions may execute. Readers obtain
//   Tokens from an rcu_domain and release them back to it.
//   rcu_domains should in general be completely separated; it's never
//   correct to pass a token from one domain to another, and
//   rcu_reader objects created on one domain do not prevent functions
//   deferred on other domains from running. It's intended that most
//   callers should only ever use the default, global domain.
//
//   Creation of a domain takes a template tag argument, which
//   defaults to void. To access different domains, you have to pass a
//   different tag.  The global domain is preferred for almost all
//   purposes, unless a different executor is required.
//
//   You should use a custom rcu_domain if you can't avoid sleeping
//   during reader critical sections (because you don't want to block
//   all other users of the domain while you sleep), or you want to change
//   the default executor type.

// API correctness limitations:
//  - Exceptions:
//    In short, nothing about this is exception safe. retire functions should
//    not throw exceptions in their destructors, move constructors or call
//    operators.
//
// Performance limitations:
//  - Blocking:
//    A blocked reader will block invocation of deferred functions until it
//    becomes unblocked. Sleeping while holding a rcu_reader can have bad
//    performance consequences.
//
// API questions you might have:
//  - Nested critical sections:
//    These are fine. The following is explicitly allowed by the standard, up to
//    a nesting level of 100:
//        rcu_reader reader1;
//        doSomeWork();
//        rcu_reader reader2;
//        doSomeMoreWork();
//  - Restrictions on retired()ed functions:
//    Any operation is safe from within a retired function's
//    execution; you can retire additional functions or add a new domain call to
//    the domain.
//  - rcu_domain destruction:
//    Destruction of a domain assumes previous synchronization: all remaining
//    call and retire calls are immediately added to the executor.

// Overheads

// Deferral latency is as low as is practical: overhead involves running
// several global memory barriers on the machine to ensure all readers are gone.
//
// Currently use of MPMCQueue is the bottleneck for deferred calls, more
// specialized queues could be used if available, since only a single reader
// reads the queue, and can splice all of the items to the executor if possible.
//
// synchronize_rcu() call latency is on the order of 10ms.  Multiple
// separate threads can share a synchronized period and should scale.
//
// rcu_retire() is a queue push, and on the order of 150 ns, however,
// the current implementation may synchronize if the retire queue is full,
// resulting in tail latencies of ~10ms.
//
// rcu_reader creation/destruction is ~4ns.  By comparison,
// folly::SharedMutex::lock_shared + unlock_shared pair is ~26ns

// Hazard pointers vs. RCU:
//
// Hazard pointers protect pointers, generally malloc()d pieces of memory, and
// each hazptr only protects one such block.
//
// RCU protects critical sections, *all* memory is protected as long
// as the critical section is active.
//
// For example, this has implications for linked lists: If you wish to
// free an entire linked list, you simply rcu_retire() each node with
// RCU: readers will see either an entirely valid list, or no list at
// all.
//
// Conversely with hazptrs, generally lists are walked with
// hand-over-hand hazptrs.  Only one node is protected at a time.  So
// anywhere in the middle of the list, hazptrs may read NULL, and throw
// away all current work.  Alternatively, reference counting can be used,
// (as if each node was a shared_ptr<node>), so that readers will always see
// *the remaining part* of the list as valid, however parts before its current
// hazptr may be freed.
//
// So roughly: RCU is simple, but an all-or-nothing affair.  A single rcu_reader
// can block all reclamation. Hazptrs will reclaim exactly as much as possible,
// at the cost of extra work writing traversal code
//
// Reproduced from
// http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2017/p0461r1.pdf
//
//                              Reference Counting    RCU            Hazptr
//
// Unreclaimed objects          Bounded               Unbounded      Bounded
//
// Contention among readers     High                  None           None
//
// Traversal forward progress   lock-free             wait-free      lock-free
//
// Reclamation forward progress lock-free             blocking       wait-free
//
// Traversal speed              atomic                no-overhead    folly's is
//                                                                   no-overhead
//
// Reference acquisition        unconditional         unconditional  conditional
//
// Automatic reclamation        yes                   no             no
//
// Purpose of domains           N/A                   isolate slow configeration
//                                                    readers

namespace folly {

struct RcuTag;

template <typename Tag = RcuTag>
class rcu_domain;

// Opaque token used to match up lock_shared() and unlock_shared()
// pairs.
class rcu_token {
 public:
  rcu_token(uint64_t epoch) : epoch_(epoch) {}
  rcu_token() {}
  ~rcu_token() = default;

  rcu_token(const rcu_token&) = delete;
  rcu_token(rcu_token&& other) = default;
  rcu_token& operator=(const rcu_token& other) = delete;
  rcu_token& operator=(rcu_token&& other) = default;

 private:
  template <typename Tag>
  friend class rcu_domain;
  uint64_t epoch_;
};

// For most usages, rcu_domain is unnecessary, and you can use
// rcu_reader and rcu_retire/synchronize_rcu directly.
template <typename Tag>
class rcu_domain {
  using list_head = typename detail::ThreadCachedLists<Tag>::ListHead;
  using list_node = typename detail::ThreadCachedLists<Tag>::Node;

 public:
  /*
   * If an executor is passed, it is used to run calls and delete
   * retired objects.
   */
  rcu_domain(Executor* executor = nullptr) noexcept;

  rcu_domain(const rcu_domain&) = delete;
  rcu_domain(rcu_domain&&) = delete;
  rcu_domain& operator=(const rcu_domain&) = delete;
  rcu_domain& operator=(rcu_domain&&) = delete;
  ~rcu_domain();

  // Reader locks: Prevent any calls from occuring, retired memory
  // from being freed, and synchronize() calls from completing until
  // all preceding lock_shared() sections are finished.

  // Note: can potentially allocate on thread first use.
  FOLLY_ALWAYS_INLINE rcu_token lock_shared();
  FOLLY_ALWAYS_INLINE void unlock_shared(rcu_token&&);

  // Call a function after concurrent critical sections have finished.
  // Does not block unless the queue is full, then may block to wait
  // for scheduler thread, but generally does not wait for full
  // synchronization.
  template <typename T>
  void call(T&& cbin);
  void retire(list_node* node) noexcept;

  // Ensure concurrent critical sections have finished.
  // Always waits for full synchronization.
  // read lock *must not* be held.
  void synchronize() noexcept;

 private:
  detail::ThreadCachedInts<Tag> counters_;
  // Global epoch.
  std::atomic<uint64_t> version_{0};
  // Future epochs being driven by threads in synchronize
  std::atomic<uint64_t> work_{0};
  // Matches version_, for waking up threads in synchronize that are
  // sharing an epoch.
  detail::TurnSequencer<std::atomic> turn_;
  // Only one thread can drive half_sync.
  std::mutex syncMutex_;
  // Currently half_sync takes ~16ms due to heavy barriers.
  // Ensure that if used in a single thread, max GC time
  // is limited to 1% of total CPU time.
  static constexpr uint64_t syncTimePeriod_{1600 * 2 /* full sync is 2x */};
  std::atomic<uint64_t> syncTime_{0};
  // call()s waiting to move through two epochs.
  detail::ThreadCachedLists<Tag> q_;
  // Executor callbacks will eventually be run on.
  Executor* executor_{nullptr};
  static bool singleton_; // Ensure uniqueness per-tag.

  // Queues for callbacks waiting to go through two epochs.
  list_head queues_[2]{};

  // Move queues through one epoch (half of a full synchronize()).
  // Will block waiting for readers to exit if blocking is true.
  // blocking must *not* be true if the current thread is locked,
  // or will deadlock.
  //
  // returns a list of callbacks ready to run in cbs.
  void half_sync(bool blocking, list_head& cbs);
};

extern folly::Indestructible<rcu_domain<RcuTag>*> rcu_default_domain_;

inline rcu_domain<RcuTag>* rcu_default_domain() {
  return *rcu_default_domain_;
}

// Main reader guard class.
template <typename Tag = RcuTag>
class rcu_reader_domain {
 public:
  FOLLY_ALWAYS_INLINE rcu_reader_domain(
      rcu_domain<Tag>* domain = rcu_default_domain()) noexcept
      : epoch_(domain->lock_shared()), domain_(domain) {}
  rcu_reader_domain(
      std::defer_lock_t,
      rcu_domain<Tag>* domain = rcu_default_domain()) noexcept
      : domain_(domain) {}
  rcu_reader_domain(const rcu_reader_domain&) = delete;
  rcu_reader_domain(rcu_reader_domain&& other) noexcept
      : epoch_(std::move(other.epoch_)),
        domain_(std::exchange(other.domain_, nullptr)) {}
  rcu_reader_domain& operator=(const rcu_reader_domain&) = delete;
  rcu_reader_domain& operator=(rcu_reader_domain&& other) noexcept {
    if (epoch_.has_value()) {
      domain_->unlock_shared(std::move(epoch_.value()));
    }
    epoch_ = std::move(other.epoch_);
    domain_ = std::move(other.domain_);
    return *this;
  }

  FOLLY_ALWAYS_INLINE ~rcu_reader_domain() noexcept {
    if (epoch_.has_value()) {
      domain_->unlock_shared(std::move(epoch_.value()));
    }
  }

  void swap(rcu_reader_domain& other) noexcept {
    std::swap(epoch_, other.epoch_);
    std::swap(domain_, other.domain_);
  }

  FOLLY_ALWAYS_INLINE void lock() noexcept {
    DCHECK(!epoch_.has_value());
    epoch_ = domain_->lock_shared();
  }

  FOLLY_ALWAYS_INLINE void unlock() noexcept {
    DCHECK(epoch_.has_value());
    domain_->unlock_shared(std::move(epoch_.value()));
  }

 private:
  Optional<rcu_token> epoch_;
  rcu_domain<Tag>* domain_;
};

using rcu_reader = rcu_reader_domain<RcuTag>;

template <typename Tag = RcuTag>
inline void swap(
    rcu_reader_domain<Tag>& a,
    rcu_reader_domain<Tag>& b) noexcept {
  a.swap(b);
}

template <typename Tag = RcuTag>
inline void synchronize_rcu(
    rcu_domain<Tag>* domain = rcu_default_domain()) noexcept {
  domain->synchronize();
}

template <typename Tag = RcuTag>
inline void rcu_barrier(
    rcu_domain<Tag>* domain = rcu_default_domain()) noexcept {
  domain->synchronize();
}

// Free-function retire.  Always allocates.
template <
    typename T,
    typename D = std::default_delete<T>,
    typename Tag = RcuTag>
void rcu_retire(
    T* p,
    D d = {},
    rcu_domain<Tag>* domain = rcu_default_domain()) {
  domain->call([p, del = std::move(d)]() { del(p); });
}

// Base class for rcu objects.  retire() will use preallocated storage
// from rcu_obj_base, vs.  rcu_retire() which always allocates.
template <
    typename T,
    typename D = std::default_delete<T>,
    typename Tag = RcuTag>
class rcu_obj_base : detail::ThreadCachedListsBase::Node {
 public:
  void retire(D d = {}, rcu_domain<Tag>* domain = rcu_default_domain()) {
    // This implementation assumes folly::Function has enough
    // inline storage for D, otherwise, it allocates.
    this->cb_ = [this, d = std::move(d)]() { d(static_cast<T*>(this)); };
    domain->retire(this);
  }
};

} // namespace folly

#include <folly/synchronization/Rcu-inl.h>
