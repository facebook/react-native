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

#include <folly/io/async/AsyncTimeout.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/EventUtil.h>
#include <folly/io/async/Request.h>

#include <assert.h>
#include <glog/logging.h>

namespace folly {

AsyncTimeout::AsyncTimeout(TimeoutManager* timeoutManager)
    : timeoutManager_(timeoutManager) {
  folly_event_set(
      &event_, -1, EV_TIMEOUT, &AsyncTimeout::libeventCallback, this);
  event_.ev_base = nullptr;
  timeoutManager_->attachTimeoutManager(
      this, TimeoutManager::InternalEnum::NORMAL);
}

AsyncTimeout::AsyncTimeout(EventBase* eventBase) : timeoutManager_(eventBase) {
  folly_event_set(
      &event_, -1, EV_TIMEOUT, &AsyncTimeout::libeventCallback, this);
  event_.ev_base = nullptr;
  if (eventBase) {
    timeoutManager_->attachTimeoutManager(
        this, TimeoutManager::InternalEnum::NORMAL);
  }
}

AsyncTimeout::AsyncTimeout(
    TimeoutManager* timeoutManager,
    InternalEnum internal)
    : timeoutManager_(timeoutManager) {
  folly_event_set(
      &event_, -1, EV_TIMEOUT, &AsyncTimeout::libeventCallback, this);
  event_.ev_base = nullptr;
  timeoutManager_->attachTimeoutManager(this, internal);
}

AsyncTimeout::AsyncTimeout(EventBase* eventBase, InternalEnum internal)
    : timeoutManager_(eventBase) {
  folly_event_set(
      &event_, -1, EV_TIMEOUT, &AsyncTimeout::libeventCallback, this);
  event_.ev_base = nullptr;
  timeoutManager_->attachTimeoutManager(this, internal);
}

AsyncTimeout::AsyncTimeout() : timeoutManager_(nullptr) {
  folly_event_set(
      &event_, -1, EV_TIMEOUT, &AsyncTimeout::libeventCallback, this);
  event_.ev_base = nullptr;
}

AsyncTimeout::~AsyncTimeout() {
  cancelTimeout();
}

bool AsyncTimeout::scheduleTimeout(TimeoutManager::timeout_type timeout) {
  assert(timeoutManager_ != nullptr);
  context_ = RequestContext::saveContext();
  return timeoutManager_->scheduleTimeout(this, timeout);
}

bool AsyncTimeout::scheduleTimeout(uint32_t milliseconds) {
  return scheduleTimeout(TimeoutManager::timeout_type(milliseconds));
}

void AsyncTimeout::cancelTimeout() {
  if (isScheduled()) {
    timeoutManager_->cancelTimeout(this);
    context_.reset();
  }
}

bool AsyncTimeout::isScheduled() const {
  return EventUtil::isEventRegistered(&event_);
}

void AsyncTimeout::attachTimeoutManager(
    TimeoutManager* timeoutManager,
    InternalEnum internal) {
  // This also implies no timeout is scheduled.
  assert(timeoutManager_ == nullptr);
  assert(timeoutManager->isInTimeoutManagerThread());
  timeoutManager_ = timeoutManager;

  timeoutManager_->attachTimeoutManager(this, internal);
}

void AsyncTimeout::attachEventBase(
    EventBase* eventBase,
    InternalEnum internal) {
  attachTimeoutManager(eventBase, internal);
}

void AsyncTimeout::detachTimeoutManager() {
  // Only allow the event base to be changed if the timeout is not
  // currently installed.
  if (isScheduled()) {
    // Programmer bug.  Abort the program.
    LOG(FATAL) << "detachEventBase() called on scheduled timeout; aborting";
  }

  if (timeoutManager_) {
    timeoutManager_->detachTimeoutManager(this);
    timeoutManager_ = nullptr;
  }
}

void AsyncTimeout::detachEventBase() {
  detachTimeoutManager();
}

void AsyncTimeout::libeventCallback(libevent_fd_t fd, short events, void* arg) {
  AsyncTimeout* timeout = reinterpret_cast<AsyncTimeout*>(arg);
  assert(libeventFdToFd(fd) == -1);
  assert(events == EV_TIMEOUT);
  // prevent unused variable warnings
  (void)fd;
  (void)events;

  // double check that ev_flags gets reset when the timeout is not running
  assert((event_ref_flags(&timeout->event_) & ~EVLIST_INTERNAL) == EVLIST_INIT);

  // this can't possibly fire if timeout->eventBase_ is nullptr
  timeout->timeoutManager_->bumpHandlingTime();

  RequestContextScopeGuard rctx(timeout->context_);

  timeout->timeoutExpired();
}

} // namespace folly
