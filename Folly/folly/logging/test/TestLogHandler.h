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

#include <map>
#include <string>
#include <utility>
#include <vector>

#include <folly/logging/LogHandler.h>
#include <folly/logging/LogHandlerConfig.h>
#include <folly/logging/LogHandlerFactory.h>
#include <folly/logging/LogMessage.h>

namespace folly {

/**
 * A LogHandler that simply keeps a vector of all LogMessages it receives.
 *
 * This class is not thread-safe.  It is intended to be used in single-threaded
 * tests.
 */
class TestLogHandler : public LogHandler {
 public:
  using Options = LogHandlerConfig::Options;

  TestLogHandler() : config_{"test"} {}
  explicit TestLogHandler(LogHandlerConfig config)
      : config_{std::move(config)} {}

  std::vector<std::pair<LogMessage, const LogCategory*>>& getMessages() {
    return messages_;
  }

  std::vector<std::string> getMessageValues() const;
  void clearMessages() {
    messages_.clear();
  }

  void handleMessage(
      const LogMessage& message,
      const LogCategory* handlerCategory) override {
    messages_.emplace_back(message, handlerCategory);
  }

  void flush() override {
    ++flushCount_;
  }

  uint64_t getFlushCount() const {
    return flushCount_;
  }

  LogHandlerConfig getConfig() const override {
    return config_;
  }

  void setOptions(const Options& options) {
    config_.options = options;
  }

 protected:
  std::vector<std::pair<LogMessage, const LogCategory*>> messages_;
  uint64_t flushCount_{0};
  std::map<std::string, std::string> options_;
  LogHandlerConfig config_;
};

/**
 * A LogHandlerFactory to create TestLogHandler objects.
 */
class TestLogHandlerFactory : public LogHandlerFactory {
 public:
  explicit TestLogHandlerFactory(StringPiece type) : type_{type.str()} {}

  StringPiece getType() const override {
    return type_;
  }

  std::shared_ptr<LogHandler> createHandler(const Options& options) override;

  std::shared_ptr<LogHandler> updateHandler(
      const std::shared_ptr<LogHandler>& existingHandler,
      const Options& options) override;

 private:
  std::string type_;
};

} // namespace folly
