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

#include <folly/io/async/EventBaseThread.h>

#include <folly/Memory.h>
#include <folly/io/async/ScopedEventBaseThread.h>

namespace folly {

EventBaseThread::EventBaseThread() : EventBaseThread(true) {}

EventBaseThread::EventBaseThread(bool autostart, EventBaseManager* ebm)
    : ebm_(ebm) {
  if (autostart) {
    start();
  }
}

EventBaseThread::EventBaseThread(EventBaseManager* ebm)
    : EventBaseThread(true, ebm) {}

EventBaseThread::~EventBaseThread() = default;

EventBaseThread::EventBaseThread(EventBaseThread&&) noexcept = default;
EventBaseThread& EventBaseThread::operator=(EventBaseThread&&) noexcept =
    default;

EventBase* EventBaseThread::getEventBase() const {
  return th_ ? th_->getEventBase() : nullptr;
}

bool EventBaseThread::running() const {
  return !!th_;
}

void EventBaseThread::start() {
  if (th_) {
    return;
  }
  th_ = make_unique<ScopedEventBaseThread>(ebm_);
}

void EventBaseThread::stop() {
  th_ = nullptr;
}
}
