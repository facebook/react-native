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
#include <folly/io/async/AsyncSignalHandler.h>

#include <folly/io/async/EventBase.h>

#include <folly/Conv.h>

using std::make_pair;
using std::pair;
using std::string;

namespace folly {

AsyncSignalHandler::AsyncSignalHandler(EventBase* eventBase)
    : eventBase_(eventBase) {}

AsyncSignalHandler::~AsyncSignalHandler() {
  // Unregister any outstanding events
  for (SignalEventMap::iterator it = signalEvents_.begin();
       it != signalEvents_.end();
       ++it) {
    event_del(&it->second);
  }
}

void AsyncSignalHandler::attachEventBase(EventBase* eventBase) {
  assert(eventBase_ == nullptr);
  assert(signalEvents_.empty());
  eventBase_ = eventBase;
}

void AsyncSignalHandler::detachEventBase() {
  assert(eventBase_ != nullptr);
  assert(signalEvents_.empty());
  eventBase_ = nullptr;
}

void AsyncSignalHandler::registerSignalHandler(int signum) {
  pair<SignalEventMap::iterator, bool> ret =
      signalEvents_.insert(make_pair(signum, event()));
  if (!ret.second) {
    // This signal has already been registered
    throw std::runtime_error(
        folly::to<string>("handler already registered for signal ", signum));
  }

  struct event* ev = &(ret.first->second);
  try {
    signal_set(ev, signum, libeventCallback, this);
    if (event_base_set(eventBase_->getLibeventBase(), ev) != 0) {
      throw std::runtime_error(folly::to<string>(
          "error initializing event handler for signal ", signum));
    }

    if (event_add(ev, nullptr) != 0) {
      throw std::runtime_error(
          folly::to<string>("error adding event handler for signal ", signum));
    }
  } catch (...) {
    signalEvents_.erase(ret.first);
    throw;
  }
}

void AsyncSignalHandler::unregisterSignalHandler(int signum) {
  SignalEventMap::iterator it = signalEvents_.find(signum);
  if (it == signalEvents_.end()) {
    throw std::runtime_error(folly::to<string>(
        "unable to unregister handler for signal ",
        signum,
        ": signal not registered"));
  }

  event_del(&it->second);
  signalEvents_.erase(it);
}

void AsyncSignalHandler::libeventCallback(
    libevent_fd_t signum,
    short /* events */,
    void* arg) {
  AsyncSignalHandler* handler = static_cast<AsyncSignalHandler*>(arg);
  handler->signalReceived(int(signum));
}

} // namespace folly
