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

#include <folly/io/async/TimeoutManager.h>

#include <folly/portability/Event.h>

#include <boost/noncopyable.hpp>
#include <memory>
#include <utility>

namespace folly {

class EventBase;
class RequestContext;
class TimeoutManager;

/**
 * AsyncTimeout is used to asynchronously wait for a timeout to occur.
 */
class AsyncTimeout : private boost::noncopyable {
 public:
  typedef TimeoutManager::InternalEnum InternalEnum;

  /**
   * Create a new AsyncTimeout object, driven by the specified TimeoutManager.
   */
  explicit AsyncTimeout(TimeoutManager* timeoutManager);
  explicit AsyncTimeout(EventBase* eventBase);

  /**
   * Create a new internal AsyncTimeout object.
   *
   * Internal timeouts are like regular timeouts, but will not stop the
   * TimeoutManager loop from exiting if the only remaining events are internal
   * timeouts.
   *
   * This is useful for implementing fallback timeouts to abort the
   * TimeoutManager loop if the other events have not been processed within a
   * specified time period: if the event loop takes too long the timeout will
   * fire and can stop the event loop.  However, if all other events complete,
   * the event loop will exit even though the internal timeout is still
   * installed.
   */
  AsyncTimeout(TimeoutManager* timeoutManager, InternalEnum internal);
  AsyncTimeout(EventBase* eventBase, InternalEnum internal);

  /**
   * Create a new AsyncTimeout object, not yet assigned to a TimeoutManager.
   *
   * attachEventBase() must be called prior to scheduling the timeout.
   */
  AsyncTimeout();

  /**
   * AsyncTimeout destructor.
   *
   * The timeout will be automatically cancelled if it is running.
   */
  virtual ~AsyncTimeout();

  /**
   * timeoutExpired() is invoked when the timeout period has expired.
   */
  virtual void timeoutExpired() noexcept = 0;

  /**
   * Schedule the timeout to fire in the specified number of milliseconds.
   *
   * After the specified number of milliseconds has elapsed, timeoutExpired()
   * will be invoked by the TimeoutManager's main loop.
   *
   * If the timeout is already running, it will be rescheduled with the
   * new timeout value.
   *
   * @param milliseconds  The timeout duration, in milliseconds.
   *
   * @return Returns true if the timeout was successfully scheduled,
   *         and false if an error occurred.  After an error, the timeout is
   *         always unscheduled, even if scheduleTimeout() was just
   *         rescheduling an existing timeout.
   */
  bool scheduleTimeout(uint32_t milliseconds);
  bool scheduleTimeout(TimeoutManager::timeout_type timeout);

  /**
   * Cancel the timeout, if it is running.
   */
  void cancelTimeout();

  /**
   * Returns true if the timeout is currently scheduled.
   */
  bool isScheduled() const;

  /**
   * Attach the timeout to a TimeoutManager.
   *
   * This may only be called if the timeout is not currently attached to a
   * TimeoutManager (either by using the default constructor, or by calling
   * detachTimeoutManager()).
   *
   * This method must be invoked in the TimeoutManager's thread.
   *
   * The internal parameter specifies if this timeout should be treated as an
   * internal event.  TimeoutManager::loop() will return when there are no more
   * non-internal events remaining.
   */
  void attachTimeoutManager(
      TimeoutManager* timeoutManager,
      InternalEnum internal = InternalEnum::NORMAL);
  void attachEventBase(
      EventBase* eventBase,
      InternalEnum internal = InternalEnum::NORMAL);

  /**
   * Detach the timeout from its TimeoutManager.
   *
   * This may only be called when the timeout is not running.
   * Once detached, the timeout may not be scheduled again until it is
   * re-attached to a EventBase by calling attachEventBase().
   *
   * This method must be called from the current TimeoutManager's thread.
   */
  void detachTimeoutManager();
  void detachEventBase();

  const TimeoutManager* getTimeoutManager() {
    return timeoutManager_;
  }

