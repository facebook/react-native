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
#include <folly/io/async/VirtualEventBase.h>

namespace folly {

VirtualEventBase::VirtualEventBase(EventBase& evb)
    : evb_(getKeepAliveToken(evb)) {}

std::future<void> VirtualEventBase::destroy() {
  CHECK(evb_->runInEventBaseThread([this] { loopKeepAlive_.reset(); }));

  return std::move(destroyFuture_);
}

void VirtualEventBase::destroyImpl() {
  try {
    {
      // After destroyPromise_ is posted this object may be destroyed, so make
      // sure we release EventBase's keep-alive token before that.
      SCOPE_EXIT {
        evb_.reset();
      };

      clearCobTimeouts();

      // To avoid potential deadlock, do not hold the mutex while invoking
      // user-supplied callbacks.
      LoopCallbackList callbacks;
      onDestructionCallbacks_.swap(callbacks);
      while (!callbacks.empty()) {
        auto& callback = callbacks.front();
        callbacks.pop_front();
        callback.runLoopCallback();
      }
    }

    destroyPromise_.set_value();
  } catch (...) {
    destroyPromise_.set_exception(std::current_exception());
  }
}

VirtualEventBase::~VirtualEventBase() {
  if (!destroyFuture_.valid()) {
    return;
  }
  CHECK(!evb_->inRunningEventBaseThread());
  destroy().get();
}

void VirtualEventBase::runOnDestruction(EventBase::LoopCallback* callback) {
  onDestructionCallbacks_.withWLock([&](LoopCallbackList& callbacks) {
    callback->cancelLoopCallback();
    callbacks.push_back(*callback);
  });
}
} // namespace folly
