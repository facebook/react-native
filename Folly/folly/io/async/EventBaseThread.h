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

#pragma once

#include <memory>

namespace folly {

class EventBase;
class EventBaseManager;
class ScopedEventBaseThread;

class EventBaseThread {
 public:
  EventBaseThread();
  explicit EventBaseThread(bool autostart, EventBaseManager* ebm = nullptr);
  explicit EventBaseThread(EventBaseManager* ebm);
  ~EventBaseThread();

  EventBaseThread(EventBaseThread&&) noexcept;
  EventBaseThread& operator=(EventBaseThread&&) noexcept;

  EventBase* getEventBase() const;

  bool running() const;
  void start();
  void stop();

 private:
  EventBaseThread(EventBaseThread const&) = default;
  EventBaseThread& operator=(EventBaseThread const&) = default;

  EventBaseManager* ebm_;
  std::unique_ptr<ScopedEventBaseThread> th_;
};
}
