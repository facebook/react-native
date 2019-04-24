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
#pragma once

#include <folly/fibers/FiberManagerInternal.h>
#include <folly/fibers/LoopController.h>
#include <folly/io/async/VirtualEventBase.h>
#include <atomic>
#include <memory>

namespace folly {
namespace fibers {

class EventBaseLoopController : public LoopController {
 public:
  explicit EventBaseLoopController();
  ~EventBaseLoopController() override;

  /**
   * Attach EventBase after LoopController was created.
   */
  void attachEventBase(EventBase& eventBase);
  void attachEventBase(VirtualEventBase& eventBase);

  VirtualEventBase* getEventBase() {
    return eventBase_;
  }

  void setLoopRunner(InlineFunctionRunner* loopRunner) {
    loopRunner_ = loopRunner;
  }

 private:
  class ControllerCallback : public folly::EventBase::LoopCallback {
   public:
    explicit ControllerCallback(EventBaseLoopController& controller)
        : controller_(controller) {}

    void runLoopCallback() noexcept override {
      controller_.runLoop();
    }

   private:
    EventBaseLoopController& controller_;
  };

  bool awaitingScheduling_{false};
  VirtualEventBase* eventBase_{nullptr};
  Executor::KeepAlive<VirtualEventBase> eventBaseKeepAlive_;
  ControllerCallback callback_;
  FiberManager* fm_{nullptr};
  std::atomic<bool> eventBaseAttached_{false};
  InlineFunctionRunner* loopRunner_{nullptr};

  /* LoopController interface */

  void setFiberManager(FiberManager* fm) override;
  void schedule() override;
  void runLoop() override;
  void scheduleThreadSafe() override;
  void timedSchedule(std::function<void()> func, TimePoint time) override;

  friend class FiberManager;
};
} // namespace fibers
} // namespace folly

#include <folly/fibers/EventBaseLoopController-inl.h>
