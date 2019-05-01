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

#include <folly/io/async/EventBaseManager.h>

namespace folly {

std::atomic<EventBaseManager*> globalManager(nullptr);

EventBaseManager* EventBaseManager::get() {
  EventBaseManager* mgr = globalManager;
  if (mgr) {
    return mgr;
  }

  EventBaseManager* new_mgr = new EventBaseManager;
  bool exchanged = globalManager.compare_exchange_strong(mgr, new_mgr);
  if (!exchanged) {
    delete new_mgr;
    return mgr;
  } else {
    return new_mgr;
  }
}

/*
 * EventBaseManager methods
 */

void EventBaseManager::setEventBase(EventBase* eventBase, bool takeOwnership) {
  EventBaseInfo* info = localStore_.get();
  if (info != nullptr) {
    throw std::runtime_error(
        "EventBaseManager: cannot set a new EventBase "
        "for this thread when one already exists");
  }

  info = new EventBaseInfo(eventBase, takeOwnership);
  localStore_.reset(info);
  this->trackEventBase(eventBase);
}

void EventBaseManager::clearEventBase() {
  EventBaseInfo* info = localStore_.get();
  if (info != nullptr) {
    this->untrackEventBase(info->eventBase);
    this->localStore_.reset(nullptr);
  }
}

// XXX should this really be "const"?
EventBase* EventBaseManager::getEventBase() const {
  // have one?
  auto* info = localStore_.get();
  if (!info) {
    info = new EventBaseInfo();
    localStore_.reset(info);

    if (observer_) {
      info->eventBase->setObserver(observer_);
    }

    // start tracking the event base
    // XXX
    // note: ugly cast because this does something mutable
    // even though this method is defined as "const".
    // Simply removing the const causes trouble all over fbcode;
    // lots of services build a const EventBaseManager and errors
    // abound when we make this non-const.
    (const_cast<EventBaseManager*>(this))->trackEventBase(info->eventBase);
  }

  return info->eventBase;
}

} // namespace folly