  /**
   * Returns the internal handle to the event
   */
  struct event* getEvent() {
    return &event_;
  }

  /**
   * Convenience function that wraps a function object as
   * an AsyncTimeout instance and returns the wrapper.
   *
   * Specially useful when using lambdas as AsyncTimeout
   * observers.
   *
   * Example:
   *
   *  void foo(TimeoutManager &manager) {
   *    std::atomic_bool done = false;
   *
   *    auto observer = AsyncTimeout::make(manager, [&] {
   *      std::cout << "hello, world!" << std::endl;
   *      done = true;
   *    });
   *
   *    observer->scheduleTimeout(std::chrono::seconds(5));
   *
   *    while (!done); // busy wait
   *  }
   *
   * @author: Marcelo Juchem <marcelo@fb.com>
   */
  template <typename TCallback>
  static std::unique_ptr<AsyncTimeout> make(
      TimeoutManager& manager,
      TCallback&& callback);

  /**
   * Convenience function that wraps a function object as
   * an AsyncTimeout instance and returns the wrapper
   * after scheduling it using the given TimeoutManager.
   *
   * This is equivalent to calling `make_async_timeout`
   * followed by a `scheduleTimeout` on the resulting
   * wrapper.
   *
   * Specially useful when using lambdas as AsyncTimeout
   * observers.
   *
   * Example:
   *
   *  void foo(TimeoutManager &manager) {
   *    std::atomic_bool done = false;
   *
   *    auto observer = AsyncTimeout::schedule(
   *      std::chrono::seconds(5), manager, [&] {
   *        std::cout << "hello, world!" << std::endl;
   *        done = true;
   *      }
   *    );
   *
   *    while (!done); // busy wait
   *  }
   *
   * @author: Marcelo Juchem <marcelo@fb.com>
   */
  template <typename TCallback>
  static std::unique_ptr<AsyncTimeout> schedule(
      TimeoutManager::timeout_type timeout,
      TimeoutManager& manager,
      TCallback&& callback);

 private:
  static void libeventCallback(libevent_fd_t fd, short events, void* arg);

  struct event event_;

  /*
   * Store a pointer to the TimeoutManager.  We only use this
   * for some assert() statements, to make sure that AsyncTimeout is always
   * used from the correct thread.
   */
  TimeoutManager* timeoutManager_;

  // Save the request context for when the timeout fires.
  std::shared_ptr<RequestContext> context_;
};

namespace detail {

/**
 * Wraps a function object as an AsyncTimeout instance.
 *
 * @author: Marcelo Juchem <marcelo@fb.com>
 */
template <typename TCallback>
struct async_timeout_wrapper : public AsyncTimeout {
  template <typename UCallback>
  async_timeout_wrapper(TimeoutManager* manager, UCallback&& callback)
      : AsyncTimeout(manager), callback_(std::forward<UCallback>(callback)) {}

  void timeoutExpired() noexcept override {
    static_assert(
        noexcept(std::declval<TCallback>()()),
        "callback must be declared noexcept, e.g.: `[]() noexcept {}`");
    callback_();
  }

 private:
  TCallback callback_;
};

} // namespace detail

template <typename TCallback>
std::unique_ptr<AsyncTimeout> AsyncTimeout::make(
    TimeoutManager& manager,
    TCallback&& callback) {
  return std::unique_ptr<AsyncTimeout>(
      new detail::async_timeout_wrapper<typename std::decay<TCallback>::type>(
          std::addressof(manager), std::forward<TCallback>(callback)));
}

template <typename TCallback>
std::unique_ptr<AsyncTimeout> AsyncTimeout::schedule(
    TimeoutManager::timeout_type timeout,
    TimeoutManager& manager,
    TCallback&& callback) {
  auto wrapper = AsyncTimeout::make(manager, std::forward<TCallback>(callback));
  wrapper->scheduleTimeout(timeout);
  return wrapper;
}

} // namespace folly
