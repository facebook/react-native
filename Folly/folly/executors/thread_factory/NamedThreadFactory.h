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

#include <atomic>
#include <string>
#include <thread>

#include <folly/Conv.h>
#include <folly/Range.h>
#include <folly/executors/thread_factory/ThreadFactory.h>
#include <folly/system/ThreadName.h>

namespace folly {

class NamedThreadFactory : public ThreadFactory {
 public:
  explicit NamedThreadFactory(folly::StringPiece prefix)
      : prefix_(prefix.str()), suffix_(0) {}

  std::thread newThread(Func&& func) override {
    auto name = folly::to<std::string>(prefix_, suffix_++);
    return std::thread(
        [func = std::move(func), name = std::move(name)]() mutable {
          folly::setThreadName(name);
          func();
        });
  }

  void setNamePrefix(folly::StringPiece prefix) {
    prefix_ = prefix.str();
  }

  std::string getNamePrefix() {
    return prefix_;
  }

 private:
  std::string prefix_;
  std::atomic<uint64_t> suffix_;
};

} // namespace folly
