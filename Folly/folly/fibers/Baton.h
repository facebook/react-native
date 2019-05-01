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

#include <atomic>

#include <folly/Portability.h>
#include <folly/detail/Futex.h>
#include <folly/fibers/TimeoutController.h>

#if FOLLY_HAS_COROUTINES
#include <experimental/coroutine>
#endif

namespace folly {
namespace fibers {

class Fiber;
class FiberManager;

/**
 * @class Baton
 *
 * Primitive which allows one to put current Fiber to sleep and wake it from
 * another Fiber/thread.
 */
class Baton {
 public:
  class TimeoutHandler;

  class Waiter {
   public:
    virtual void post() = 0;

    virtual ~Waiter() {}
  };

  Baton() noexcept;

  ~Baton() noexcept = default;

  bool ready() const {
    auto state = waiter_.load();
    return state == POSTED;
  }

  /**
   * Registers a waiter for the baton. The waiter will be notified when
   * the baton is posted.
   */
  void setWaiter(Waiter& waiter);

  /**
   * Puts active fiber to sleep. Returns when post is called.
   */
  void wait();

  /**
   * Put active fiber to sleep indefinitely. However, timeoutHandler may
   * be used elsewhere on the same thread in order to schedule a wakeup
   * for the active fiber.  Users of timeoutHandler must be on the same thread
   * as the active fiber and may only schedule one timeout, which must occur
   * after the active fiber calls wait.
   */
  void wait(TimeoutHandler& timeoutHandler);

  /**
   * Puts active fiber to sleep. Returns when post is called.
   *
   * @param mainContextFunc this function is immediately executed on the main
   *        context.
   */
  template <typename F>
  void wait(F&& mainContextFunc);

  /**
   * Checks if the baton has been posted without blocking.
   *
   * @return    true iff the baton has been posted.
   */
  bool try_wait();

  /**
   * Puts active fiber to sleep. Returns when post is called or the timeout
   * expires.
   *
   * @param timeout Baton will be automatically awaken if timeout expires
   *
   * @return true if was posted, false if timeout expired
   */
  template <typename Rep, typename Period>
  bool try_wait_for(const std::chrono::duration<Rep, Period>& timeout) {
    return try_wait_for(timeout, [] {});
  }

  /**
   * Puts active fiber to sleep. Returns when post is called or the timeout
   * expires.
   *
   * @param timeout Baton will be automatically awaken if timeout expires
   * @param mainContextFunc this function is immediately executed on the main
   *        context.
   *
   * @return true if was posted, false if timeout expired
   */
  template <typename Rep, typename Period, typename F>
  bool try_wait_for(
      const std::chrono::duration<Rep, Period>& timeout,
      F&& mainContextFunc);

  /**
   * Puts active fiber to sleep. Returns when post is called or the deadline
   * expires.
   *
   * @param timeout Baton will be automatically awaken if deadline expires
   *
   * @return true if was posted, false if timeout expired
   */
  template <typename Clock, typename Duration>
  bool try_wait_until(
      const std::chrono::time_point<Clock, Duration>& deadline) {
    return try_wait_until(deadline, [] {});
  }

  /**
   * Puts active fiber to sleep. Returns when post is called or the deadline
   * expires.
   *
   * @param timeout Baton will be automatically awaken if deadline expires
   * @param mainContextFunc this function is immediately executed on the main
   *        context.
   *
   * @return true if was posted, false if timeout expired
   */
  template <typename Clock, typename Duration, typename F>
  bool try_wait_until(
      const std::chrono::time_point<Clock, Duration>& deadline,
      F&& mainContextFunc);

  /**
   * Puts active fiber to sleep. Returns when post is called or the deadline
   * expires.
   *
   * @param timeout Baton will be automatically awaken if deadline expires
   * @param mainContextFunc this function is immediately executed on the main
   *        context.
   *
   * @return true if was posted, false if timeout expired
   */
  template <typename Clock, typename Duration, typename F>
  bool try_wait_for(
      const std::chrono::time_point<Clock, Duration>& deadline,
      F&& mainContextFunc);

  /// Alias to try_wait_for. Deprecated.
  template <typename Rep, typename Period>
  bool timed_wait(const std::chrono::duration<Rep, Period>& timeout) {
    return try_wait_for(timeout);
  }

  /// Alias to try_wait_for. Deprecated.
  template <typename Rep, typename Period, typename F>
  bool timed_wait(
      const std::chrono::duration<Rep, Period>& timeout,
      F&& mainContextFunc) {
    return try_wait_for(timeout, static_cast<F&&>(mainContextFunc));
  }

