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
#include <folly/logging/CustomLogFormatter.h>

#include <folly/Format.h>
#include <folly/logging/LogLevel.h>
#include <folly/logging/LogMessage.h>
#include <folly/portability/Time.h>
#include <algorithm>

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

StringPiece getResetSequence(LogLevel level) {
  if (level >= LogLevel::INFO && level < LogLevel::WARN) {
    return "\033[0m";
  } else {
    return "";
  }
}

StringPiece getColorSequence(LogLevel level) {
  if (level < LogLevel::INFO) {
    return "\033[1;30m"; // BOLD/BRIGHT BLACK ~ GREY
  } else if (level < LogLevel::WARN) {
    return ""; // NO COLOR
  } else if (level < LogLevel::ERR) {
    return "\033[33m"; // YELLOW
  } else if (level < LogLevel::CRITICAL) {
    return "\033[31m"; // RED
  }
  return "\033[1;41m"; // BOLD ON RED BACKGROUND
}

struct FormatKeys {
  const StringPiece key;
  const std::size_t argIndex;
  const std::size_t width;

  constexpr FormatKeys(
      StringPiece key_,
      std::size_t argIndex_,
      std::size_t width_ = 0)
      : key(key_), argIndex(argIndex_), width(width_) {}
};

/**
 * The first part of pairs in this array are the key names and the second part
 * of the pairs are the argument index for folly::format().
 *
 * NOTE: This array must be sorted by key name, since we use std::lower_bound
 * to search in it.
 *
 * TODO: Support including thread names and thread context info.
 */
constexpr std::array<FormatKeys, 11> formatKeys{{
    FormatKeys(/* key */ "D", /*      argIndex  */ 2, /* width */ 2),
    FormatKeys(/* key */ "FILE", /*   argIndex  */ 8),
    FormatKeys(/* key */ "FUN", /*    argIndex  */ 9),
    FormatKeys(/* key */ "H", /*      argIndex  */ 3, /* width */ 2),
    FormatKeys(/* key */ "L", /*      argIndex  */ 0, /* width */ 1),
    FormatKeys(/* key */ "LINE", /*   argIndex */ 10, /* width */ 4),
    FormatKeys(/* key */ "M", /*      argIndex  */ 4, /* width */ 2),
    FormatKeys(/* key */ "S", /*      argIndex  */ 5, /* width */ 2),
    FormatKeys(/* key */ "THREAD", /* argIndex  */ 7, /* width */ 5),
    FormatKeys(/* key */ "USECS", /*  argIndex  */ 6, /* width */ 6),
    FormatKeys(/* key */ "m", /*      argIndex  */ 1, /* width */ 2),
}};
constexpr int messageIndex = formatKeys.size();

} // namespace

