/*
 * Copyright 2017-present Facebook, Inc.
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

#include <memory>
#include <thread>

#include <folly/Function.h>
#include <folly/SharedMutex.h>
#include <folly/Singleton.h>
#include <folly/executors/IOExecutor.h>
#include <folly/executors/IOThreadPoolExecutor.h>
#include <folly/executors/InlineExecutor.h>

using namespace folly;

namespace {

template <class ExecutorBase>
class GlobalExecutor {
 public:
  explicit GlobalExecutor(
      Function<std::unique_ptr<ExecutorBase>()> constructDefault)
      : constructDefault_(std::move(constructDefault)) {}

  std::shared_ptr<ExecutorBase> get() {
    {
      SharedMutex::ReadHolder guard(mutex_);
      if (auto executor = executor_.lock()) {
        return executor; // Fast path.
      }
    }

    SharedMutex::WriteHolder guard(mutex_);
    if (auto executor = executor_.lock()) {
      return executor;
    }

    if (!defaultExecutor_) {
      defaultExecutor_ = constructDefault_();
    }

    return defaultExecutor_;
  }

  void set(std::weak_ptr<ExecutorBase> executor) {
    SharedMutex::WriteHolder guard(mutex_);
    executor_.swap(executor);
  }

 private:
  SharedMutex mutex_;
  std::weak_ptr<ExecutorBase> executor_;
  std::shared_ptr<ExecutorBase> defaultExecutor_;
  Function<std::unique_ptr<ExecutorBase>()> constructDefault_;
};

Singleton<GlobalExecutor<Executor>> gGlobalCPUExecutor([] {
  return new GlobalExecutor<Executor>(
      // Default global CPU executor is an InlineExecutor.
      [] { return std::make_unique<InlineExecutor>(); });
});

Singleton<GlobalExecutor<IOExecutor>> gGlobalIOExecutor([] {
  return new GlobalExecutor<IOExecutor>(
      // Default global IO executor is an IOThreadPoolExecutor.
      [] {
        return std::make_unique<IOThreadPoolExecutor>(
            std::thread::hardware_concurrency(),
            std::make_shared<NamedThreadFactory>("GlobalIOThreadPool"));
      });
});

} // namespace

namespace folly {

std::shared_ptr<Executor> getCPUExecutor() {
  if (auto singleton = gGlobalCPUExecutor.try_get()) {
    return singleton->get();
  }
  return nullptr;
}

void setCPUExecutor(std::weak_ptr<Executor> executor) {
  if (auto singleton = gGlobalCPUExecutor.try_get()) {
    singleton->set(std::move(executor));
  }
}

std::shared_ptr<IOExecutor> getIOExecutor() {
  if (auto singleton = gGlobalIOExecutor.try_get()) {
    return singleton->get();
  }
  return nullptr;
}

void setIOExecutor(std::weak_ptr<IOExecutor> executor) {
  if (auto singleton = gGlobalIOExecutor.try_get()) {
    singleton->set(std::move(executor));
  }
}

EventBase* getEventBase() {
  return getIOExecutor()->getEventBase();
}

} // namespace folly
