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

namespace folly {

/**
 * A LogFormatter implementation that produces messages in a format similar to
 * that produced by the Google logging library.
 *
 * The glog message format is:
 *
 *   LmmDD HH:MM:SS.USECS THREAD [THREADNAME] (THREADCTX) FILE:LINE] MSG
 *
 * L:  A 1-character code describing the log level (e.g., E, W, I, V)
 * mm: 2-digit month
 * DD: 2-digit day
 * HH: 2-digit hour, 24-hour format
 * MM: 2-digit minute
 * SS: 2-digit second
 * USECS: 6-digit microseconds
 * THREAD: Thread ID
 * FILE: Filename (just the last component)
 * LINE: Line number
 * MSG: The actual log message
 *
 * [THREADNAME] is the thread name, and is only included if --logthreadnames
 * was enabled on the command line.
 *
 * (THREADCTX) is thread-local log context data, if it has been set.  (This is
 * a Facebook-specific modification, and is disabled unless --logthreadcontext
 * was enabled on the command line.)
 *
 * Exception information and a custom log prefix may also appear after the
 * file name and line number, before the ']' character.
 */
class GlogStyleFormatter : public LogFormatter {
 public:
  std::string formatMessage(
      const LogMessage& message,
      const LogCategory* handlerCategory) override;
};
} // namespace folly
