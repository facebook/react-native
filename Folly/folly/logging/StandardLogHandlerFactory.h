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

#include <string>
#include <unordered_map>

#include <folly/Range.h>

namespace folly {

class LogWriter;
class LogFormatter;
class StandardLogHandler;

/**
 * StandardLogHandlerFactory contains helper methods for LogHandlerFactory
 * implementations that create StandardLogHandler objects.
 *
 * StandardLogHandlerFactory does not derive from LogHandlerFactory itself.
 */
class StandardLogHandlerFactory {
 public:
  using Options = std::unordered_map<std::string, std::string>;

  class OptionProcessor {
   public:
    virtual ~OptionProcessor() {}

    /**
     * Process an option.
     *
     * This should return true if the option was processed successfully,
     * or false if this is an unknown option name.  It should throw an
     * exception if the option name is known but there is a problem with the
     * value.
     */
    virtual bool processOption(StringPiece name, StringPiece value) = 0;
  };

  class FormatterFactory : public OptionProcessor {
   public:
    virtual std::shared_ptr<LogFormatter> createFormatter(
        const std::shared_ptr<LogWriter>& logWriter) = 0;
  };

  class WriterFactory : public OptionProcessor {
   public:
    virtual std::shared_ptr<LogWriter> createWriter() = 0;
  };

  static std::shared_ptr<StandardLogHandler> createHandler(
      StringPiece type,
      WriterFactory* writerFactory,
      const Options& options);
};

} // namespace folly