namespace folly {

CustomLogFormatter::CustomLogFormatter(StringPiece format, bool colored)
    : colored_(colored) {
  parseFormatString(format);
}

void CustomLogFormatter::parseFormatString(StringPiece input) {
  std::size_t estimatedWidth = 0;
  functionNameCount_ = 0;
  fileNameCount_ = 0;
  // Replace all format keys to numbers to improve performance and to use
  // varying value types (which is not possible using folly::vformat()).
  std::string output;
  output.reserve(input.size());
  const char* varNameStart = nullptr;

  enum StateEnum {
    LITERAL,
    FMT_NAME,
    FMT_MODIFIERS,
  } state = LITERAL;

  for (const char* p = input.begin(); p < input.end(); ++p) {
    switch (state) {
      case LITERAL:
        output.append(p, 1);
        // In case of `{{` or `}}`, copy it as it is and only increment the
        // estimatedWidth once as it will result to a single character in
        // output.
        if ((p + 1) != input.end() /* ensure not last character */ &&
            (0 == memcmp(p, "}}", 2) || 0 == memcmp(p, "{{", 2))) {
          output.append(p + 1, 1);
          estimatedWidth++;
          p++;
        }
        // If we see a single open curly brace, it denotes a start of a format
        // name and so we change the state to FMT_NAME and do not increment
        // estimatedWidth as it won't be in the output.
        else if (*p == '{') {
          varNameStart = p + 1;
          state = FMT_NAME;
        }
        // In case it is just a regular literal, just increment estimatedWidth
        // by one and move on to the next character.
        else {
          estimatedWidth++;
        }
        break;
      // In case we have started processing a format name/key
      case FMT_NAME:
        // Unless it is the end of the format name/key, do nothing and scan over
        // the name/key. When it is the end of the format name/key, look up
        // the argIndex for it and replace the name/key with that index.
        if (*p == ':' || *p == '}') {
          StringPiece varName(varNameStart, p);
          auto item = std::lower_bound(
              formatKeys.begin(),
              formatKeys.end(),
              varName,
              [](const auto& a, const auto& b) { return a.key < b; });

          if (UNLIKELY(item == formatKeys.end() || item->key != varName)) {
            throw std::runtime_error(folly::to<std::string>(
                "unknown format argument \"", varName, "\""));
          }
          output.append(folly::to<std::string>(item->argIndex));
          output.append(p, 1);

          // Based on the format key, increment estimatedWidth with the
          // estimate of how many characters long the value of the format key
          // will be. If it is a FILE or a FUN, the width will be variable
          // depending on the values of those fields.
          estimatedWidth += item->width;
          if (item->key == "FILE") {
            fileNameCount_++;
          } else if (item->key == "FUN") {
            functionNameCount_++;
          }

          // Figure out if there are modifiers that follow the key or if we
          // continue processing literals.
          if (*p == ':') {
            state = FMT_MODIFIERS;
          } else {
            state = LITERAL;
          }
        }
        break;
      // In case we have started processing a format modifier (after :)
      case FMT_MODIFIERS:
        // Modifiers are just copied as is and are not considered to determine
        // the estimatedWidth.
        output.append(p, 1);
        if (*p == '}') {
          state = LITERAL;
        }
        break;
    }
  }
  if (state != LITERAL) {
    throw std::runtime_error("unterminated format string");
  }
  // Append a single space after the header format if header is not empty.
  if (!output.empty()) {
    output.append(" ");
    estimatedWidth++;
  }
  logFormat_ = output;
  staticEstimatedWidth_ = estimatedWidth;

  // populate singleLineLogFormat_ with the padded line format.
  if (colored_) {
    singleLineLogFormat_ = folly::to<std::string>(
        "{",
        messageIndex + 1,
        "}",
        logFormat_,
        "{",
        messageIndex,
        "}{",
        messageIndex + 2,
        "}\n");
  } else {
    singleLineLogFormat_ =
        folly::to<std::string>(logFormat_, "{", messageIndex, "}\n");
  }
}

std::string CustomLogFormatter::formatMessage(
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

  // Most common logs will be single line logs and so we can format the entire
  // log string including the message at once.
  if (!message.containsNewlines()) {
    return folly::sformat(
        singleLineLogFormat_,
        getGlogLevelName(message.getLevel())[0],
        ltime.tm_mon + 1,
        ltime.tm_mday,
        ltime.tm_hour,
        ltime.tm_min,
        ltime.tm_sec,
        usecs.count(),
        message.getThreadID(),
        basename,
        message.getFunctionName(),
        message.getLineNumber(),
        // NOTE: THE FOLLOWING ARGUMENTS ALWAYS NEED TO BE THE LAST 3:
        message.getMessage(),
        // If colored logs are enabled, the singleLineLogFormat_ will contain
        // placeholders for the color and the reset sequences. If not, then
        // the following params will just be ignored by the folly::sformat().
        getColorSequence(message.getLevel()),
        getResetSequence(message.getLevel()));
  }
  // If the message contains multiple lines, ensure that the log header is
  // prepended before each message line.
  else {
    const auto headerFormatter = folly::format(
        logFormat_,
        getGlogLevelName(message.getLevel())[0],
        ltime.tm_mon + 1,
        ltime.tm_mday,
        ltime.tm_hour,
        ltime.tm_min,
        ltime.tm_sec,
        usecs.count(),
        message.getThreadID(),
        basename,
        message.getFunctionName(),
        message.getLineNumber());

    // Estimate header length. If this still isn't long enough the string will
    // grow as necessary, so the code will still be correct, but just slightly
    // less efficient than if we had allocated a large enough buffer the first
    // time around.
    size_t headerLengthGuess = staticEstimatedWidth_ +
        (fileNameCount_ * basename.size()) +
        (functionNameCount_ * message.getFunctionName().size());

    // Format the data into a buffer.
    std::string buffer;
    // If colored logging is supported, then process the color based on
    // the level of the message.
    if (colored_) {
      buffer.append(getColorSequence(message.getLevel()).toString());
    }
    StringPiece msgData{message.getMessage()};

    // Make a guess at how many lines will be in the message, just to make an
    // initial buffer allocation.  If the guess is too small then the string
    // will reallocate and grow as necessary, it will just be slightly less
    // efficient than if we had guessed enough space.
    size_t numLinesGuess = 4;
    buffer.reserve((headerLengthGuess * numLinesGuess) + msgData.size());

    size_t idx = 0;
    while (true) {
      auto end = msgData.find('\n', idx);
      if (end == StringPiece::npos) {
        end = msgData.size();
      }

      auto line = msgData.subpiece(idx, end - idx);
      headerFormatter.appendTo(buffer);
      buffer.append(line.data(), line.size());
      buffer.push_back('\n');

      if (end == msgData.size()) {
        break;
      }
      idx = end + 1;
    }
    // If colored logging is supported and the current message is a color other
    // than the default, then RESET colors after printing message.
    if (colored_) {
      buffer.append(getResetSequence(message.getLevel()).toString());
    }
    return buffer;
  }
}
} // namespace folly
