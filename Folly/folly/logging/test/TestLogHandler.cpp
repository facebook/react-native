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
#include <folly/logging/test/TestLogHandler.h>

#include <folly/MapUtil.h>

namespace folly {

std::vector<std::string> TestLogHandler::getMessageValues() const {
  std::vector<std::string> values;
  values.reserve(messages_.size());
  for (const auto& msgInfo : messages_) {
    values.push_back(msgInfo.first.getMessage());
  }
  return values;
}

std::shared_ptr<LogHandler> TestLogHandlerFactory::createHandler(
    const Options& options) {
  return std::make_shared<TestLogHandler>(LogHandlerConfig{type_, options});
}

std::shared_ptr<LogHandler> TestLogHandlerFactory::updateHandler(
    const std::shared_ptr<LogHandler>& existingHandler,
    const Options& options) {
  // Only re-use an existing handler in-place if it is a TestLogHandler
  // and if the new options contain reuse_handler
  auto existing = std::dynamic_pointer_cast<TestLogHandler>(existingHandler);
  if (!existing || !get_ptr(options, "reuse_handler")) {
    return createHandler(options);
  }

  existing->setOptions(options);
  return existing;
}

} // namespace folly
