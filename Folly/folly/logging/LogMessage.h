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

#include <sys/types.h>
#include <chrono>
#include <string>

#include <folly/Range.h>
#include <folly/logging/LogLevel.h>

namespace folly {

class LogCategory;

/**
 * LogMessage represents a single message to be logged.
 *
 * LogMessage objects are relatively temporary objects, that only exist for the
 * time it takes to invoke all of the appropriate LogHandlers.  These generally
 * only live in the thread that logged the message, and are not modified once
 * created.  (That said, LogHandler implementations may copy and store
 * LogMessage objects for later use if desired.)
 */
class LogMessage {
 public:
  LogMessage(
      const LogCategory* category,
      LogLevel level,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      std::string&& msg);
  LogMessage(
      const LogCategory* category,
      LogLevel level,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      folly::StringPiece msg)
      : LogMessage(
            category,
            level,
            filename,
            lineNumber,
            functionName,
            msg.str()) {}

  /**
   * Construct a LogMessage with an explicit timestamp.
   * This is primarily intended for use in unit tests, so the tests can get
   * deterministic behavior with regards to timestamps.
   */
  LogMessage(
      const LogCategory* category,
      LogLevel level,
      std::chrono::system_clock::time_point timestamp,
      folly::StringPiece filename,
      unsigned int lineNumber,
      folly::StringPiece functionName,
      std::string&& msg);

  const LogCategory* getCategory() const {
    return category_;
  }

  LogLevel getLevel() const {
    return level_;
  }

  folly::StringPiece getFileName() const {
    return filename_;
  }
  folly::StringPiece getFileBaseName() const;

  unsigned int getLineNumber() const {
    return lineNumber_;
  }

  folly::StringPiece getFunctionName() const {
    return functionName_;
  }

  std::chrono::system_clock::time_point getTimestamp() const {
    return timestamp_;
  }

  uint64_t getThreadID() const {
    return threadID_;
  }

  const std::string& getMessage() const {
    // If no characters needed to be sanitized, message_ will be empty.
    if (message_.empty()) {
      return rawMessage_;
    }
    return message_;
  }

  const std::string& getRawMessage() const {
    return rawMessage_;
  }

  bool containsNewlines() const {
    return containsNewlines_;
  }

 private:
  void sanitizeMessage();

  const LogCategory* const category_{nullptr};
  LogLevel const level_{static_cast<LogLevel>(0)};
  uint64_t const threadID_{0};
  std::chrono::system_clock::time_point const timestamp_;

  /**
   * The name of the source file that generated this log message.
   */
  folly::StringPiece const filename_;

  /**
   * The line number in the source file that generated this log message.
   */
  unsigned int const lineNumber_{0};

  /**
   * The name of the function that generated this log message.
   */
  folly::StringPiece const functionName_;

  /**
   * containsNewlines_ will be true if the message contains internal newlines.
   *
   * This allows log handlers that perform special handling of multi-line
   * messages to easily detect if a message contains multiple lines or not.
   */
  bool containsNewlines_{false};

  /**
   * rawMessage_ contains the original message.
   *
   * This may contain arbitrary binary data, including unprintable characters
   * and nul bytes.
   */
  std::string const rawMessage_;

  /**
   * message_ contains a sanitized version of the log message.
   *
   * nul bytes and unprintable characters have been escaped.
   * This message may still contain newlines, however.  LogHandler classes
   * are responsible for deciding how they want to handle log messages with
   * internal newlines.
   */
  std::string message_;
};
} // namespace folly
