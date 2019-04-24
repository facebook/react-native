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

#include <folly/Optional.h>
#include <folly/io/async/AsyncTimeout.h>
#include <folly/io/async/DelayedDestruction.h>

#include <boost/intrusive/list.hpp>
#include <glog/logging.h>

#include <chrono>
#include <cstddef>
#include <list>
#include <memory>

namespace folly {

/**
 * Hashed Hierarchical Wheel Timer
 *
 * We model timers as the number of ticks until the next
 * due event.  We allow 32-bits of space to track this
 * due interval, and break that into 4 regions of 8 bits.
 * Each region indexes into a bucket of 256 lists.
 *
 * Bucket 0 represents those events that are due the soonest.
 * Each tick causes us to look at the next list in a bucket.
 * The 0th list in a bucket is special; it means that it is time to
 * flush the timers from the next higher bucket and schedule them
 * into a different bucket.
 *
 * This technique results in a very cheap mechanism for
 * maintaining time and timers.
 *
 * Unlike the original timer wheel paper, this implementation does
 * *not* tick constantly, and instead calculates the exact next wakeup
 * time.
 */
class HHWheelTimer : private folly::AsyncTimeout,
                     public folly::DelayedDestruction {
 public:
  using UniquePtr = std::unique_ptr<HHWheelTimer, Destructor>;
  using SharedPtr = std::shared_ptr<HHWheelTimer>;

  template <typename... Args>
  static UniquePtr newTimer(Args&&... args) {
    return UniquePtr(new HHWheelTimer(std::forward<Args>(args)...));
  }

  /**
   * A callback to be notified when a timeout has expired.
   */
  class Callback
      : public boost::intrusive::list_base_hook<
            boost::intrusive::link_mode<boost::intrusive::auto_unlink>> {
   public:
    Callback() = default;
    virtual ~Callback();

    /**
     * timeoutExpired() is invoked when the timeout has expired.
     */
    virtual void timeoutExpired() noexcept = 0;

    /// This callback was canceled. The default implementation is to just
    /// proxy to `timeoutExpired` but if you care about the difference between
    /// the timeout finishing or being canceled you can override this.
    virtual void callbackCanceled() noexcept {
      timeoutExpired();
    }

    /**
     * Cancel the timeout, if it is running.
     *
     * If the timeout is not scheduled, cancelTimeout() does nothing.
     */
    void cancelTimeout() {
      if (wheel_ == nullptr) {
        // We're not scheduled, so there's nothing to do.
        return;
      }
      cancelTimeoutImpl();
    }

    /**
     * Return true if this timeout is currently scheduled, and false otherwise.
     */
    bool isScheduled() const {
      return wheel_ != nullptr;
    }

    /**
     * Get the time remaining until this timeout expires. Return 0 if this
     * timeout is not scheduled or expired. Otherwise, return expiration time
     * minus getCurTime().
     */
    std::chrono::milliseconds getTimeRemaining() {
      return getTimeRemaining(getCurTime());
    }

   protected:
    /**
     * Don't override this unless you're doing a test. This is mainly here so
     * that we can override it to simulate lag in steady_clock.
     */
    virtual std::chrono::steady_clock::time_point getCurTime() {
      return std::chrono::steady_clock::now();
    }

   private:
    // Get the time remaining until this timeout expires
    std::chrono::milliseconds getTimeRemaining(
        std::chrono::steady_clock::time_point now) const {
      if (now >= expiration_) {
        return std::chrono::milliseconds(0);
      }
      return std::chrono::duration_cast<std::chrono::milliseconds>(
          expiration_ - now);
    }

    void setScheduled(HHWheelTimer* wheel, std::chrono::milliseconds);
    void cancelTimeoutImpl();

    HHWheelTimer* wheel_{nullptr};
    std::chrono::steady_clock::time_point expiration_{};
    int bucket_{-1};

    typedef boost::intrusive::
        list<Callback, boost::intrusive::constant_time_size<false>>
            List;

    std::shared_ptr<RequestContext> requestContext_;

    // Give HHWheelTimer direct access to our members so it can take care
    // of scheduling/cancelling.
    friend class HHWheelTimer;
  };

  /**
   * Create a new HHWheelTimer with the specified interval and the
   * default timeout value set.
   *
   * Objects created using this version of constructor can be used
   * to schedule both variable interval timeouts using
   * scheduleTimeout(callback, timeout) method, and default
   * interval timeouts using scheduleTimeout(callback) method.
   */
  static int DEFAULT_TICK_INTERVAL;
  explicit HHWheelTimer(
      folly::TimeoutManager* timeoutManager,
      std::chrono::milliseconds intervalMS =
          std::chrono::milliseconds(DEFAULT_TICK_INTERVAL),
      AsyncTimeout::InternalEnum internal = AsyncTimeout::InternalEnum::NORMAL,
      std::chrono::milliseconds defaultTimeoutMS =
          std::chrono::milliseconds(-1));

  /**
   * Cancel all outstanding timeouts
   *
   * @returns the number of timeouts that were cancelled.
   */
  size_t cancelAll();

  /**
   * Get the tick interval for this HHWheelTimer.
   *
   * Returns the tick interval in milliseconds.
   */
  std::chrono::milliseconds getTickInterval() const {
    return interval_;
  }

  /**
   * Get the default timeout interval for this HHWheelTimer.
   *
   * Returns the timeout interval in milliseconds.
   */
  std::chrono::milliseconds getDefaultTimeout() const {
    return defaultTimeout_;
  }

  /**
   * Set the default timeout interval for this HHWheelTimer.
   */
  void setDefaultTimeout(std::chrono::milliseconds timeout) {
    defaultTimeout_ = timeout;
  }

  /**
   * Schedule the specified Callback to be invoked after the
   * specified timeout interval.
   *
   * If the callback is already scheduled, this cancels the existing timeout
   * before scheduling the new timeout.
   */
  void scheduleTimeout(Callback* callback, std::chrono::milliseconds timeout);
  void scheduleTimeoutImpl(
      Callback* callback,
      std::chrono::milliseconds timeout);

  /**
   * Schedule the specified Callback to be invoked after the
   * default timeout interval.
   *
   * If the callback is already scheduled, this cancels the existing timeout
   * before scheduling the new timeout.
   *
   * This method uses CHECK() to make sure that the default timeout was
   * specified on the object initialization.
   */
  void scheduleTimeout(Callback* callback);

  template <class F>
  void scheduleTimeoutFn(F fn, std::chrono::milliseconds timeout) {
    struct Wrapper : Callback {
      Wrapper(F f) : fn_(std::move(f)) {}
      void timeoutExpired() noexcept override {
        try {
          fn_();
        } catch (std::exception const& e) {
          LOG(ERROR) << "HHWheelTimer timeout callback threw an exception: "
                     << e.what();
        } catch (...) {
          LOG(ERROR) << "HHWheelTimer timeout callback threw a non-exception.";
        }
        delete this;
      }
      F fn_;
    };
    Wrapper* w = new Wrapper(std::move(fn));
    scheduleTimeout(w, timeout);
  }

  /**
   * Return the number of currently pending timeouts
   */
  std::size_t count() const {
    return count_;
  }

  bool isDetachable() const {
    return !folly::AsyncTimeout::isScheduled();
  }

  using folly::AsyncTimeout::attachEventBase;
  using folly::AsyncTimeout::detachEventBase;
  using folly::AsyncTimeout::getTimeoutManager;

 protected:
  /**
   * Protected destructor.
   *
   * Use destroy() instead.  See the comments in DelayedDestruction for more
   * details.
   */
  ~HHWheelTimer() override;

 private:
  // Forbidden copy constructor and assignment operator
  HHWheelTimer(HHWheelTimer const&) = delete;
  HHWheelTimer& operator=(HHWheelTimer const&) = delete;

  // Methods inherited from AsyncTimeout
  void timeoutExpired() noexcept override;

  std::chrono::milliseconds interval_;
  std::chrono::milliseconds defaultTimeout_;

  static constexpr int WHEEL_BUCKETS = 4;
  static constexpr int WHEEL_BITS = 8;
  static constexpr unsigned int WHEEL_SIZE = (1 << WHEEL_BITS);
  static constexpr unsigned int WHEEL_MASK = (WHEEL_SIZE - 1);
  static constexpr uint32_t LARGEST_SLOT = 0xffffffffUL;

  typedef Callback::List CallbackList;
  CallbackList buckets_[WHEEL_BUCKETS][WHEEL_SIZE];
  std::vector<std::size_t> bitmap_;

  int64_t timeToWheelTicks(std::chrono::milliseconds t) {
    return t.count() / interval_.count();
  }

  bool cascadeTimers(int bucket, int tick);
  int64_t lastTick_;
  int64_t expireTick_;
  std::size_t count_;
  std::chrono::steady_clock::time_point startTime_;

  int64_t calcNextTick();

  void scheduleNextTimeout();

  bool* processingCallbacksGuard_;
  CallbackList timeouts; // Timeouts queued to run

  std::chrono::steady_clock::time_point getCurTime() {
    return std::chrono::steady_clock::now();
  }
};

} // namespace folly
