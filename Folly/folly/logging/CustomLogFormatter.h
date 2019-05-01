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

#include <folly/Range.h>
#include <folly/logging/LogFormatter.h>
#include <string>

namespace folly {

/**
 * A LogFormatter implementation that produces messages in a format specified
 * using a config.
 *
 * The glog message format is:
 *
 *   {L}{m:02d}{D:02d} {H:2d}:{M:02d}:{S:02d}.{USECS:06d} {THREAD:5d}
 *   {FILE}:{LINE}]
 *
 * L:  A 1-character code describing the log level (e.g., E, W, I, V)
 * m: month
 * D: day
 * H: hour, 24-hour format
 * M: minute
 * S: second
 * USECS: microseconds
 * THREAD: Thread ID
 * FILE: Filename (just the last component)
 * FUN: The function that logged the message
 * LINE: Line number
 *
 * TODO: enable support for the following 2:
 *   - THREADNAME: the thread name.
 *   - THREADCTX: thread-local log context data, if it has been set.  (This is
 *                a Facebook-specific modification)
 */
class CustomLogFormatter : public LogFormatter {
 public:
  explicit CustomLogFormatter(StringPiece format, bool colored);
  std::string formatMessage(
      const LogMessage& message,
      const LogCategory* handlerCategory) override;

 private:
  void parseFormatString(StringPiece format);

  std::string logFormat_;
  std::string singleLineLogFormat_;
  std::size_t staticEstimatedWidth_{0};
  std::size_t fileNameCount_{0};
  std::size_t functionNameCount_{0};
  const bool colored_;
};
} // namespace folly
