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
#include <folly/logging/StandardLogHandler.h>

#include <folly/logging/LogFormatter.h>
#include <folly/logging/LogMessage.h>
#include <folly/logging/LogWriter.h>

namespace folly {

StandardLogHandler::StandardLogHandler(
    LogHandlerConfig config,
    std::shared_ptr<LogFormatter> formatter,
    std::shared_ptr<LogWriter> writer,
    LogLevel syncLevel)
    : syncLevel_(syncLevel),
      formatter_{std::move(formatter)},
      writer_{std::move(writer)},
      config_{config} {}

StandardLogHandler::~StandardLogHandler() {}

void StandardLogHandler::handleMessage(
    const LogMessage& message,
    const LogCategory* handlerCategory) {
  if (message.getLevel() < getLevel()) {
    return;
  }
  writer_->writeMessage(formatter_->formatMessage(message, handlerCategory));
  if (message.getLevel() >= syncLevel_.load(std::memory_order_relaxed)) {
    flush();
  }
}

void StandardLogHandler::flush() {
  writer_->flush();
}

LogHandlerConfig StandardLogHandler::getConfig() const {
  return config_;
}

} // namespace folly
