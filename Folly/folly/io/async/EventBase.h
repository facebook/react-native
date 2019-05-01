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
#include <cerrno>
#include <cmath>
#include <cstdlib>
#include <functional>
#include <list>
#include <memory>
#include <mutex>
#include <queue>
#include <set>
#include <stack>
#include <unordered_map>
#include <unordered_set>
#include <utility>

#include <boost/intrusive/list.hpp>
#include <glog/logging.h>

#include <folly/Executor.h>
#include <folly/Function.h>
#include <folly/Portability.h>
#include <folly/ScopeGuard.h>
#include <folly/executors/DrivableExecutor.h>
#include <folly/executors/IOExecutor.h>
#include <folly/executors/ScheduledExecutor.h>
#include <folly/executors/SequencedExecutor.h>
#include <folly/experimental/ExecutionObserver.h>
#include <folly/io/async/AsyncTimeout.h>
#include <folly/io/async/HHWheelTimer.h>
#include <folly/io/async/Request.h>
#include <folly/io/async/TimeoutManager.h>
#include <folly/portability/Event.h>
#include <folly/synchronization/CallOnce.h>

namespace folly {

using Cob = Func; // defined in folly/Executor.h
template <typename MessageT>
class NotificationQueue;

namespace detail {
class EventBaseLocalBase;

class EventBaseLocalBaseBase {
 public:
  virtual void onEventBaseDestruction(EventBase& evb) = 0;
  virtual ~EventBaseLocalBaseBase() = default;
};
} // namespace detail
template <typename T>
class EventBaseLocal;

class EventBaseObserver {
 public:
  virtual ~EventBaseObserver() = default;

  virtual uint32_t getSampleRate() const = 0;

  virtual void loopSample(int64_t busyTime, int64_t idleTime) = 0;
};

// Helper class that sets and retrieves the EventBase associated with a given
// request via RequestContext. See Request.h for that mechanism.
class RequestEventBase : public RequestData {
 public:
  static EventBase* get() {
    auto data = dynamic_cast<RequestEventBase*>(
        RequestContext::get()->getContextData(kContextDataName));
    if (!data) {
      return nullptr;
    }
    return data->eb_;
  }

  static void set(EventBase* eb) {
    RequestContext::get()->setContextData(
        kContextDataName,
        std::unique_ptr<RequestEventBase>(new RequestEventBase(eb)));
  }

  bool hasCallback() override {
    return false;
  }

