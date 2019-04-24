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

#include <folly/io/async/ScopedEventBaseThread.h>

#include <thread>

#include <folly/Function.h>
#include <folly/Range.h>
#include <folly/io/async/EventBaseManager.h>
#include <folly/system/ThreadName.h>

using namespace std;

namespace folly {

static void run(
    EventBaseManager* ebm,
    EventBase* eb,
    folly::Baton<>* stop,
    const StringPiece& name) {
  if (name.size()) {
    folly::setThreadName(name);
  }

  ebm->setEventBase(eb, false);
  eb->loopForever();

  // must destruct in io thread for on-destruction callbacks
  EventBase::StackFunctionLoopCallback cb([=] { ebm->clearEventBase(); });
  eb->runOnDestruction(&cb);
  // wait until terminateLoopSoon() is complete
  stop->wait();
  eb->~EventBase();
}

ScopedEventBaseThread::ScopedEventBaseThread()
    : ScopedEventBaseThread(nullptr, "") {}

ScopedEventBaseThread::ScopedEventBaseThread(const StringPiece& name)
    : ScopedEventBaseThread(nullptr, name) {}

ScopedEventBaseThread::ScopedEventBaseThread(EventBaseManager* ebm)
    : ScopedEventBaseThread(ebm, "") {}

ScopedEventBaseThread::ScopedEventBaseThread(
    EventBaseManager* ebm,
    const StringPiece& name)
    : ebm_(ebm ? ebm : EventBaseManager::get()) {
  new (&eb_) EventBase();
  th_ = thread(run, ebm_, &eb_, &stop_, name);
  eb_.waitUntilRunning();
}

ScopedEventBaseThread::~ScopedEventBaseThread() {
  eb_.terminateLoopSoon();
  stop_.post();
  th_.join();
}

} // namespace folly
