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

#include <ostream>

#include <folly/logging/LogCategory.h>
#include <folly/logging/LogMessage.h>

namespace folly {

/**
 * A std::streambuf implementation for use by LogStream
 */
class LogStreamBuffer : public std::streambuf {
 public:
  LogStreamBuffer() {
    // We intentionally do not reserve any string buffer space initially,
    // since this will not be needed for XLOG() and XLOGF() statements
    // that do not use the streaming API.  (e.g., XLOG(INFO, "test ", 1234) )
  }

  bool empty() const {
    return str_.empty();
  }

  std::string extractString() {
    str_.resize(pptr() - (&str_.front()));
    return std::move(str_);
  }

  int_type overflow(int_type ch) override;

 private:
  enum : size_t { kInitialCapacity = 256 };
  std::string str_;
};

class LogStreamProcessor;

/**
 * A std::ostream implementation for use by the logging macros.
 *
 * All-in-all this is pretty similar to std::stringstream, but lets us
 * destructively extract an rvalue-reference to the underlying string.
 */
class LogStream : public std::ostream {
 public:
  // Explicitly declare the default constructor and destructor, but only
  // define them in the .cpp file.  This prevents them from being inlined at
  // each FB_LOG() or XLOG() statement.  Inlining them just causes extra code
  // bloat, with minimal benefit--for debug log statements these never even get
  // called in the common case where the log statement is disabled.
  explicit LogStream(LogStreamProcessor* processor);
  ~LogStream();

  bool empty() const {
    return buffer_.empty();
  }

  std::string extractString() {
    return buffer_.extractString();
  }

  LogStreamProcessor* getProcessor() const {
    return processor_;
  }

 private:
  LogStreamBuffer buffer_;
  LogStreamProcessor* const processor_;
};
} // namespace folly
