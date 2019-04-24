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
#include <condition_variable>
#include <mutex>

#include <folly/Hash.h>
#include <folly/Indestructible.h>
#include <folly/Optional.h>
#include <folly/Portability.h>
#include <folly/Unit.h>
#include <folly/lang/SafeAssert.h>

namespace folly {

namespace parking_lot_detail {

struct WaitNodeBase {
  const uint64_t key_;
  const uint64_t lotid_;
  WaitNodeBase* next_{nullptr};
  WaitNodeBase* prev_{nullptr};

  // tricky: hold both bucket and node mutex to write, either to read
  bool signaled_;
  std::mutex mutex_;
  std::condition_variable cond_;

  WaitNodeBase(uint64_t key, uint64_t lotid)
      : key_(key), lotid_(lotid), signaled_(false) {}

  template <typename Clock, typename Duration>
  std::cv_status wait(std::chrono::time_point<Clock, Duration> deadline) {
    std::cv_status status = std::cv_status::no_timeout;
    std::unique_lock<std::mutex> nodeLock(mutex_);
    while (!signaled_ && status != std::cv_status::timeout) {
      if (deadline != std::chrono::time_point<Clock, Duration>::max()) {
        status = cond_.wait_until(nodeLock, deadline);
      } else {
        cond_.wait(nodeLock);
      }
    }
    return status;
  }

  void wake() {
    std::lock_guard<std::mutex> nodeLock(mutex_);
    signaled_ = true;
    cond_.notify_one();
  }

  bool signaled() {
    return signaled_;
  }
};

extern std::atomic<uint64_t> idallocator;

// Our emulated futex uses 4096 lists of wait nodes.  There are two levels
// of locking: a per-list mutex that controls access to the list and a
// per-node mutex, condvar, and bool that are used for the actual wakeups.
// The per-node mutex allows us to do precise wakeups without thundering
// herds.
struct Bucket {
  std::mutex mutex_;
  WaitNodeBase* head_;
  WaitNodeBase* tail_;
  std::atomic<uint64_t> count_;

  static Bucket& bucketFor(uint64_t key);

  void push_back(WaitNodeBase* node) {
    if (tail_) {
      FOLLY_SAFE_DCHECK(head_, "");
      node->prev_ = tail_;
      tail_->next_ = node;
      tail_ = node;
    } else {
      tail_ = node;
      head_ = node;
    }
  }

  void erase(WaitNodeBase* node) {
    FOLLY_SAFE_DCHECK(count_.load(std::memory_order_relaxed) >= 1, "");
    if (head_ == node && tail_ == node) {
      FOLLY_SAFE_DCHECK(node->prev_ == nullptr, "");
      FOLLY_SAFE_DCHECK(node->next_ == nullptr, "");
      head_ = nullptr;
      tail_ = nullptr;
    } else if (head_ == node) {
      FOLLY_SAFE_DCHECK(node->prev_ == nullptr, "");
      FOLLY_SAFE_DCHECK(node->next_, "");
      head_ = node->next_;
      head_->prev_ = nullptr;
    } else if (tail_ == node) {
      FOLLY_SAFE_DCHECK(node->next_ == nullptr, "");
      FOLLY_SAFE_DCHECK(node->prev_, "");
      tail_ = node->prev_;
      tail_->next_ = nullptr;
    } else {
      FOLLY_SAFE_DCHECK(node->next_, "");
      FOLLY_SAFE_DCHECK(node->prev_, "");
      node->next_->prev_ = node->prev_;
      node->prev_->next_ = node->next_;
    }
    count_.fetch_sub(1, std::memory_order_relaxed);
  }
};

} // namespace parking_lot_detail

enum class UnparkControl {
  RetainContinue,
  RemoveContinue,
  RetainBreak,
  RemoveBreak,
};

enum class ParkResult {
  Skip,
  Unpark,
  Timeout,
};

/*
 * ParkingLot provides an interface that is similar to Linux's futex
 * system call, but with additional functionality.  It is implemented
 * in a portable way on top of std::mutex and std::condition_variable.
 *
 * Additional reading:
 * https://webkit.org/blog/6161/locking-in-webkit/
 * https://github.com/WebKit/webkit/blob/master/Source/WTF/wtf/ParkingLot.h
 * https://locklessinc.com/articles/futex_cheat_sheet/
 *
 * The main difference from futex is that park/unpark take lambdas,
 * such that nearly anything can be done while holding the bucket
 * lock.  Unpark() lambda can also be used to wake up any number of
 * waiters.
 *
 * ParkingLot is templated on the data type, however, all ParkingLot
 * implementations are backed by a single static array of buckets to
 * avoid large memory overhead.  Lambdas will only ever be called on
 * the specific ParkingLot's nodes.
 */
template <typename Data = Unit>
class ParkingLot {
  const uint64_t lotid_;
  ParkingLot(const ParkingLot&) = delete;

  struct WaitNode : public parking_lot_detail::WaitNodeBase {
    const Data data_;

