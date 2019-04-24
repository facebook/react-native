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
#ifndef __STDC_FORMAT_MACROS
#define __STDC_FORMAT_MACROS
#endif

#include <folly/io/async/EventBase.h>

#include <fcntl.h>

#include <memory>
#include <mutex>
#include <thread>

#include <folly/Memory.h>
#include <folly/String.h>
#include <folly/io/async/NotificationQueue.h>
#include <folly/io/async/VirtualEventBase.h>
#include <folly/portability/Unistd.h>
#include <folly/synchronization/Baton.h>
#include <folly/system/ThreadName.h>

namespace folly {

/*
 * EventBase::FunctionRunner
 */

class EventBase::FunctionRunner
    : public NotificationQueue<EventBase::Func>::Consumer {
 public:
  void messageAvailable(Func&& msg) noexcept override {
    // In libevent2, internal events do not break the loop.
    // Most users would expect loop(), followed by runInEventBaseThread(),
    // to break the loop and check if it should exit or not.
    // To have similar bejaviour to libevent1.4, tell the loop to break here.
    // Note that loop() may still continue to loop, but it will also check the
    // stop_ flag as well as runInLoop callbacks, etc.
    event_base_loopbreak(getEventBase()->evb_);

    if (!msg) {
      // terminateLoopSoon() sends a null message just to
      // wake up the loop.  We can ignore these messages.
      return;
    }
    msg();
  }
};

// The interface used to libevent is not thread-safe.  Calls to
// event_init() and event_base_free() directly modify an internal
// global 'current_base', so a mutex is required to protect this.
//
// event_init() should only ever be called once.  Subsequent calls
// should be made to event_base_new().  We can recognise that
// event_init() has already been called by simply inspecting current_base.
static std::mutex libevent_mutex_;

/*
 * EventBase methods
 */

EventBase::EventBase(bool enableTimeMeasurement)
    : runOnceCallbacks_(nullptr),
      stop_(false),
      loopThread_(),
      queue_(nullptr),
      fnRunner_(nullptr),
      maxLatency_(0),
      avgLoopTime_(std::chrono::seconds(2)),
      maxLatencyLoopTime_(avgLoopTime_),
      enableTimeMeasurement_(enableTimeMeasurement),
      nextLoopCnt_(
          std::size_t(-40)) // Early wrap-around so bugs will manifest soon
      ,
      latestLoopCnt_(nextLoopCnt_),
      startWork_(),
      observer_(nullptr),
      observerSampleCount_(0),
      executionObserver_(nullptr) {
  struct event ev;
  {
    std::lock_guard<std::mutex> lock(libevent_mutex_);

    // The value 'current_base' (libevent 1) or
    // 'event_global_current_base_' (libevent 2) is filled in by event_set(),
    // allowing examination of its value without an explicit reference here.
    // If ev.ev_base is nullptr, then event_init() must be called, otherwise
    // call event_base_new().
    event_set(&ev, 0, 0, nullptr, nullptr);
    if (!ev.ev_base) {
      evb_ = event_init();
    }
  }

  if (ev.ev_base) {
    evb_ = event_base_new();
  }

  if (UNLIKELY(evb_ == nullptr)) {
    LOG(ERROR) << "EventBase(): Failed to init event base.";
    folly::throwSystemError("error in EventBase::EventBase()");
  }
  VLOG(5) << "EventBase(): Created.";
  initNotificationQueue();
}

// takes ownership of the event_base
EventBase::EventBase(event_base* evb, bool enableTimeMeasurement)
    : runOnceCallbacks_(nullptr),
      stop_(false),
      loopThread_(),
      evb_(evb),
      queue_(nullptr),
      fnRunner_(nullptr),
      maxLatency_(0),
      avgLoopTime_(std::chrono::seconds(2)),
      maxLatencyLoopTime_(avgLoopTime_),
      enableTimeMeasurement_(enableTimeMeasurement),
      nextLoopCnt_(
          std::size_t(-40)) // Early wrap-around so bugs will manifest soon
      ,
      latestLoopCnt_(nextLoopCnt_),
      startWork_(),
      observer_(nullptr),
      observerSampleCount_(0),
      executionObserver_(nullptr) {
  if (UNLIKELY(evb_ == nullptr)) {
    LOG(ERROR) << "EventBase(): Pass nullptr as event base.";
    throw std::invalid_argument("EventBase(): event base cannot be nullptr");
  }
  initNotificationQueue();
}

EventBase::~EventBase() {
  std::future<void> virtualEventBaseDestroyFuture;
  if (virtualEventBase_) {
    virtualEventBaseDestroyFuture = virtualEventBase_->destroy();
  }

  // Keep looping until all keep-alive handles are released. Each keep-alive
  // handle signals that some external code will still schedule some work on
  // this EventBase (so it's not safe to destroy it).
  while (loopKeepAliveCount() > 0) {
    applyLoopKeepAlive();
    loopOnce();
  }

  if (virtualEventBaseDestroyFuture.valid()) {
    virtualEventBaseDestroyFuture.get();
  }

  // Call all destruction callbacks, before we start cleaning up our state.
  while (!onDestructionCallbacks_.empty()) {
    LoopCallback* callback = &onDestructionCallbacks_.front();
    onDestructionCallbacks_.pop_front();
    callback->runLoopCallback();
  }

  clearCobTimeouts();

  DCHECK_EQ(0u, runBeforeLoopCallbacks_.size());

  (void)runLoopCallbacks();

  if (!fnRunner_->consumeUntilDrained()) {
    LOG(ERROR) << "~EventBase(): Unable to drain notification queue";
  }

  // Stop consumer before deleting NotificationQueue
  fnRunner_->stopConsuming();
  {
    std::lock_guard<std::mutex> lock(libevent_mutex_);
    event_base_free(evb_);
  }

  for (auto storage : localStorageToDtor_) {
    storage->onEventBaseDestruction(*this);
  }

  VLOG(5) << "EventBase(): Destroyed.";
}

size_t EventBase::getNotificationQueueSize() const {
  return queue_->size();
}

void EventBase::setMaxReadAtOnce(uint32_t maxAtOnce) {
  fnRunner_->setMaxReadAtOnce(maxAtOnce);
}

void EventBase::checkIsInEventBaseThread() const {
  auto evbTid = loopThread_.load(std::memory_order_relaxed);
  if (evbTid == std::thread::id()) {
    return;
  }

  // Using getThreadName(evbTid) instead of name_ will work also if
  // the thread name is set outside of EventBase (and name_ is empty).
  auto curTid = std::this_thread::get_id();
  CHECK(evbTid == curTid)
      << "This logic must be executed in the event base thread. "
      << "Event base thread name: \""
      << folly::getThreadName(evbTid).value_or("")
      << "\", current thread name: \""
      << folly::getThreadName(curTid).value_or("") << "\"";
}

// Set smoothing coefficient for loop load average; input is # of milliseconds
// for exp(-1) decay.
void EventBase::setLoadAvgMsec(std::chrono::milliseconds ms) {
  assert(enableTimeMeasurement_);
  std::chrono::microseconds us = std::chrono::milliseconds(ms);
  if (ms > std::chrono::milliseconds::zero()) {
    maxLatencyLoopTime_.setTimeInterval(us);
    avgLoopTime_.setTimeInterval(us);
  } else {
    LOG(ERROR) << "non-positive arg to setLoadAvgMsec()";
  }
}

void EventBase::resetLoadAvg(double value) {
  assert(enableTimeMeasurement_);
  avgLoopTime_.reset(value);
  maxLatencyLoopTime_.reset(value);
}

static std::chrono::milliseconds getTimeDelta(
    std::chrono::steady_clock::time_point* prev) {
  auto result = std::chrono::steady_clock::now() - *prev;
  *prev = std::chrono::steady_clock::now();

  return std::chrono::duration_cast<std::chrono::milliseconds>(result);
}

void EventBase::waitUntilRunning() {
  while (!isRunning()) {
    std::this_thread::yield();
  }
}

// enters the event_base loop -- will only exit when forced to
bool EventBase::loop() {
  return loopBody();
}

bool EventBase::loopIgnoreKeepAlive() {
  if (loopKeepAliveActive_) {
    // Make sure NotificationQueue is not counted as one of the readers
    // (otherwise loopBody won't return until terminateLoopSoon is called).
    fnRunner_->stopConsuming();
    fnRunner_->startConsumingInternal(this, queue_.get());
    loopKeepAliveActive_ = false;
  }
  return loopBody(0, true);
}

bool EventBase::loopOnce(int flags) {
  return loopBody(flags | EVLOOP_ONCE);
}

bool EventBase::loopBody(int flags, bool ignoreKeepAlive) {
  VLOG(5) << "EventBase(): Starting loop.";

  DCHECK(!invokingLoop_)
      << "Your code just tried to loop over an event base from inside another "
      << "event base loop. Since libevent is not reentrant, this leads to "
      << "undefined behavior in opt builds. Please fix immediately. For the "
      << "common case of an inner function that needs to do some synchronous "
      << "computation on an event-base, replace getEventBase() by a new, "
      << "stack-allocated EvenBase.";
  invokingLoop_ = true;
  SCOPE_EXIT {
    invokingLoop_ = false;
  };

  int res = 0;
  bool ranLoopCallbacks;
  bool blocking = !(flags & EVLOOP_NONBLOCK);
  bool once = (flags & EVLOOP_ONCE);

  // time-measurement variables.
  std::chrono::steady_clock::time_point prev;
  std::chrono::steady_clock::time_point idleStart = {};
  std::chrono::microseconds busy;
  std::chrono::microseconds idle;

  loopThread_.store(std::this_thread::get_id(), std::memory_order_release);

  if (!name_.empty()) {
    setThreadName(name_);
  }

  if (enableTimeMeasurement_) {
    prev = std::chrono::steady_clock::now();
    idleStart = prev;
  }

  while (!stop_.load(std::memory_order_relaxed)) {
    if (!ignoreKeepAlive) {
      applyLoopKeepAlive();
    }
    ++nextLoopCnt_;

    // Run the before loop callbacks
    LoopCallbackList callbacks;
    callbacks.swap(runBeforeLoopCallbacks_);

    while (!callbacks.empty()) {
      auto* item = &callbacks.front();
      callbacks.pop_front();
      item->runLoopCallback();
    }

    // nobody can add loop callbacks from within this thread if
    // we don't have to handle anything to start with...
    if (blocking && loopCallbacks_.empty()) {
      res = event_base_loop(evb_, EVLOOP_ONCE);
    } else {
      res = event_base_loop(evb_, EVLOOP_ONCE | EVLOOP_NONBLOCK);
    }

    ranLoopCallbacks = runLoopCallbacks();

    if (enableTimeMeasurement_) {
      auto now = std::chrono::steady_clock::now();
      busy = std::chrono::duration_cast<std::chrono::microseconds>(
          now - startWork_);
      idle = std::chrono::duration_cast<std::chrono::microseconds>(
          startWork_ - idleStart);
      auto loop_time = busy + idle;

      avgLoopTime_.addSample(loop_time, busy);
      maxLatencyLoopTime_.addSample(loop_time, busy);

      if (observer_) {
        if (observerSampleCount_++ == observer_->getSampleRate()) {
          observerSampleCount_ = 0;
          observer_->loopSample(busy.count(), idle.count());
        }
      }

      VLOG(11) << "EventBase " << this << " did not timeout "
               << " loop time guess: " << loop_time.count()
               << " idle time: " << idle.count()
               << " busy time: " << busy.count()
               << " avgLoopTime: " << avgLoopTime_.get()
               << " maxLatencyLoopTime: " << maxLatencyLoopTime_.get()
               << " maxLatency_: " << maxLatency_.count() << "us"
               << " notificationQueueSize: " << getNotificationQueueSize()
               << " nothingHandledYet(): " << nothingHandledYet();

      // see if our average loop time has exceeded our limit
      if ((maxLatency_ > std::chrono::microseconds::zero()) &&
          (maxLatencyLoopTime_.get() > double(maxLatency_.count()))) {
        maxLatencyCob_();
        // back off temporarily -- don't keep spamming maxLatencyCob_
        // if we're only a bit over the limit
        maxLatencyLoopTime_.dampen(0.9);
      }

      // Our loop run did real work; reset the idle timer
      idleStart = now;
    } else {
      VLOG(11) << "EventBase " << this << " did not timeout";
    }

    // If the event loop indicate that there were no more events, and
    // we also didn't have any loop callbacks to run, there is nothing left to
    // do.
    if (res != 0 && !ranLoopCallbacks) {
      // Since Notification Queue is marked 'internal' some events may not have
      // run.  Run them manually if so, and continue looping.
      //
      if (getNotificationQueueSize() > 0) {
        fnRunner_->handlerReady(0);
      } else {
        break;
      }
    }

    if (enableTimeMeasurement_) {
      VLOG(11) << "EventBase " << this
               << " loop time: " << getTimeDelta(&prev).count();
    }

    if (once) {
      break;
    }
  }
  // Reset stop_ so loop() can be called again
  stop_.store(false, std::memory_order_relaxed);

  if (res < 0) {
    LOG(ERROR) << "EventBase: -- error in event loop, res = " << res;
    return false;
  } else if (res == 1) {
    VLOG(5) << "EventBase: ran out of events (exiting loop)!";
  } else if (res > 1) {
    LOG(ERROR) << "EventBase: unknown event loop result = " << res;
    return false;
  }

  loopThread_.store({}, std::memory_order_release);

  VLOG(5) << "EventBase(): Done with loop.";
  return true;
}

ssize_t EventBase::loopKeepAliveCount() {
  if (loopKeepAliveCountAtomic_.load(std::memory_order_relaxed)) {
    loopKeepAliveCount_ +=
        loopKeepAliveCountAtomic_.exchange(0, std::memory_order_relaxed);
  }
  DCHECK_GE(loopKeepAliveCount_, 0);

  return loopKeepAliveCount_;
}

void EventBase::applyLoopKeepAlive() {
  auto keepAliveCount = loopKeepAliveCount();
  // Make sure default VirtualEventBase won't hold EventBase::loop() forever.
  if (virtualEventBase_ && virtualEventBase_->keepAliveCount() == 1) {
    --keepAliveCount;
  }

  if (loopKeepAliveActive_ && keepAliveCount == 0) {
    // Restore the notification queue internal flag
    fnRunner_->stopConsuming();
    fnRunner_->startConsumingInternal(this, queue_.get());
    loopKeepAliveActive_ = false;
  } else if (!loopKeepAliveActive_ && keepAliveCount > 0) {
    // Update the notification queue event to treat it as a normal
    // (non-internal) event.  The notification queue event always remains
    // installed, and the main loop won't exit with it installed.
    fnRunner_->stopConsuming();
    fnRunner_->startConsuming(this, queue_.get());
    loopKeepAliveActive_ = true;
  }
}

void EventBase::loopForever() {
  bool ret;
  {
    SCOPE_EXIT {
      applyLoopKeepAlive();
    };
    // Make sure notification queue events are treated as normal events.
    // We can't use loopKeepAlive() here since LoopKeepAlive token can only be
    // released inside a loop.
    ++loopKeepAliveCount_;
    SCOPE_EXIT {
      --loopKeepAliveCount_;
    };
    ret = loop();
  }

  if (!ret) {
    folly::throwSystemError("error in EventBase::loopForever()");
  }
}

void EventBase::bumpHandlingTime() {
  if (!enableTimeMeasurement_) {
    return;
  }

  VLOG(11) << "EventBase " << this << " " << __PRETTY_FUNCTION__
           << " (loop) latest " << latestLoopCnt_ << " next " << nextLoopCnt_;
  if (nothingHandledYet()) {
    latestLoopCnt_ = nextLoopCnt_;
    // set the time
    startWork_ = std::chrono::steady_clock::now();

    VLOG(11) << "EventBase " << this << " " << __PRETTY_FUNCTION__
             << " (loop) startWork_ " << startWork_.time_since_epoch().count();
  }
}

void EventBase::terminateLoopSoon() {
  VLOG(5) << "EventBase(): Received terminateLoopSoon() command.";

  // Set stop to true, so the event loop will know to exit.
  stop_.store(true, std::memory_order_relaxed);

  // Call event_base_loopbreak() so that libevent will exit the next time
  // around the loop.
  event_base_loopbreak(evb_);

  // If terminateLoopSoon() is called from another thread,
  // the EventBase thread might be stuck waiting for events.
  // In this case, it won't wake up and notice that stop_ is set until it
  // receives another event.  Send an empty frame to the notification queue
  // so that the event loop will wake up even if there are no other events.
  //
  // We don't care about the return value of trySendFrame().  If it fails
  // this likely means the EventBase already has lots of events waiting
  // anyway.
  try {
    queue_->putMessage(nullptr);
  } catch (...) {
    // We don't care if putMessage() fails.  This likely means
    // the EventBase already has lots of events waiting anyway.
  }
}

void EventBase::runInLoop(LoopCallback* callback, bool thisIteration) {
  dcheckIsInEventBaseThread();
  callback->cancelLoopCallback();
  callback->context_ = RequestContext::saveContext();
  if (runOnceCallbacks_ != nullptr && thisIteration) {
    runOnceCallbacks_->push_back(*callback);
  } else {
    loopCallbacks_.push_back(*callback);
  }
}

void EventBase::runInLoop(Func cob, bool thisIteration) {
  dcheckIsInEventBaseThread();
  auto wrapper = new FunctionLoopCallback(std::move(cob));
  wrapper->context_ = RequestContext::saveContext();
  if (runOnceCallbacks_ != nullptr && thisIteration) {
    runOnceCallbacks_->push_back(*wrapper);
  } else {
    loopCallbacks_.push_back(*wrapper);
  }
}

void EventBase::runOnDestruction(LoopCallback* callback) {
  std::lock_guard<std::mutex> lg(onDestructionCallbacksMutex_);
  callback->cancelLoopCallback();
  onDestructionCallbacks_.push_back(*callback);
}

void EventBase::runBeforeLoop(LoopCallback* callback) {
  dcheckIsInEventBaseThread();
  callback->cancelLoopCallback();
  runBeforeLoopCallbacks_.push_back(*callback);
}

bool EventBase::runInEventBaseThread(Func fn) {
  // Send the message.
  // It will be received by the FunctionRunner in the EventBase's thread.

  // We try not to schedule nullptr callbacks
  if (!fn) {
    LOG(ERROR) << "EventBase " << this
               << ": Scheduling nullptr callbacks is not allowed";
    return false;
  }

  // Short-circuit if we are already in our event base
  if (inRunningEventBaseThread()) {
    runInLoop(std::move(fn));
    return true;
  }

  try {
    queue_->putMessage(std::move(fn));
  } catch (const std::exception& ex) {
    LOG(ERROR) << "EventBase " << this << ": failed to schedule function "
               << "for EventBase thread: " << ex.what();
    return false;
  }

  return true;
}

bool EventBase::runInEventBaseThreadAndWait(Func fn) {
  if (inRunningEventBaseThread()) {
    LOG(ERROR) << "EventBase " << this << ": Waiting in the event loop is not "
               << "allowed";
    return false;
  }

  Baton<> ready;
  runInEventBaseThread([&ready, fn = std::move(fn)]() mutable {
    SCOPE_EXIT {
      ready.post();
    };
    // A trick to force the stored functor to be executed and then destructed
    // before posting the baton and waking the waiting thread.
    copy(std::move(fn))();
  });
  ready.wait();

  return true;
}

bool EventBase::runImmediatelyOrRunInEventBaseThreadAndWait(Func fn) {
  if (isInEventBaseThread()) {
    fn();
    return true;
  } else {
    return runInEventBaseThreadAndWait(std::move(fn));
  }
}

bool EventBase::runLoopCallbacks() {
  bumpHandlingTime();
  if (!loopCallbacks_.empty()) {
    // Swap the loopCallbacks_ list with a temporary list on our stack.
    // This way we will only run callbacks scheduled at the time
    // runLoopCallbacks() was invoked.
    //
    // If any of these callbacks in turn call runInLoop() to schedule more
    // callbacks, those new callbacks won't be run until the next iteration
    // around the event loop.  This prevents runInLoop() callbacks from being
    // able to start file descriptor and timeout based events.
    LoopCallbackList currentCallbacks;
    currentCallbacks.swap(loopCallbacks_);
    runOnceCallbacks_ = &currentCallbacks;

    while (!currentCallbacks.empty()) {
      LoopCallback* callback = &currentCallbacks.front();
      currentCallbacks.pop_front();
      folly::RequestContextScopeGuard rctx(std::move(callback->context_));
      callback->runLoopCallback();
    }

    runOnceCallbacks_ = nullptr;
    return true;
  }
  return false;
}

void EventBase::initNotificationQueue() {
  // Infinite size queue
  queue_ = std::make_unique<NotificationQueue<Func>>();

  // We allocate fnRunner_ separately, rather than declaring it directly
  // as a member of EventBase solely so that we don't need to include
  // NotificationQueue.h from EventBase.h
  fnRunner_ = std::make_unique<FunctionRunner>();

  // Mark this as an internal event, so event_base_loop() will return if
  // there are no other events besides this one installed.
  //
  // Most callers don't care about the internal notification queue used by
  // EventBase.  The queue is always installed, so if we did count the queue as
  // an active event, loop() would never exit with no more events to process.
  // Users can use loopForever() if they do care about the notification queue.
  // (This is useful for EventBase threads that do nothing but process
  // runInEventBaseThread() notifications.)
  fnRunner_->startConsumingInternal(this, queue_.get());
}

void EventBase::SmoothLoopTime::setTimeInterval(
    std::chrono::microseconds timeInterval) {
  expCoeff_ = -1.0 / timeInterval.count();
  VLOG(11) << "expCoeff_ " << expCoeff_ << " " << __PRETTY_FUNCTION__;
}

void EventBase::SmoothLoopTime::reset(double value) {
  value_ = value;
}

void EventBase::SmoothLoopTime::addSample(
    std::chrono::microseconds total,
    std::chrono::microseconds busy) {
  if ((buffer_time_ + total) > buffer_interval_ && buffer_cnt_ > 0) {
    // See https://en.wikipedia.org/wiki/Exponential_smoothing for
    // more info on this calculation.
    double coeff = exp(buffer_time_.count() * expCoeff_);
    value_ =
        value_ * coeff + (1.0 - coeff) * (busy_buffer_.count() / buffer_cnt_);
    buffer_time_ = std::chrono::microseconds{0};
    busy_buffer_ = std::chrono::microseconds{0};
    buffer_cnt_ = 0;
  }
  buffer_time_ += total;
  busy_buffer_ += busy;
  buffer_cnt_++;
}

bool EventBase::nothingHandledYet() const noexcept {
  VLOG(11) << "latest " << latestLoopCnt_ << " next " << nextLoopCnt_;
  return (nextLoopCnt_ != latestLoopCnt_);
}

void EventBase::attachTimeoutManager(AsyncTimeout* obj, InternalEnum internal) {
  struct event* ev = obj->getEvent();
  assert(ev->ev_base == nullptr);

  event_base_set(getLibeventBase(), ev);
  if (internal == AsyncTimeout::InternalEnum::INTERNAL) {
    // Set the EVLIST_INTERNAL flag
    event_ref_flags(ev) |= EVLIST_INTERNAL;
  }
}

void EventBase::detachTimeoutManager(AsyncTimeout* obj) {
  cancelTimeout(obj);
  struct event* ev = obj->getEvent();
  ev->ev_base = nullptr;
}

bool EventBase::scheduleTimeout(
    AsyncTimeout* obj,
    TimeoutManager::timeout_type timeout) {
  dcheckIsInEventBaseThread();
  // Set up the timeval and add the event
  struct timeval tv;
  tv.tv_sec = long(timeout.count() / 1000LL);
  tv.tv_usec = long((timeout.count() % 1000LL) * 1000LL);

  struct event* ev = obj->getEvent();

  DCHECK(ev->ev_base);

  if (event_add(ev, &tv) < 0) {
    LOG(ERROR) << "EventBase: failed to schedule timeout: " << errnoStr(errno);
    return false;
  }

  return true;
}

void EventBase::cancelTimeout(AsyncTimeout* obj) {
  dcheckIsInEventBaseThread();
  struct event* ev = obj->getEvent();
  if (EventUtil::isEventRegistered(ev)) {
    event_del(ev);
  }
}

void EventBase::setName(const std::string& name) {
  dcheckIsInEventBaseThread();
  name_ = name;

  if (isRunning()) {
    setThreadName(loopThread_.load(std::memory_order_relaxed), name_);
  }
}

const std::string& EventBase::getName() {
  dcheckIsInEventBaseThread();
  return name_;
}

void EventBase::scheduleAt(Func&& fn, TimePoint const& timeout) {
  auto duration = timeout - now();
  timer().scheduleTimeoutFn(
      std::move(fn),
      std::chrono::duration_cast<std::chrono::milliseconds>(duration));
}

const char* EventBase::getLibeventVersion() {
  return event_get_version();
}
const char* EventBase::getLibeventMethod() {
  return event_get_method();
}

VirtualEventBase& EventBase::getVirtualEventBase() {
  folly::call_once(virtualEventBaseInitFlag_, [&] {
    virtualEventBase_ = std::make_unique<VirtualEventBase>(*this);
  });

  return *virtualEventBase_;
}

EventBase* EventBase::getEventBase() {
  return this;
}

constexpr std::chrono::milliseconds EventBase::SmoothLoopTime::buffer_interval_;
} // namespace folly
