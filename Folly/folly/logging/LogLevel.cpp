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
#include <folly/logging/LogLevel.h>

#include <array>
#include <cctype>
#include <ostream>

#include <folly/Conv.h>

using std::string;

namespace folly {

namespace {
struct NumberedLevelInfo {
  LogLevel min;
  LogLevel max;
  StringPiece lowerPrefix;
  StringPiece upperPrefix;
};

constexpr std::array<NumberedLevelInfo, 2> numberedLogLevels = {{
    NumberedLevelInfo{LogLevel::DBG, LogLevel::DBG0, "dbg", "DBG"},
    NumberedLevelInfo{LogLevel::INFO, LogLevel::INFO0, "info", "INFO"},
}};
} // namespace

LogLevel stringToLogLevel(StringPiece name) {
  string lowerNameStr;
  lowerNameStr.reserve(name.size());
  for (char c : name) {
    lowerNameStr.push_back(static_cast<char>(std::tolower(c)));
  }
  StringPiece lowerName{lowerNameStr};

  // If the string is of the form "LogLevel::foo" or "LogLevel(foo)"
  // strip it down just to "foo".  This makes sure we can process both
  // the "LogLevel::WARN" and "LogLevel(1234)" formats produced by
  // logLevelToString().
  constexpr StringPiece lowercasePrefix{"loglevel::"};
  constexpr StringPiece wrapperPrefix{"loglevel("};
  if (lowerName.startsWith(lowercasePrefix)) {
    lowerName.advance(lowercasePrefix.size());
  } else if (lowerName.startsWith(wrapperPrefix) && lowerName.endsWith(")")) {
    lowerName.advance(wrapperPrefix.size());
    lowerName.subtract(1);
  }

  if (lowerName == "uninitialized") {
    return LogLevel::UNINITIALIZED;
  } else if (lowerName == "none") {
    return LogLevel::NONE;
  } else if (lowerName == "debug" || lowerName == "dbg") {
    return LogLevel::DBG;
  } else if (lowerName == "info") {
    return LogLevel::INFO;
  } else if (lowerName == "warn" || lowerName == "warning") {
    return LogLevel::WARN;
  } else if (lowerName == "error" || lowerName == "err") {
    return LogLevel::ERR;
  } else if (lowerName == "critical") {
    return LogLevel::CRITICAL;
  } else if (lowerName == "dfatal") {
    return LogLevel::DFATAL;
  } else if (lowerName == "fatal") {
    return LogLevel::FATAL;
  } else if (lowerName == "max" || lowerName == "max_level") {
    return LogLevel::MAX_LEVEL;
  }

  for (const auto& info : numberedLogLevels) {
    if (!lowerName.startsWith(info.lowerPrefix)) {
      continue;
    }
    auto remainder = lowerName.subpiece(info.lowerPrefix.size());
    auto level = folly::tryTo<int>(remainder).value_or(-1);
    if (level < 0 ||
        static_cast<unsigned int>(level) > (static_cast<uint32_t>(info.max) -
                                            static_cast<uint32_t>(info.min))) {
      throw std::range_error(to<string>(
          "invalid ", info.lowerPrefix, " logger level: ", name.str()));
    }
    return info.max - level;
  }

  // Try as an plain integer if all else fails
  try {
    auto level = folly::to<uint32_t>(lowerName);
    return static_cast<LogLevel>(level);
  } catch (const std::exception&) {
    throw std::range_error("invalid logger level: " + name.str());
  }
}

string logLevelToString(LogLevel level) {
  if (level == LogLevel::UNINITIALIZED) {
    return "UNINITIALIZED";
  } else if (level == LogLevel::NONE) {
    return "NONE";
  } else if (level == LogLevel::DBG) {
    return "DEBUG";
  } else if (level == LogLevel::INFO) {
    return "INFO";
  } else if (level == LogLevel::WARN) {
    return "WARN";
  } else if (level == LogLevel::ERR) {
    return "ERR";
  } else if (level == LogLevel::CRITICAL) {
    return "CRITICAL";
  } else if (level == LogLevel::DFATAL) {
    return "DFATAL";
  } else if (level == LogLevel::FATAL) {
    return "FATAL";
  }

  for (const auto& info : numberedLogLevels) {
    if (static_cast<uint32_t>(level) <= static_cast<uint32_t>(info.max) &&
        static_cast<uint32_t>(level) > static_cast<uint32_t>(info.min)) {
      auto num = static_cast<uint32_t>(info.max) - static_cast<uint32_t>(level);
      return folly::to<string>(info.upperPrefix, num);
    }
  }

  return folly::to<string>("LogLevel(", static_cast<uint32_t>(level), ")");
}

std::ostream& operator<<(std::ostream& os, LogLevel level) {
  os << logLevelToString(level);
  return os;
}
} // namespace folly