    template <typename D>
    WaitNode(uint64_t key, uint64_t lotid, D&& data)
        : WaitNodeBase(key, lotid), data_(std::forward<D>(data)) {}
  };

 public:
  ParkingLot() : lotid_(parking_lot_detail::idallocator++) {}

  /* Park API
   *
   * Key is almost always the address of a variable.
   *
   * ToPark runs while holding the bucket lock: usually this
   * is a check to see if we can sleep, by checking waiter bits.
   *
   * PreWait is usually used to implement condition variable like
   * things, such that you can unlock the condition variable's lock at
   * the appropriate time.
   */
  template <typename Key, typename D, typename ToPark, typename PreWait>
  ParkResult park(const Key key, D&& data, ToPark&& toPark, PreWait&& preWait) {
    return park_until(
        key,
        std::forward<D>(data),
        std::forward<ToPark>(toPark),
        std::forward<PreWait>(preWait),
        std::chrono::steady_clock::time_point::max());
  }

  template <
      typename Key,
      typename D,
      typename ToPark,
      typename PreWait,
      typename Clock,
      typename Duration>
  ParkResult park_until(
      const Key key,
      D&& data,
      ToPark&& toPark,
      PreWait&& preWait,
      std::chrono::time_point<Clock, Duration> deadline);

  template <
      typename Key,
      typename D,
      typename ToPark,
      typename PreWait,
      typename Rep,
      typename Period>
  ParkResult park_for(
      const Key key,
      D&& data,
      ToPark&& toPark,
      PreWait&& preWait,
      std::chrono::duration<Rep, Period>& timeout) {
    return park_until(
        key,
        std::forward<D>(data),
        std::forward<ToPark>(toPark),
        std::forward<PreWait>(preWait),
        timeout + std::chrono::steady_clock::now());
  }

  /*
   * Unpark API
   *
   * Key is the same uniqueaddress used in park(), and is used as a
   * hash key for lookup of waiters.
   *
   * Unparker is a function that is given the Data parameter, and
   * returns an UnparkControl.  The Remove* results will remove and
   * wake the waiter, the Ignore/Stop results will not, while stopping
   * or continuing iteration of the waiter list.
   */
  template <typename Key, typename Unparker>
  void unpark(const Key key, Unparker&& func);
};

template <typename Data>
template <
    typename Key,
    typename D,
    typename ToPark,
    typename PreWait,
    typename Clock,
    typename Duration>
ParkResult ParkingLot<Data>::park_until(
    const Key bits,
    D&& data,
    ToPark&& toPark,
    PreWait&& preWait,
    std::chrono::time_point<Clock, Duration> deadline) {
  auto key = hash::twang_mix64(uint64_t(bits));
  auto& bucket = parking_lot_detail::Bucket::bucketFor(key);
  WaitNode node(key, lotid_, std::forward<D>(data));

  {
    // A: Must be seq_cst.  Matches B.
    bucket.count_.fetch_add(1, std::memory_order_seq_cst);

    std::unique_lock<std::mutex> bucketLock(bucket.mutex_);

    if (!std::forward<ToPark>(toPark)()) {
      bucketLock.unlock();
      bucket.count_.fetch_sub(1, std::memory_order_relaxed);
      return ParkResult::Skip;
    }

    bucket.push_back(&node);
  } // bucketLock scope

  std::forward<PreWait>(preWait)();

  auto status = node.wait(deadline);

  if (status == std::cv_status::timeout) {
    // it's not really a timeout until we unlink the unsignaled node
    std::lock_guard<std::mutex> bucketLock(bucket.mutex_);
    if (!node.signaled()) {
      bucket.erase(&node);
      return ParkResult::Timeout;
    }
  }

  return ParkResult::Unpark;
}

template <typename Data>
template <typename Key, typename Func>
void ParkingLot<Data>::unpark(const Key bits, Func&& func) {
  auto key = hash::twang_mix64(uint64_t(bits));
  auto& bucket = parking_lot_detail::Bucket::bucketFor(key);
  // B: Must be seq_cst.  Matches A.  If true, A *must* see in seq_cst
  // order any atomic updates in toPark() (and matching updates that
  // happen before unpark is called)
  if (bucket.count_.load(std::memory_order_seq_cst) == 0) {
    return;
  }

  std::lock_guard<std::mutex> bucketLock(bucket.mutex_);

  for (auto iter = bucket.head_; iter != nullptr;) {
    auto node = static_cast<WaitNode*>(iter);
    iter = iter->next_;
    if (node->key_ == key && node->lotid_ == lotid_) {
      auto result = std::forward<Func>(func)(node->data_);
      if (result == UnparkControl::RemoveBreak ||
          result == UnparkControl::RemoveContinue) {
        // we unlink, but waiter destroys the node
        bucket.erase(node);

        node->wake();
      }
      if (result == UnparkControl::RemoveBreak ||
          result == UnparkControl::RetainBreak) {
        return;
      }
    }
  }
}

} // namespace folly
