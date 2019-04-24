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

#pragma once

#include <folly/executors/IOExecutor.h>
#include <folly/fibers/FiberManagerMap.h>

namespace folly {

/**
 * @class FiberIOExecutor
 * @brief An IOExecutor that executes funcs under mapped fiber context
 *
 * A FiberIOExecutor wraps an IOExecutor, but executes funcs on the FiberManager
 * mapped to the underlying IOExector's event base.
 */
class FiberIOExecutor : public IOExecutor {
 public:
  explicit FiberIOExecutor(
      const std::shared_ptr<IOExecutor>& ioExecutor,
      fibers::FiberManager::Options opts = fibers::FiberManager::Options())
      : ioExecutor_(ioExecutor), options_(std::move(opts)) {}

  virtual void add(folly::Function<void()> f) override {
    auto eventBase = ioExecutor_->getEventBase();
    folly::fibers::getFiberManager(*eventBase, options_).add(std::move(f));
  }

  virtual folly::EventBase* getEventBase() override {
    return ioExecutor_->getEventBase();
  }

 private:
  std::shared_ptr<IOExecutor> ioExecutor_;
  fibers::FiberManager::Options options_;
};

} // namespace folly
