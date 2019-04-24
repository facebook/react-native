/*
 * Copyright 2015-present Facebook, Inc.
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

#include <folly/io/async/EventBaseLocal.h>
#include <folly/MapUtil.h>
#include <atomic>
#include <thread>

namespace folly {
namespace detail {

EventBaseLocalBase::~EventBaseLocalBase() {
  auto locked = eventBases_.rlock();
  for (auto* evb : *locked) {
    evb->runInEventBaseThread([this, evb, key = key_] {
      evb->localStorage_.erase(key);
      evb->localStorageToDtor_.erase(this);
    });
  }
}

void* EventBaseLocalBase::getVoid(EventBase& evb) {
  evb.dcheckIsInEventBaseThread();

  return folly::get_default(evb.localStorage_, key_, {}).get();
}

void EventBaseLocalBase::erase(EventBase& evb) {
  evb.dcheckIsInEventBaseThread();

  evb.localStorage_.erase(key_);
  evb.localStorageToDtor_.erase(this);

  eventBases_.wlock()->erase(&evb);
}

void EventBaseLocalBase::onEventBaseDestruction(EventBase& evb) {
  evb.dcheckIsInEventBaseThread();

  eventBases_.wlock()->erase(&evb);
}

void EventBaseLocalBase::setVoid(EventBase& evb, std::shared_ptr<void>&& ptr) {
  evb.dcheckIsInEventBaseThread();

  auto alreadyExists = evb.localStorage_.find(key_) != evb.localStorage_.end();

  evb.localStorage_.emplace(key_, std::move(ptr));

  if (!alreadyExists) {
    eventBases_.wlock()->insert(&evb);
    evb.localStorageToDtor_.insert(this);
  }
}

std::atomic<std::size_t> EventBaseLocalBase::keyCounter_{0};
} // namespace detail
} // namespace folly
