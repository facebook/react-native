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

#include <folly/fibers/FiberManagerInternal.h>
#include <folly/fibers/LoopController.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/VirtualEventBase.h>
#include <atomic>
#include <memory>

namespace folly {
class EventBase;
}

namespace folly {
namespace fibers {

template <typename EventBaseT>
class EventBaseLoopControllerT : public LoopController {
 public:
  explicit EventBaseLoopControllerT();
  ~EventBaseLoopControllerT();

  /**
   * Attach EventBase after LoopController was created.
   */
  void attachEventBase(EventBaseT& eventBase);

  EventBaseT* getEventBase() {
    return eventBase_;
  }

  void setLoopRunner(InlineFunctionRunner* loopRunner) {
    loopRunner_ = loopRunner;
  }

 private:
  class ControllerCallback : public folly::EventBase::LoopCallback {
   public:
    explicit ControllerCallback(EventBaseLoopControllerT& controller)
        : controller_(controller) {}

    void runLoopCallback() noexcept override {
      controller_.runLoop();
    }

   private:
    EventBaseLoopControllerT& controller_;
  };

  class DestructionCallback : public folly::EventBase::LoopCallback {
   public:
    DestructionCallback() : alive_(new int(42)) {}
    ~DestructionCallback() {
      reset();
    }

    void runLoopCallback() noexcept override {
      reset();
    }

    std::weak_ptr<void> getWeak() {
      return {alive_};
    }

   private:
    void reset() {
      std::weak_ptr<void> aliveWeak(alive_);
      alive_.reset();

      while (!aliveWeak.expired()) {
        // Spin until all operations requiring EventBaseLoopController to be
        // alive are complete.
      }
    }

    std::shared_ptr<void> alive_;
  };

  bool awaitingScheduling_{false};
  EventBaseT* eventBase_{nullptr};
  Executor::KeepAlive eventBaseKeepAlive_;
  ControllerCallback callback_;
  DestructionCallback destructionCallback_;
  FiberManager* fm_{nullptr};
  std::atomic<bool> eventBaseAttached_{false};
  std::weak_ptr<void> aliveWeak_;
  InlineFunctionRunner* loopRunner_{nullptr};

  /* LoopController interface */

  void setFiberManager(FiberManager* fm) override;
  void schedule() override;
  void cancel() override;
  void runLoop() override;
  void scheduleThreadSafe(std::function<bool()> func) override;
  void timedSchedule(std::function<void()> func, TimePoint time) override;

  friend class FiberManager;
};

using EventBaseLoopController = EventBaseLoopControllerT<folly::EventBase>;
using VirtualEventBaseLoopController =
    EventBaseLoopControllerT<folly::VirtualEventBase>;
}
} // folly::fibers

#include "EventBaseLoopController-inl.h"
