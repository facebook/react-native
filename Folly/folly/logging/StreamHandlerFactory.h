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

#include <folly/logging/LogHandlerFactory.h>

namespace folly {

/**
 * StreamHandlerFactory is a LogHandlerFactory that constructs log handlers
 * that write to stdout or stderr.
 *
 * This is quite similar to FileHandlerFactory, but it always writes to an
 * existing open file descriptor rather than opening a new file.  This handler
 * factory is separate from FileHandlerFactory primarily for safety reasons:
 * FileHandlerFactory supports appending to arbitrary files via config
 * parameters, while StreamHandlerFactory does not.
 */
class StreamHandlerFactory : public LogHandlerFactory {
 public:
  StringPiece getType() const override {
    return "stream";
  }

  std::shared_ptr<LogHandler> createHandler(const Options& options) override;

 private:
  class WriterFactory;
};

} // namespace folly
