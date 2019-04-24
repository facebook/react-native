/*
 * Copyright 2014-present Facebook, Inc.
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

#include <cassert>
#include <climits>

#include <folly/Function.h>
#include <folly/Utility.h>

namespace folly {

using Func = Function<void()>;

/// An Executor accepts units of work with add(), which should be
/// threadsafe.
class Executor {
 public:
  // Workaround for a linkage problem with explicitly defaulted dtor t22914621
  virtual ~Executor() {}

  /// Enqueue a function to executed by this executor. This and all
  /// variants must be threadsafe.
  virtual void add(Func) = 0;

  /// Enqueue a function with a given priority, where 0 is the medium priority
  /// This is up to the implementation to enforce
  virtual void addWithPriority(Func, int8_t priority);

  virtual uint8_t getNumPriorities() const {
    return 1;
  }

  static const int8_t LO_PRI = SCHAR_MIN;
  static const int8_t MID_PRI = 0;
  static const int8_t HI_PRI = SCHAR_MAX;

  template <typename ExecutorT = Executor>
  class KeepAlive {
   public:
    KeepAlive() = default;

    ~KeepAlive() {
      reset();
    }

    KeepAlive(KeepAlive&& other) noexcept
        : executorAndDummyFlag_(exchange(other.executorAndDummyFlag_, 0)) {}

    template <
        typename OtherExecutor,
        typename = typename std::enable_if<
            std::is_convertible<OtherExecutor*, ExecutorT*>::value>::type>
    /* implicit */ KeepAlive(KeepAlive<OtherExecutor>&& other) noexcept
        : KeepAlive(other.get(), other.executorAndDummyFlag_ & kDummyFlag) {
      other.executorAndDummyFlag_ = 0;
    }

    KeepAlive& operator=(KeepAlive&& other) {
      reset();
      executorAndDummyFlag_ = exchange(other.executorAndDummyFlag_, 0);
      return *this;
    }

    template <
        typename OtherExecutor,
        typename = typename std::enable_if<
            std::is_convertible<OtherExecutor*, ExecutorT*>::value>::type>
    KeepAlive& operator=(KeepAlive<OtherExecutor>&& other) {
      return *this = KeepAlive(std::move(other));
    }

    void reset() {
      if (Executor* executor = get()) {
        if (exchange(executorAndDummyFlag_, 0) & kDummyFlag) {
          return;
        }
        executor->keepAliveRelease();
      }
    }

    explicit operator bool() const {
      return executorAndDummyFlag_;
    }

    ExecutorT* get() const {
      return reinterpret_cast<ExecutorT*>(
          executorAndDummyFlag_ & kExecutorMask);
    }

    ExecutorT& operator*() const {
      return *get();
    }

    ExecutorT* operator->() const {
      return get();
    }

    KeepAlive copy() const {
      return getKeepAliveToken(get());
    }

   private:
    static constexpr intptr_t kDummyFlag = 1;
    static constexpr intptr_t kExecutorMask = ~kDummyFlag;

    friend class Executor;
    template <typename OtherExecutor>
    friend class KeepAlive;

    KeepAlive(ExecutorT* executor, bool dummy)
        : executorAndDummyFlag_(
              reinterpret_cast<intptr_t>(executor) | (dummy ? kDummyFlag : 0)) {
      assert(executor);
      assert(
          (reinterpret_cast<intptr_t>(executor) & kExecutorMask) ==
          reinterpret_cast<intptr_t>(executor));
    }

    intptr_t executorAndDummyFlag_{reinterpret_cast<intptr_t>(nullptr)};
  };

  template <typename ExecutorT>
  static KeepAlive<ExecutorT> getKeepAliveToken(ExecutorT* executor) {
    static_assert(
        std::is_base_of<Executor, ExecutorT>::value,
        "getKeepAliveToken only works for folly::Executor implementations.");
    if (!executor) {
      return {};
    }
    folly::Executor* executorPtr = executor;
    if (executorPtr->keepAliveAcquire()) {
      return makeKeepAlive<ExecutorT>(executor);
    }
    return makeKeepAliveDummy<ExecutorT>(executor);
  }

  template <typename ExecutorT>
  static KeepAlive<ExecutorT> getKeepAliveToken(ExecutorT& executor) {
    static_assert(
        std::is_base_of<Executor, ExecutorT>::value,
        "getKeepAliveToken only works for folly::Executor implementations.");
    return getKeepAliveToken(&executor);
  }

 protected:
  /**
   * Returns true if the KeepAlive is constructed from an executor that does
   * not support the keep alive ref-counting functionality
   */
  template <typename ExecutorT>
  static bool isKeepAliveDummy(const KeepAlive<ExecutorT>& keepAlive) {
    return reinterpret_cast<intptr_t>(keepAlive.executorAndDummyFlag_) &
        KeepAlive<ExecutorT>::kDummyFlag;
  }

  // Acquire a keep alive token. Should return false if keep-alive mechanism
  // is not supported.
  virtual bool keepAliveAcquire();
  // Release a keep alive token previously acquired by keepAliveAcquire().
  // Will never be called if keepAliveAcquire() returns false.
  virtual void keepAliveRelease();

  template <typename ExecutorT>
  static KeepAlive<ExecutorT> makeKeepAlive(ExecutorT* executor) {
    static_assert(
        std::is_base_of<Executor, ExecutorT>::value,
        "makeKeepAlive only works for folly::Executor implementations.");
    return KeepAlive<ExecutorT>{executor, false};
  }

 private:
  template <typename ExecutorT>
  static KeepAlive<ExecutorT> makeKeepAliveDummy(ExecutorT* executor) {
    static_assert(
        std::is_base_of<Executor, ExecutorT>::value,
        "makeKeepAliveDummy only works for folly::Executor implementations.");
    return KeepAlive<ExecutorT>{executor, true};
  }
};

/// Returns a keep-alive token which guarantees that Executor will keep
/// processing tasks until the token is released (if supported by Executor).
/// KeepAlive always contains a valid pointer to an Executor.
template <typename ExecutorT>
Executor::KeepAlive<ExecutorT> getKeepAliveToken(ExecutorT* executor) {
  static_assert(
      std::is_base_of<Executor, ExecutorT>::value,
      "getKeepAliveToken only works for folly::Executor implementations.");
  return Executor::getKeepAliveToken(executor);
}

template <typename ExecutorT>
Executor::KeepAlive<ExecutorT> getKeepAliveToken(ExecutorT& executor) {
  static_assert(
      std::is_base_of<Executor, ExecutorT>::value,
      "getKeepAliveToken only works for folly::Executor implementations.");
  return getKeepAliveToken(&executor);
}

} // namespace folly
