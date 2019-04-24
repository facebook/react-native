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
#include <folly/logging/GlogStyleFormatter.h>

#include <folly/Format.h>
#include <folly/logging/LogLevel.h>
#include <folly/logging/LogMessage.h>
#include <folly/portability/Time.h>

namespace {
using folly::LogLevel;
using folly::StringPiece;

StringPiece getGlogLevelName(LogLevel level) {
  if (level < LogLevel::INFO) {
    return "VERBOSE";
  } else if (level < LogLevel::WARN) {
    return "INFO";
  } else if (level < LogLevel::ERR) {
    return "WARNING";
  } else if (level < LogLevel::CRITICAL) {
    return "ERROR";
  } else if (level < LogLevel::DFATAL) {
    return "CRITICAL";
  }
  return "FATAL";
}
} // namespace

namespace folly {

std::string GlogStyleFormatter::formatMessage(
    const LogMessage& message,
    const LogCategory* /* handlerCategory */) {
  // Get the local time info
  struct tm ltime;
  auto timeSinceEpoch = message.getTimestamp().time_since_epoch();
  auto epochSeconds =
      std::chrono::duration_cast<std::chrono::seconds>(timeSinceEpoch);
  std::chrono::microseconds usecs =
      std::chrono::duration_cast<std::chrono::microseconds>(timeSinceEpoch) -
      epochSeconds;
  time_t unixTimestamp = epochSeconds.count();
  if (!localtime_r(&unixTimestamp, &ltime)) {
    memset(&ltime, 0, sizeof(ltime));
  }

  auto basename = message.getFileBaseName();
  auto headerFormatter = folly::format(
      "{}{:02d}{:02d} {:02d}:{:02d}:{:02d}.{:06d} {:5d} {}:{}] ",
      getGlogLevelName(message.getLevel())[0],
      ltime.tm_mon + 1,
      ltime.tm_mday,
      ltime.tm_hour,
      ltime.tm_min,
      ltime.tm_sec,
      usecs.count(),
      message.getThreadID(),
      basename,
      message.getLineNumber());

  // TODO: Support including thread names and thread context info.

  // The fixed portion of the header takes up 31 bytes.
  //
  // The variable portions that we can't account for here include the line
  // number and the thread ID (just in case it is larger than 6 digits long).
  // Here we guess that 40 bytes will be long enough to include room for this.
  //
  // If this still isn't long enough the string will grow as necessary, so the
  // code will still be correct, but just slightly less efficient than if we
  // had allocated a large enough buffer the first time around.
  size_t headerLengthGuess = 40 + basename.size();

  // Format the data into a buffer.
  std::string buffer;
  StringPiece msgData{message.getMessage()};
  if (message.containsNewlines()) {
    // If there are multiple lines in the log message, add a header
    // before each one.
    std::string header;
    header.reserve(headerLengthGuess);
    headerFormatter.appendTo(header);

    // Make a guess at how many lines will be in the message, just to make an
    // initial buffer allocation.  If the guess is too small then the string
    // will reallocate and grow as necessary, it will just be slightly less
    // efficient than if we had guessed enough space.
    size_t numLinesGuess = 4;
    buffer.reserve(((header.size() + 1) * numLinesGuess) + msgData.size());

    size_t idx = 0;
    while (true) {
      auto end = msgData.find('\n', idx);
      if (end == StringPiece::npos) {
        end = msgData.size();
      }

      buffer.append(header);
      auto line = msgData.subpiece(idx, end - idx);
      buffer.append(line.data(), line.size());
      buffer.push_back('\n');

      if (end == msgData.size()) {
        break;
      }
      idx = end + 1;
    }
  } else {
    buffer.reserve(headerLengthGuess + msgData.size());
    headerFormatter.appendTo(buffer);
    buffer.append(msgData.data(), msgData.size());
    buffer.push_back('\n');
  }

  return buffer;
}
} // namespace folly
