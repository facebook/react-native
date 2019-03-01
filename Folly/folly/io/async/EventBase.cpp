/*
 * Copyright 2017 Facebook, Inc.
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
#include <folly/io/async/VirtualEventBase.h>

#include <folly/Memory.h>
#include <folly/ThreadName.h>
#include <folly/io/async/NotificationQueue.h>
#include <folly/portability/Unistd.h>

#include <condition_variable>
#include <fcntl.h>
#include <mutex>
#include <thread>

namespace folly {

/*
 * EventBase::FunctionRunner
 */

class EventBase::FunctionRunner
    : public NotificationQueue<EventBase::Func>::Consumer {
 public:
  void messageAvailable(Func&& msg) override {
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

    // The function should never throw an exception, because we have no
    // way of knowing what sort of error handling to perform.
    //
    // If it does throw, log a message and abort the program.
    try {
      msg();
    } catch (const std::exception& ex) {
      LOG(ERROR) << "runInEventBaseThread() function threw a "
                 << typeid(ex).name() << " exception: " << ex.what();
      abort();
    } catch (...) {
      LOG(ERROR) << "runInEventBaseThread() function threw an exception";
      abort();
    }
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
  : runOnceCallbacks_(nullptr)
  , stop_(false)
  , loopThread_()
  , queue_(nullptr)
  , fnRunner_(nullptr)
  , maxLatency_(0)
  , avgLoopTime_(std::chrono::seconds(2))
  , maxLatencyLoopTime_(avgLoopTime_)
  , enableTimeMeasurement_(enableTimeMeasurement)
  , nextLoopCnt_(uint64_t(-40)) // Early wrap-around so bugs will manifest soon
  , latestLoopCnt_(nextLoopCnt_)
  , startWork_()
  , observer_(nullptr)
  , observerSampleCount_(0)
  , executionObserver_(nullptr) {
  struct event ev;
  {
    std::lock_guard<std::mutex> lock(libevent_mutex_);

    // The value 'current_base' (libevent 1) or
    // 'event_global_current_base_' (libevent 2) is filled in by event_set(),
    // allowing examination of its value without an explicit reference here.
    // If ev.ev_base is NULL, then event_init() must be called, otherwise
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
  RequestContext::saveContext();
}

// takes ownership of the event_base
EventBase::EventBase(event_base* evb, bool enableTimeMeasurement)
  : runOnceCallbacks_(nullptr)
  , stop_(false)
  , loopThread_()
  , evb_(evb)
  , queue_(nullptr)
  , fnRunner_(nullptr)
  , maxLatency_(0)
  , avgLoopTime_(std::chrono::seconds(2))
  , maxLatencyLoopTime_(avgLoopTime_)
  , enableTimeMeasurement_(enableTimeMeasurement)
  , nextLoopCnt_(uint64_t(-40)) // Early wrap-around so bugs will manifest soon
  , latestLoopCnt_(nextLoopCnt_)
  , startWork_()
  , observer_(nullptr)
  , observerSampleCount_(0)
  , executionObserver_(nullptr) {
  if (UNLIKELY(evb_ == nullptr)) {
    LOG(ERROR) << "EventBase(): Pass nullptr as event base.";
    throw std::invalid_argument("EventBase(): event base cannot be nullptr");
  }
  initNotificationQueue();
  RequestContext::saveContext();
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

  {
    std::lock_guard<std::mutex> lock(localStorageMutex_);
    for (auto storage : localStorageToDtor_) {
      storage->onEventBaseDestruction(*this);
    }
  }
  VLOG(5) << "EventBase(): Destroyed.";
}

size_t EventBase::getNotificationQueueSize() const {
  return queue_->size();
}

void EventBase::setMaxReadAtOnce(uint32_t maxAtOnce) {
  fnRunner_->setMaxReadAtOnce(maxAtOnce);
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

static std::chrono::milliseconds
getTimeDelta(std::chrono::steady_clock::time_point* prev) {
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

bool EventBase::loopOnce(int flags) {
  return loopBody(flags | EVLOOP_ONCE);
}

bool EventBase::loopBody(int flags) {
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
    idleStart = std::chrono::steady_clock::now();
  }

  while (!stop_.load(std::memory_order_acquire)) {
    applyLoopKeepAlive();
    ++nextLoopCnt_;

    // Run the before loop callbacks
    LoopCallbackList callbacks;
    callbacks.swap(runBeforeLoopCallbacks_);

    while(!callbacks.empty()) {
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
      busy = std::chrono::duration_cast<std::chrono::microseconds>(
          std::chrono::steady_clock::now() - startWork_);
      idle = std::chrono::duration_cast<std::chrono::microseconds>(
          startWork_ - idleStart);

      avgLoopTime_.addSample(std::chrono::microseconds(idle),
        std::chrono::microseconds(busy));
      maxLatencyLoopTime_.addSample(std::chrono::microseconds(idle),
        std::chrono::microseconds(busy));

      if (observer_) {
        if (observerSampleCount_++ == observer_->getSampleRate()) {
          observerSampleCount_ = 0;
          observer_->loopSample(busy.count(), idle.count());
        }
      }

      VLOG(11) << "EventBase "  << this         << " did not timeout " <<
        " loop time guess: "    << (busy + idle).count()  <<
        " idle time: "          << idle.count()         <<
        " busy time: "          << busy.count()         <<
        " avgLoopTime: "        << avgLoopTime_.get() <<
        " maxLatencyLoopTime: " << maxLatencyLoopTime_.get() <<
        " maxLatency_: "        << maxLatency_.count() << "us" <<
        " notificationQueueSize: " << getNotificationQueueSize() <<
        " nothingHandledYet(): " << nothingHandledYet();

      // see if our average loop time has exceeded our limit
      if ((maxLatency_ > std::chrono::microseconds::zero()) &&
          (maxLatencyLoopTime_.get() > double(maxLatency_.count()))) {
        maxLatencyCob_();
        // back off temporarily -- don't keep spamming maxLatencyCob_
        // if we're only a bit over the limit
        maxLatencyLoopTime_.dampen(0.9);
      }

      // Our loop run did real work; reset the idle timer
      idleStart = std::chrono::steady_clock::now();
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
      VLOG(11) << "EventBase " << this << " loop time: " <<
        getTimeDelta(&prev).count();
    }

    if (once) {
      break;
    }
  }
  // Reset stop_ so loop() can be called again
  stop_ = false;

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
  if (loopKeepAliveActive_ && loopKeepAliveCount() == 0) {
    // Restore the notification queue internal flag
    fnRunner_->stopConsuming();
    fnRunner_->startConsumingInternal(this, queue_.get());
    loopKeepAliveActive_ = false;
  } else if (!loopKeepAliveActive_ && loopKeepAliveCount() > 0) {
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

  VLOG(11) << "EventBase " << this << " " << __PRETTY_FUNCTION__ <<
    " (loop) latest " << latestLoopCnt_ << " next " << nextLoopCnt_;
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
  // TODO: We should really use an atomic operation here with a release
  // barrier.
  stop_ = true;

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
  DCHECK(isInEventBaseThread());
  callback->cancelLoopCallback();
  callback->context_ = RequestContext::saveContext();
  if (runOnceCallbacks_ != nullptr && thisIteration) {
    runOnceCallbacks_->push_back(*callback);
  } else {
    loopCallbacks_.push_back(*callback);
  }
}

void EventBase::runInLoop(Func cob, bool thisIteration) {
  DCHECK(isInEventBaseThread());
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
  DCHECK(isInEventBaseThread());
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

bool EventBase::runInEventBaseThreadAndWait(FuncRef fn) {
  if (inRunningEventBaseThread()) {
    LOG(ERROR) << "EventBase " << this << ": Waiting in the event loop is not "
               << "allowed";
    return false;
  }

  bool ready = false;
  std::mutex m;
  std::condition_variable cv;
  runInEventBaseThread([&] {
      SCOPE_EXIT {
        std::unique_lock<std::mutex> l(m);
        ready = true;
        cv.notify_one();
        // We cannot release the lock before notify_one, because a spurious
        // wakeup in the waiting thread may lead to cv and m going out of scope
        // prematurely.
      };
      fn();
  });
  std::unique_lock<std::mutex> l(m);
  cv.wait(l, [&] { return ready; });

  return true;
}

bool EventBase::runImmediatelyOrRunInEventBaseThreadAndWait(FuncRef fn) {
  if (isInEventBaseThread()) {
    fn();
    return true;
  } else {
    return runInEventBaseThreadAndWait(std::move(fn));
  }
}

bool EventBase::runLoopCallbacks() {
  if (!loopCallbacks_.empty()) {
    bumpHandlingTime();
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
      folly::RequestContextScopeGuard rctx(callback->context_);
      callback->runLoopCallback();
    }

    runOnceCallbacks_ = nullptr;
    return true;
  }
  return false;
}

void EventBase::initNotificationQueue() {
  // Infinite size queue
  queue_.reset(new NotificationQueue<Func>());

  // We allocate fnRunner_ separately, rather than declaring it directly
  // as a member of EventBase solely so that we don't need to include
  // NotificationQueue.h from EventBase.h
  fnRunner_.reset(new FunctionRunner());

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
    std::chrono::microseconds idle,
    std::chrono::microseconds busy) {
  /*
   * Position at which the busy sample is considered to be taken.
   * (Allows to quickly skew our average without editing much code)
   */
  enum BusySamplePosition {
    RIGHT = 0, // busy sample placed at the end of the iteration
    CENTER = 1, // busy sample placed at the middle point of the iteration
    LEFT = 2, // busy sample placed at the beginning of the iteration
  };

  // See http://en.wikipedia.org/wiki/Moving_average#Exponential_moving_average
  // and D676020 for more info on this calculation.
  VLOG(11) << "idle " << idle.count() << " oldBusyLeftover_ "
           << oldBusyLeftover_.count() << " idle + oldBusyLeftover_ "
           << (idle + oldBusyLeftover_).count() << " busy " << busy.count()
           << " " << __PRETTY_FUNCTION__;
  idle += oldBusyLeftover_ + busy;
  oldBusyLeftover_ = (busy * BusySamplePosition::CENTER) / 2;
  idle -= oldBusyLeftover_;

  double coeff = exp(idle.count() * expCoeff_);
  value_ *= coeff;
  value_ += (1.0 - coeff) * busy.count();
}

bool EventBase::nothingHandledYet() const noexcept {
  VLOG(11) << "latest " << latestLoopCnt_ << " next " << nextLoopCnt_;
  return (nextLoopCnt_ != latestLoopCnt_);
}

void EventBase::attachTimeoutManager(AsyncTimeout* obj,
                                      InternalEnum internal) {

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

bool EventBase::scheduleTimeout(AsyncTimeout* obj,
                                 TimeoutManager::timeout_type timeout) {
  assert(isInEventBaseThread());
  // Set up the timeval and add the event
  struct timeval tv;
  tv.tv_sec = long(timeout.count() / 1000LL);
  tv.tv_usec = long((timeout.count() % 1000LL) * 1000LL);

  struct event* ev = obj->getEvent();
  if (event_add(ev, &tv) < 0) {
    LOG(ERROR) << "EventBase: failed to schedule timeout: " << strerror(errno);
    return false;
  }

  return true;
}

void EventBase::cancelTimeout(AsyncTimeout* obj) {
  assert(isInEventBaseThread());
  struct event* ev = obj->getEvent();
  if (EventUtil::isEventRegistered(ev)) {
    event_del(ev);
  }
}

void EventBase::setName(const std::string& name) {
  assert(isInEventBaseThread());
  name_ = name;

  if (isRunning()) {
    setThreadName(loopThread_.load(std::memory_order_relaxed),
                  name_);
  }
}

const std::string& EventBase::getName() {
  assert(isInEventBaseThread());
  return name_;
}

const char* EventBase::getLibeventVersion() { return event_get_version(); }
const char* EventBase::getLibeventMethod() { return event_get_method(); }

VirtualEventBase& EventBase::getVirtualEventBase() {
  folly::call_once(virtualEventBaseInitFlag_, [&] {
    virtualEventBase_ = folly::make_unique<VirtualEventBase>(*this);
  });

  return *virtualEventBase_;
}

} // folly