 private:
  explicit RequestEventBase(EventBase* eb) : eb_(eb) {}
  EventBase* eb_;
  static constexpr const char* kContextDataName{"EventBase"};
};

class VirtualEventBase;

/**
 * This class is a wrapper for all asynchronous I/O processing functionality
 *
 * EventBase provides a main loop that notifies EventHandler callback objects
 * when I/O is ready on a file descriptor, and notifies AsyncTimeout objects
 * when a specified timeout has expired.  More complex, higher-level callback
 * mechanisms can then be built on top of EventHandler and AsyncTimeout.
 *
 * A EventBase object can only drive an event loop for a single thread.  To
 * take advantage of multiple CPU cores, most asynchronous I/O servers have one
 * thread per CPU, and use a separate EventBase for each thread.
 *
 * In general, most EventBase methods may only be called from the thread
 * running the EventBase's loop.  There are a few exceptions to this rule, for
 * methods that are explicitly intended to allow communication with a
 * EventBase from other threads.  When it is safe to call a method from
 * another thread it is explicitly listed in the method comments.
 */
class EventBase : private boost::noncopyable,
                  public TimeoutManager,
                  public DrivableExecutor,
                  public IOExecutor,
                  public SequencedExecutor,
                  public ScheduledExecutor {
 public:
  using Func = folly::Function<void()>;

  /**
   * A callback interface to use with runInLoop()
   *
   * Derive from this class if you need to delay some code execution until the
   * next iteration of the event loop.  This allows you to schedule code to be
   * invoked from the top-level of the loop, after your immediate callers have
   * returned.
   *
   * If a LoopCallback object is destroyed while it is scheduled to be run in
   * the next loop iteration, it will automatically be cancelled.
   */
  class LoopCallback
      : public boost::intrusive::list_base_hook<
            boost::intrusive::link_mode<boost::intrusive::auto_unlink>> {
   public:
    virtual ~LoopCallback() = default;

    virtual void runLoopCallback() noexcept = 0;
    void cancelLoopCallback() {
      context_.reset();
      unlink();
    }

    bool isLoopCallbackScheduled() const {
      return is_linked();
    }

   private:
    typedef boost::intrusive::
        list<LoopCallback, boost::intrusive::constant_time_size<false>>
            List;

    // EventBase needs access to LoopCallbackList (and therefore to hook_)
    friend class EventBase;
    friend class VirtualEventBase;
    std::shared_ptr<RequestContext> context_;
  };

  class FunctionLoopCallback : public LoopCallback {
   public:
    explicit FunctionLoopCallback(Func&& function)
        : function_(std::move(function)) {}

    void runLoopCallback() noexcept override {
      function_();
      delete this;
    }

   private:
    Func function_;
  };

  // Like FunctionLoopCallback, but saves one allocation. Use with caution.
  //
  // The caller is responsible for maintaining the lifetime of this callback
  // until after the point at which the contained function is called.
  class StackFunctionLoopCallback : public LoopCallback {
   public:
    explicit StackFunctionLoopCallback(Func&& function)
        : function_(std::move(function)) {}
    void runLoopCallback() noexcept override {
      Func(std::move(function_))();
    }

   private:
    Func function_;
  };

  /**
   * Create a new EventBase object.
   *
   * Same as EventBase(true), which constructs an EventBase that measures time.
   */
  EventBase() : EventBase(true) {}

  /**
   * Create a new EventBase object.
   *
   * @param enableTimeMeasurement Informs whether this event base should measure
   *                              time. Disabling it would likely improve
   *                              performance, but will disable some features
   *                              that relies on time-measurement, including:
   *                              observer, max latency and avg loop time.
   */
  explicit EventBase(bool enableTimeMeasurement);

  /**
   * Create a new EventBase object that will use the specified libevent
   * event_base object to drive the event loop.
   *
   * The EventBase will take ownership of this event_base, and will call
   * event_base_free(evb) when the EventBase is destroyed.
   *
   * @param enableTimeMeasurement Informs whether this event base should measure
   *                              time. Disabling it would likely improve
   *                              performance, but will disable some features
   *                              that relies on time-measurement, including:
   *                              observer, max latency and avg loop time.
   */
  explicit EventBase(event_base* evb, bool enableTimeMeasurement = true);
  ~EventBase() override;

  /**
   * Runs the event loop.
   *
   * loop() will loop waiting for I/O or timeouts and invoking EventHandler
   * and AsyncTimeout callbacks as their events become ready.  loop() will
   * only return when there are no more events remaining to process, or after
   * terminateLoopSoon() has been called.
   *
   * loop() may be called again to restart event processing after a previous
   * call to loop() or loopForever() has returned.
   *
   * Returns true if the loop completed normally (if it processed all
   * outstanding requests, or if terminateLoopSoon() was called).  If an error
   * occurs waiting for events, false will be returned.
   */
  bool loop();

  /**
   * Same as loop(), but doesn't wait for all keep-alive tokens to be released.
   */
  [[deprecated("This should only be used in legacy unit tests")]] bool
  loopIgnoreKeepAlive();

  /**
   * Wait for some events to become active, run them, then return.
   *
   * When EVLOOP_NONBLOCK is set in flags, the loop won't block if there
   * are not any events to process.
   *
   * This is useful for callers that want to run the loop manually.
   *
   * Returns the same result as loop().
   */
  bool loopOnce(int flags = 0);

  /**
   * Runs the event loop.
   *
   * loopForever() behaves like loop(), except that it keeps running even if
   * when there are no more user-supplied EventHandlers or AsyncTimeouts
   * registered.  It will only return after terminateLoopSoon() has been
   * called.
   *
   * This is useful for callers that want to wait for other threads to call
   * runInEventBaseThread(), even when there are no other scheduled events.
   *
   * loopForever() may be called again to restart event processing after a
   * previous call to loop() or loopForever() has returned.
   *
   * Throws a std::system_error if an error occurs.
   */
  void loopForever();

  /**
   * Causes the event loop to exit soon.
   *
   * This will cause an existing call to loop() or loopForever() to stop event
   * processing and return, even if there are still events remaining to be
   * processed.
   *
   * It is safe to call terminateLoopSoon() from another thread to cause loop()
   * to wake up and return in the EventBase loop thread.  terminateLoopSoon()
   * may also be called from the loop thread itself (for example, a
   * EventHandler or AsyncTimeout callback may call terminateLoopSoon() to
   * cause the loop to exit after the callback returns.)  If the loop is not
   * running, this will cause the next call to loop to terminate soon after
   * starting.  If a loop runs out of work (and so terminates on its own)
   * concurrently with a call to terminateLoopSoon(), this may cause a race
   * condition.
   *
   * Note that the caller is responsible for ensuring that cleanup of all event
   * callbacks occurs properly.  Since terminateLoopSoon() causes the loop to
   * exit even when there are pending events present, there may be remaining
   * callbacks present waiting to be invoked.  If the loop is later restarted
   * pending events will continue to be processed normally, however if the
   * EventBase is destroyed after calling terminateLoopSoon() it is the
   * caller's responsibility to ensure that cleanup happens properly even if
   * some outstanding events are never processed.
   */
  void terminateLoopSoon();

  /**
   * Adds the given callback to a queue of things run after the current pass
   * through the event loop completes.  Note that if this callback calls
   * runInLoop() the new callback won't be called until the main event loop
   * has gone through a cycle.
   *
   * This method may only be called from the EventBase's thread.  This
   * essentially allows an event handler to schedule an additional callback to
   * be invoked after it returns.
   *
   * Use runInEventBaseThread() to schedule functions from another thread.
   *
   * The thisIteration parameter makes this callback run in this loop
   * iteration, instead of the next one, even if called from a
   * runInLoop callback (normal io callbacks that call runInLoop will
   * always run in this iteration).  This was originally added to
   * support detachEventBase, as a user callback may have called
   * terminateLoopSoon(), but we want to make sure we detach.  Also,
   * detachEventBase almost always must be called from the base event
   * loop to ensure the stack is unwound, since most users of
   * EventBase are not thread safe.
   *
   * Ideally we would not need thisIteration, and instead just use
   * runInLoop with loop() (instead of terminateLoopSoon).
   */
  void runInLoop(LoopCallback* callback, bool thisIteration = false);

  /**
   * Convenience function to call runInLoop() with a folly::Function.
   *
   * This creates a LoopCallback object to wrap the folly::Function, and invoke
   * the folly::Function when the loop callback fires.  This is slightly more
   * expensive than defining your own LoopCallback, but more convenient in
   * areas that aren't too performance sensitive.
   *
   * This method may only be called from the EventBase's thread.  This
   * essentially allows an event handler to schedule an additional callback to
   * be invoked after it returns.
   *
   * Use runInEventBaseThread() to schedule functions from another thread.
   */
  void runInLoop(Func c, bool thisIteration = false);

  /**
   * Adds the given callback to a queue of things run before destruction
   * of current EventBase.
   *
   * This allows users of EventBase that run in it, but don't control it,
   * to be notified before EventBase gets destructed.
   *
   * Note: will be called from the thread that invoked EventBase destructor,
   *       before the final run of loop callbacks.
   */
  void runOnDestruction(LoopCallback* callback);

  /**
   * Adds a callback that will run immediately *before* the event loop.
   * This is very similar to runInLoop(), but will not cause the loop to break:
   * For example, this callback could be used to get loop times.
   */
  void runBeforeLoop(LoopCallback* callback);

  /**
   * Run the specified function in the EventBase's thread.
   *
   * This method is thread-safe, and may be called from another thread.
   *
   * If runInEventBaseThread() is called when the EventBase loop is not
   * running, the function call will be delayed until the next time the loop is
   * started.
   *
   * If runInEventBaseThread() returns true the function has successfully been
   * scheduled to run in the loop thread.  However, if the loop is terminated
   * (and never later restarted) before it has a chance to run the requested
   * function, the function will be run upon the EventBase's destruction.
   *
   * If two calls to runInEventBaseThread() are made from the same thread, the
   * functions will always be run in the order that they were scheduled.
   * Ordering between functions scheduled from separate threads is not
   * guaranteed.
   *
   * @param fn  The function to run.  The function must not throw any
   *     exceptions.
   * @param arg An argument to pass to the function.
   *
   * @return Returns true if the function was successfully scheduled, or false
   *         if there was an error scheduling the function.
   */
  template <typename T>
  bool runInEventBaseThread(void (*fn)(T*), T* arg);

  /**
   * Run the specified function in the EventBase's thread
   *
   * This version of runInEventBaseThread() takes a folly::Function object.
   * Note that this may be less efficient than the version that takes a plain
   * function pointer and void* argument, if moving the function is expensive
   * (e.g., if it wraps a lambda which captures some values with expensive move
   * constructors).
   *
   * If the loop is terminated (and never later restarted) before it has a
   * chance to run the requested function, the function will be run upon the
   * EventBase's destruction.
   *
   * The function must not throw any exceptions.
   */
  bool runInEventBaseThread(Func fn);

  /*
   * Like runInEventBaseThread, but the caller waits for the callback to be
   * executed.
   */
  template <typename T>
  bool runInEventBaseThreadAndWait(void (*fn)(T*), T* arg);

  /*
   * Like runInEventBaseThread, but the caller waits for the callback to be
   * executed.
   */
  bool runInEventBaseThreadAndWait(Func fn);

  /*
   * Like runInEventBaseThreadAndWait, except if the caller is already in the
   * event base thread, the functor is simply run inline.
   */
  template <typename T>
  bool runImmediatelyOrRunInEventBaseThreadAndWait(void (*fn)(T*), T* arg);

  /*
   * Like runInEventBaseThreadAndWait, except if the caller is already in the
   * event base thread, the functor is simply run inline.
   */
  bool runImmediatelyOrRunInEventBaseThreadAndWait(Func fn);

  /**
   * Set the maximum desired latency in us and provide a callback which will be
   * called when that latency is exceeded.
   * OBS: This functionality depends on time-measurement.
   */
  void setMaxLatency(std::chrono::microseconds maxLatency, Func maxLatencyCob) {
    assert(enableTimeMeasurement_);
    maxLatency_ = maxLatency;
    maxLatencyCob_ = std::move(maxLatencyCob);
  }

  /**
   * Set smoothing coefficient for loop load average; # of milliseconds
   * for exp(-1) (1/2.71828...) decay.
   */
  void setLoadAvgMsec(std::chrono::milliseconds ms);

  /**
   * reset the load average to a desired value
   */
  void resetLoadAvg(double value = 0.0);

  /**
   * Get the average loop time in microseconds (an exponentially-smoothed ave)
   */
  double getAvgLoopTime() const {
    assert(enableTimeMeasurement_);
    return avgLoopTime_.get();
  }

  /**
   * check if the event base loop is running.
   */
  bool isRunning() const {
    return loopThread_.load(std::memory_order_relaxed) != std::thread::id();
  }

  /**
   * wait until the event loop starts (after starting the event loop thread).
   */
  void waitUntilRunning();

  size_t getNotificationQueueSize() const;

  void setMaxReadAtOnce(uint32_t maxAtOnce);

  /**
   * Verify that current thread is the EventBase thread, if the EventBase is
   * running.
   */
  bool isInEventBaseThread() const {
    auto tid = loopThread_.load(std::memory_order_relaxed);
    return tid == std::thread::id() || tid == std::this_thread::get_id();
  }

  bool inRunningEventBaseThread() const {
    return loopThread_.load(std::memory_order_relaxed) ==
        std::this_thread::get_id();
  }

  /**
   * Equivalent to CHECK(isInEventBaseThread()) (and assert/DCHECK for
   * dcheckIsInEventBaseThread), but it prints more information on
   * failure.
   */
  void checkIsInEventBaseThread() const;
  void dcheckIsInEventBaseThread() const {
    if (kIsDebug) {
      checkIsInEventBaseThread();
    }
  }

  HHWheelTimer& timer() {
    if (!wheelTimer_) {
      wheelTimer_ = HHWheelTimer::newTimer(this);
    }
    return *wheelTimer_.get();
  }

  // --------- interface to underlying libevent base ------------
  // Avoid using these functions if possible.  These functions are not
  // guaranteed to always be present if we ever provide alternative EventBase
  // implementations that do not use libevent internally.
  event_base* getLibeventBase() const {
    return evb_;
  }
  static const char* getLibeventVersion();
  static const char* getLibeventMethod();

  /**
   * only EventHandler/AsyncTimeout subclasses and ourselves should
   * ever call this.
   *
   * This is used to mark the beginning of a new loop cycle by the
   * first handler fired within that cycle.
   *
   */
  void bumpHandlingTime() final;

  class SmoothLoopTime {
   public:
    explicit SmoothLoopTime(std::chrono::microseconds timeInterval)
        : expCoeff_(-1.0 / timeInterval.count()), value_(0.0) {
      VLOG(11) << "expCoeff_ " << expCoeff_ << " " << __PRETTY_FUNCTION__;
    }

    void setTimeInterval(std::chrono::microseconds timeInterval);
    void reset(double value = 0.0);

    void addSample(
        std::chrono::microseconds total,
        std::chrono::microseconds busy);

    double get() const {
      // Add the outstanding buffered times linearly, to avoid
      // expensive exponentiation
      auto lcoeff = buffer_time_.count() * -expCoeff_;
      return value_ * (1.0 - lcoeff) + lcoeff * busy_buffer_.count();
    }

    void dampen(double factor) {
      value_ *= factor;
    }

   private:
    double expCoeff_;
    double value_;
    std::chrono::microseconds buffer_time_{0};
    std::chrono::microseconds busy_buffer_{0};
    std::size_t buffer_cnt_{0};
    static constexpr std::chrono::milliseconds buffer_interval_{10};
  };

  void setObserver(const std::shared_ptr<EventBaseObserver>& observer) {
    assert(enableTimeMeasurement_);
    observer_ = observer;
  }

  const std::shared_ptr<EventBaseObserver>& getObserver() {
    return observer_;
  }

  /**
   * Setup execution observation/instrumentation for every EventHandler
   * executed in this EventBase.
   *
   * @param executionObserver   EventHandle's execution observer.
   */
  void setExecutionObserver(ExecutionObserver* observer) {
    executionObserver_ = observer;
  }

  /**
   * Gets the execution observer associated with this EventBase.
   */
  ExecutionObserver* getExecutionObserver() {
    return executionObserver_;
  }

  /**
   * Set the name of the thread that runs this event base.
   */
  void setName(const std::string& name);

  /**
   * Returns the name of the thread that runs this event base.
   */
  const std::string& getName();

  /// Implements the Executor interface
  void add(Cob fn) override {
    // runInEventBaseThread() takes a const&,
    // so no point in doing std::move here.
    runInEventBaseThread(std::move(fn));
  }

  /// Implements the DrivableExecutor interface
  void drive() override {
    ++loopKeepAliveCount_;
    SCOPE_EXIT {
      --loopKeepAliveCount_;
    };
    loopOnce();
  }

  // Implements the ScheduledExecutor interface
  void scheduleAt(Func&& fn, TimePoint const& timeout) override;

  // TimeoutManager
  void attachTimeoutManager(
      AsyncTimeout* obj,
      TimeoutManager::InternalEnum internal) final;

  void detachTimeoutManager(AsyncTimeout* obj) final;

  bool scheduleTimeout(AsyncTimeout* obj, TimeoutManager::timeout_type timeout)
      final;

  void cancelTimeout(AsyncTimeout* obj) final;

  bool isInTimeoutManagerThread() final {
    return isInEventBaseThread();
  }

  // Returns a VirtualEventBase attached to this EventBase. Can be used to
  // pass to APIs which expect VirtualEventBase. This VirtualEventBase will be
  // destroyed together with the EventBase.
  //
  // Any number of VirtualEventBases instances may be independently constructed,
  // which are backed by this EventBase. This method should be only used if you
  // don't need to manage the life time of the VirtualEventBase used.
  folly::VirtualEventBase& getVirtualEventBase();

  /// Implements the IOExecutor interface
  EventBase* getEventBase() override;

 protected:
  bool keepAliveAcquire() override {
    if (inRunningEventBaseThread()) {
      loopKeepAliveCount_++;
    } else {
      loopKeepAliveCountAtomic_.fetch_add(1, std::memory_order_relaxed);
    }
    return true;
  }

  void keepAliveRelease() override {
    if (!inRunningEventBaseThread()) {
      return add([this] { loopKeepAliveCount_--; });
    }
    loopKeepAliveCount_--;
  }

 private:
  void applyLoopKeepAlive();

  ssize_t loopKeepAliveCount();

  /*
   * Helper function that tells us whether we have already handled
   * some event/timeout/callback in this loop iteration.
   */
  bool nothingHandledYet() const noexcept;

  typedef LoopCallback::List LoopCallbackList;
  class FunctionRunner;

  bool loopBody(int flags = 0, bool ignoreKeepAlive = false);

  // executes any callbacks queued by runInLoop(); returns false if none found
  bool runLoopCallbacks();

  void initNotificationQueue();

  // should only be accessed through public getter
  HHWheelTimer::UniquePtr wheelTimer_;

  LoopCallbackList loopCallbacks_;
  LoopCallbackList runBeforeLoopCallbacks_;
  LoopCallbackList onDestructionCallbacks_;

  // This will be null most of the time, but point to currentCallbacks
  // if we are in the middle of running loop callbacks, such that
  // runInLoop(..., true) will always run in the current loop
  // iteration.
  LoopCallbackList* runOnceCallbacks_;

  // stop_ is set by terminateLoopSoon() and is used by the main loop
  // to determine if it should exit
  std::atomic<bool> stop_;

  // The ID of the thread running the main loop.
  // std::thread::id{} if loop is not running.
  std::atomic<std::thread::id> loopThread_;

  // pointer to underlying event_base class doing the heavy lifting
  event_base* evb_;

  // A notification queue for runInEventBaseThread() to use
  // to send function requests to the EventBase thread.
  std::unique_ptr<NotificationQueue<Func>> queue_;
  std::unique_ptr<FunctionRunner> fnRunner_;
  ssize_t loopKeepAliveCount_{0};
  std::atomic<ssize_t> loopKeepAliveCountAtomic_{0};
  bool loopKeepAliveActive_{false};

  // limit for latency in microseconds (0 disables)
  std::chrono::microseconds maxLatency_;

  // exponentially-smoothed average loop time for latency-limiting
  SmoothLoopTime avgLoopTime_;

  // smoothed loop time used to invoke latency callbacks; differs from
  // avgLoopTime_ in that it's scaled down after triggering a callback
  // to reduce spamminess
  SmoothLoopTime maxLatencyLoopTime_;

  // callback called when latency limit is exceeded
  Func maxLatencyCob_;

  // Enables/disables time measurements in loopBody(). if disabled, the
  // following functionality that relies on time-measurement, will not
  // be supported: avg loop time, observer and max latency.
  const bool enableTimeMeasurement_;

  // Wrap-around loop counter to detect beginning of each loop
  std::size_t nextLoopCnt_;
  std::size_t latestLoopCnt_;
  std::chrono::steady_clock::time_point startWork_;
  // Prevent undefined behavior from invoking event_base_loop() reentrantly.
  // This is needed since many projects use libevent-1.4, which lacks commit
  // b557b175c00dc462c1fce25f6e7dd67121d2c001 from
  // https://github.com/libevent/libevent/.
  bool invokingLoop_{false};

  // Observer to export counters
  std::shared_ptr<EventBaseObserver> observer_;
  uint32_t observerSampleCount_;

  // EventHandler's execution observer.
  ExecutionObserver* executionObserver_;

  // Name of the thread running this EventBase
  std::string name_;

  // allow runOnDestruction() to be called from any threads
  std::mutex onDestructionCallbacksMutex_;

  // see EventBaseLocal
  friend class detail::EventBaseLocalBase;
  template <typename T>
  friend class EventBaseLocal;
  std::unordered_map<std::size_t, std::shared_ptr<void>> localStorage_;
  std::unordered_set<detail::EventBaseLocalBaseBase*> localStorageToDtor_;

  folly::once_flag virtualEventBaseInitFlag_;
  std::unique_ptr<VirtualEventBase> virtualEventBase_;
};

template <typename T>
bool EventBase::runInEventBaseThread(void (*fn)(T*), T* arg) {
  return runInEventBaseThread([=] { fn(arg); });
}

template <typename T>
bool EventBase::runInEventBaseThreadAndWait(void (*fn)(T*), T* arg) {
  return runInEventBaseThreadAndWait([=] { fn(arg); });
}

template <typename T>
bool EventBase::runImmediatelyOrRunInEventBaseThreadAndWait(
    void (*fn)(T*),
    T* arg) {
  return runImmediatelyOrRunInEventBaseThreadAndWait([=] { fn(arg); });
}

} // namespace folly
