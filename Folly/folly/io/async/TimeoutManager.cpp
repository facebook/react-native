/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/io/async/TimeoutManager.h>

#include <boost/intrusive/list.hpp>

#include <folly/Exception.h>
#include <folly/Memory.h>
#include <folly/io/async/AsyncTimeout.h>

#include <glog/logging.h>

namespace folly {

struct TimeoutManager::CobTimeouts {
  // small object used as a callback arg with enough info to execute the
  // appropriate client-provided Cob
  class CobTimeout : public AsyncTimeout {
   public:
    CobTimeout(TimeoutManager* timeoutManager, Func cob, InternalEnum internal)
        : AsyncTimeout(timeoutManager, internal), cob_(std::move(cob)) {}

    void timeoutExpired() noexcept override {
      // For now, we just swallow any exceptions that the callback threw.
      try {
        cob_();
      } catch (const std::exception& ex) {
        LOG(ERROR) << "TimeoutManager::runAfterDelay() callback threw "
                   << typeid(ex).name() << " exception: " << ex.what();
      } catch (...) {
        LOG(ERROR) << "TimeoutManager::runAfterDelay() callback threw "
                   << "non-exception type";
      }

      // The CobTimeout object was allocated on the heap by runAfterDelay(),
      // so delete it now that the it has fired.
      delete this;
    }

   private:
    Func cob_;

   public:
    using ListHook = boost::intrusive::list_member_hook<
        boost::intrusive::link_mode<boost::intrusive::auto_unlink>>;
    ListHook hook;
    using List = boost::intrusive::list<
        CobTimeout,
        boost::intrusive::member_hook<CobTimeout, ListHook, &CobTimeout::hook>,
        boost::intrusive::constant_time_size<false>>;
  };

  CobTimeout::List list;
};

TimeoutManager::TimeoutManager()
    : cobTimeouts_(std::make_unique<CobTimeouts>()) {}

void TimeoutManager::runAfterDelay(
    Func cob,
    uint32_t milliseconds,
    InternalEnum internal) {
  if (!tryRunAfterDelay(std::move(cob), milliseconds, internal)) {
    folly::throwSystemError(
        "error in TimeoutManager::runAfterDelay(), failed to schedule timeout");
  }
}

bool TimeoutManager::tryRunAfterDelay(
    Func cob,
    uint32_t milliseconds,
    InternalEnum internal) {
  if (!cobTimeouts_) {
    return false;
  }

  auto timeout =
      std::make_unique<CobTimeouts::CobTimeout>(this, std::move(cob), internal);
  if (!timeout->scheduleTimeout(milliseconds)) {
    return false;
  }
  cobTimeouts_->list.push_back(*timeout.release());
  return true;
}

void TimeoutManager::clearCobTimeouts() {
  if (!cobTimeouts_) {
    return;
  }

  // Delete any unfired callback objects, so that we don't leak memory
  // Note that we don't fire them.
  while (!cobTimeouts_->list.empty()) {
    auto* timeout = &cobTimeouts_->list.front();
    delete timeout;
  }
}

TimeoutManager::~TimeoutManager() {
  clearCobTimeouts();
}
} // namespace folly
