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

#include <folly/Function.h>
#include <folly/detail/AtFork.h>
#include <folly/detail/TurnSequencer.h>

namespace folly {

template <typename Tag>
bool rcu_domain<Tag>::singleton_ = false;

template <typename Tag>
rcu_domain<Tag>::rcu_domain(Executor* executor) noexcept
    : executor_(executor ? executor : &QueuedImmediateExecutor::instance()) {
  // Please use a unique tag for each domain.
  CHECK(!singleton_);
  singleton_ = true;

  // Register fork handlers.  Holding read locks across fork is not
  // supported.  Using read locks in other atfork handlers is not
  // supported.  Other atfork handlers launching new child threads
  // that use read locks *is* supported.
  detail::AtFork::registerHandler(
      this,
      [this]() { return syncMutex_.try_lock(); },
      [this]() { syncMutex_.unlock(); },
      [this]() {
        counters_.resetAfterFork();
        syncMutex_.unlock();
      });
}

template <typename Tag>
rcu_domain<Tag>::~rcu_domain() {
  detail::AtFork::unregisterHandler(this);
}

template <typename Tag>
rcu_token rcu_domain<Tag>::lock_shared() {
  auto idx = version_.load(std::memory_order_acquire);
  idx &= 1;
  counters_.increment(idx);

  return idx;
}

template <typename Tag>
void rcu_domain<Tag>::unlock_shared(rcu_token&& token) {
  DCHECK(0 == token.epoch_ || 1 == token.epoch_);
  counters_.decrement(token.epoch_);
}

template <typename Tag>
template <typename T>
void rcu_domain<Tag>::call(T&& cbin) {
  auto node = new list_node;
  node->cb_ = [node, cb = std::forward<T>(cbin)]() {
    cb();
    delete node;
  };
  retire(node);
}

template <typename Tag>
void rcu_domain<Tag>::retire(list_node* node) noexcept {
  q_.push(node);

  // Note that it's likely we hold a read lock here,
  // so we can only half_sync(false).  half_sync(true)
  // or a synchronize() call might block forever.
  uint64_t time = std::chrono::duration_cast<std::chrono::milliseconds>(
                      std::chrono::steady_clock::now().time_since_epoch())
                      .count();
  auto syncTime = syncTime_.load(std::memory_order_relaxed);
  if (time > syncTime + syncTimePeriod_ &&
      syncTime_.compare_exchange_strong(
          syncTime, time, std::memory_order_relaxed)) {
    list_head finished;
    {
      std::lock_guard<std::mutex> g(syncMutex_);
      half_sync(false, finished);
    }
    // callbacks are called outside of syncMutex_
    finished.forEach(
        [&](list_node* item) { executor_->add(std::move(item->cb_)); });
  }
}

template <typename Tag>
void rcu_domain<Tag>::synchronize() noexcept {
  auto curr = version_.load(std::memory_order_acquire);
  // Target is two epochs away.
  auto target = curr + 2;
  while (true) {
    // Try to assign ourselves to do the sync work.
    // If someone else is already assigned, we can wait for
    // the work to be finished by waiting on turn_.
    auto work = work_.load(std::memory_order_acquire);
    auto tmp = work;
    if (work < target && work_.compare_exchange_strong(tmp, target)) {
      list_head finished;
      {
        std::lock_guard<std::mutex> g(syncMutex_);
        while (version_.load(std::memory_order_acquire) < target) {
          half_sync(true, finished);
        }
      }
      // callbacks are called outside of syncMutex_
      finished.forEach(
          [&](list_node* node) { executor_->add(std::move(node->cb_)); });
      return;
    } else {
      if (version_.load(std::memory_order_acquire) >= target) {
        return;
      }
      std::atomic<uint32_t> cutoff{100};
      // Wait for someone to finish the work.
      turn_.tryWaitForTurn(work, cutoff, false);
    }
  }
}

/*
 * Not multithread safe, but it could be with proper version
 * checking and stronger increment of version.  See
 * https://github.com/pramalhe/ConcurrencyFreaks/blob/master/papers/gracesharingurcu-2016.pdf
 *
 * This version, however, can go to sleep if there are outstanding
 * readers, and does not spin or need rescheduling, unless blocking = false.
 */
template <typename Tag>
void rcu_domain<Tag>::half_sync(bool blocking, list_head& finished) {
  uint64_t curr = version_.load(std::memory_order_acquire);
  auto next = curr + 1;

  // Push all work to a queue for moving through two epochs.  One
  // version is not enough because of late readers of the version_
  // counter in lock_shared.
  //
  // Note that for a similar reason we can't swap out the q here,
  // and instead drain it, so concurrent calls to call() are safe,
  // and will wait for the next epoch.
  q_.collect(queues_[0]);

  if (blocking) {
    counters_.waitForZero(next & 1);
  } else {
    if (counters_.readFull(next & 1) != 0) {
      return;
    }
  }

  // Run callbacks that have been through two epochs, and swap queues
  // for those only through a single epoch.
  finished.splice(queues_[1]);
  queues_[1].splice(queues_[0]);

  version_.store(next, std::memory_order_release);
  // Notify synchronous waiters in synchronize().
  turn_.completeTurn(curr);
}

} // namespace folly