  /// Alias to try_wait_until. Deprecated.
  template <typename Clock, typename Duration>
  bool timed_wait(const std::chrono::time_point<Clock, Duration>& deadline) {
    return try_wait_until(deadline);
  }

  /// Alias to try_wait_until. Deprecated.
  template <typename Clock, typename Duration, typename F>
  bool timed_wait(
      const std::chrono::time_point<Clock, Duration>& deadline,
      F&& mainContextFunc) {
    return try_wait_until(deadline, static_cast<F&&>(mainContextFunc));
  }

  /**
   * Wakes up Fiber which was waiting on this Baton (or if no Fiber is waiting,
   * next wait() call will return immediately).
   */
  void post();

  /**
   * Reset's the baton (equivalent to destroying the object and constructing
   * another one in place).
   * Caller is responsible for making sure no one is waiting on/posting the
   * baton when reset() is called.
   */
  void reset();

  /**
   * Provides a way to schedule a wakeup for a wait()ing fiber.
   * A TimeoutHandler must be passed to Baton::wait(TimeoutHandler&)
   * before a timeout is scheduled. It is only safe to use the
   * TimeoutHandler on the same thread as the wait()ing fiber.
   * scheduleTimeout() may only be called once prior to the end of the
   * associated Baton's life.
   */
  class TimeoutHandler {
   public:
    void scheduleTimeout(TimeoutController::Duration timeoutMs);

   private:
    friend class Baton;

    void cancelTimeout();

    std::function<void()> timeoutFunc_{nullptr};
    FiberManager* fiberManager_{nullptr};

    intptr_t timeoutPtr_{0};
  };

 private:
  class FiberWaiter;

  enum {
    /**
     * Must be positive.  If multiple threads are actively using a
     * higher-level data structure that uses batons internally, it is
     * likely that the post() and wait() calls happen almost at the same
     * time.  In this state, we lose big 50% of the time if the wait goes
     * to sleep immediately.  On circa-2013 devbox hardware it costs about
     * 7 usec to FUTEX_WAIT and then be awoken (half the t/iter as the
     * posix_sem_pingpong test in BatonTests).  We can improve our chances
     * of early post by spinning for a bit, although we have to balance
     * this against the loss if we end up sleeping any way.  Spins on this
     * hw take about 7 nanos (all but 0.5 nanos is the pause instruction).
     * We give ourself 300 spins, which is about 2 usec of waiting.  As a
     * partial consolation, since we are using the pause instruction we
     * are giving a speed boost to the colocated hyperthread.
     */
    PreBlockAttempts = 300,
  };

  explicit Baton(intptr_t state) : waiter_(state) {}

  void postHelper(intptr_t new_value);
  void postThread();
  void waitThread();

  template <typename F>
  inline void waitFiber(FiberManager& fm, F&& mainContextFunc);
  /**
   * Spin for "some time" (see discussion on PreBlockAttempts) waiting
   * for a post.
   * @return true if we received a post the spin wait, false otherwise. If the
   *         function returns true then Baton state is guaranteed to be POSTED
   */
  bool spinWaitForEarlyPost();

  bool timedWaitThread(TimeoutController::Duration timeout);

  static constexpr intptr_t NO_WAITER = 0;
  static constexpr intptr_t POSTED = -1;
  static constexpr intptr_t TIMEOUT = -2;
  static constexpr intptr_t THREAD_WAITING = -3;

  union {
    std::atomic<intptr_t> waiter_;
    struct {
      folly::detail::Futex<> futex{};
      int32_t _unused_packing;
    } futex_;
  };
};

#if FOLLY_HAS_COROUTINES
namespace detail {
class BatonAwaitableWaiter : public Baton::Waiter {
 public:
  explicit BatonAwaitableWaiter(Baton& baton) : baton_(baton) {}

  void post() override {
    assert(h_);
    h_();
  }

  bool await_ready() const {
    return baton_.ready();
  }

  void await_resume() {}

  void await_suspend(std::experimental::coroutine_handle<> h) {
    assert(!h_);
    h_ = std::move(h);
    baton_.setWaiter(*this);
  }

 private:
  std::experimental::coroutine_handle<> h_;
  Baton& baton_;
};
} // namespace detail

inline detail::BatonAwaitableWaiter /* implicit */ operator co_await(
    Baton& baton) {
  return detail::BatonAwaitableWaiter(baton);
}
#endif
} // namespace fibers
} // namespace folly

#include <folly/fibers/Baton-inl.h>
