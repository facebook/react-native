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

#pragma once

#include <memory>
#include <thread>

#include <folly/io/async/EventBase.h>
#include <folly/synchronization/Baton.h>

namespace folly {

class EventBaseManager;
template <class Iter>
class Range;
typedef Range<const char*> StringPiece;

/**
 * A helper class to start a new thread running a EventBase loop.
 *
 * The new thread will be started by the ScopedEventBaseThread constructor.
 * When the ScopedEventBaseThread object is destroyed, the thread will be
 * stopped.
 */
class ScopedEventBaseThread : public IOExecutor, public SequencedExecutor {
 public:
  ScopedEventBaseThread();
  explicit ScopedEventBaseThread(const StringPiece& name);
  explicit ScopedEventBaseThread(EventBaseManager* ebm);
  explicit ScopedEventBaseThread(
      EventBaseManager* ebm,
      const StringPiece& name);
  ~ScopedEventBaseThread();

  EventBase* getEventBase() const {
    return &eb_;
  }

  EventBase* getEventBase() override {
    return &eb_;
  }

  std::thread::id getThreadId() const {
    return th_.get_id();
  }

  void add(Func func) override {
    getEventBase()->add(std::move(func));
  }

 private:
  ScopedEventBaseThread(ScopedEventBaseThread&& other) = delete;
  ScopedEventBaseThread& operator=(ScopedEventBaseThread&& other) = delete;

  ScopedEventBaseThread(const ScopedEventBaseThread& other) = delete;
  ScopedEventBaseThread& operator=(const ScopedEventBaseThread& other) = delete;

  EventBaseManager* ebm_;
  union {
    mutable EventBase eb_;
  };
  std::thread th_;
  folly::Baton<> stop_;
};

} // namespace folly
