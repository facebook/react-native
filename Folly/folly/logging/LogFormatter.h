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

namespace folly {

class LogCategory;
class LogMessage;

/**
 * LogFormatter defines the interface for serializing a LogMessage object
 * into a buffer to be given to a LogWriter.
 */
class LogFormatter {
 public:
  virtual ~LogFormatter() {}

  /**
   * Serialze a LogMessage object.
   *
   * @param message The LogMessage object to serialze.
   * @param handlerCategory The LogCategory that is currently handling this
   *     message.  Note that this is likely different from the LogCategory
   *     where the message was originally logged, which can be accessed as
   *     message->getCategory()
   */
  virtual std::string formatMessage(
      const LogMessage& message,
      const LogCategory* handlerCategory) = 0;
};
} // namespace folly
