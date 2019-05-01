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

#include <cstdint>
#include <iosfwd>
#include <string>
#include <type_traits>

#include <folly/Portability.h>
#include <folly/Range.h>

namespace folly {

/**
 * Log level values.
 *
 * Higher levels are more important than lower ones.
 *
 * However, the numbers in the DBG* and INFO* level names are reversed, and can
 * be thought of as debug verbosity levels.  Increasing DBG* numbers mean
 * increasing level of verbosity.  DBG0 is the least verbose debug level, DBG1
 * is one level higher of verbosity, etc.
 */
enum class LogLevel : uint32_t {
  UNINITIALIZED = 0,
  NONE = 1,
  MIN_LEVEL = 1,

  // "DBG" is the lowest (aka most verbose) debug log level.
  // This level is intended to be primarily used in log category settings.
  // In your code it is usually better to use one of the finer-grained DBGn
  // levels.  In your log category settings you can then set the log category
  // level to a specific DBGn level, or to to main DBG level to enable all DBGn
  // messages.
  //
  // This is named "DBG" rather than "DEBUG" since some open source projects
  // define "DEBUG" as a preprocessor macro.
  DBG = 1000,

  // Fine-grained debug log levels.
  DBG0 = 1999,
  DBG1 = 1998,
  DBG2 = 1997,
  DBG3 = 1996,
  DBG4 = 1995,
  DBG5 = 1994,
  DBG6 = 1993,
  DBG7 = 1992,
  DBG8 = 1991,
  DBG9 = 1990,

  INFO = 2000,
  // Fine-grained info log levels.
  INFO0 = 2999,
  INFO1 = 2998,
  INFO2 = 2997,
  INFO3 = 2996,
  INFO4 = 2995,
  INFO5 = 2994,
  INFO6 = 2993,
  INFO7 = 2992,
  INFO8 = 2991,
  INFO9 = 2990,

  WARN = 3000,
  WARNING = 3000,

  // Unfortunately Windows headers #define ERROR, so we cannot use
  // it as an enum value name.  We only provide ERR instead.
  ERR = 4000,

  CRITICAL = 5000,

  // DFATAL log messages crash the program on debug builds.
  DFATAL = 0x7ffffffe,
  // FATAL log messages always abort the program.
  // This level is equivalent to MAX_LEVEL.
  FATAL = 0x7fffffff,

  // The most significant bit is used by LogCategory to store a flag value,
  // so the maximum value has that bit cleared.
  //
  // (We call this MAX_LEVEL instead of MAX just since MAX() is commonly
  // defined as a preprocessor macro by some C headers.)
  MAX_LEVEL = 0x7fffffff,
};

constexpr LogLevel kDefaultLogLevel = LogLevel::INFO;

/*
 * Support adding and subtracting integers from LogLevels, to create slightly
 * adjusted log level values.
 */
inline constexpr LogLevel operator+(LogLevel level, uint32_t value) {
  // Cap the result at LogLevel::MAX_LEVEL
  return ((static_cast<uint32_t>(level) + value) >
          static_cast<uint32_t>(LogLevel::MAX_LEVEL))
      ? LogLevel::MAX_LEVEL
      : static_cast<LogLevel>(static_cast<uint32_t>(level) + value);
}
inline LogLevel& operator+=(LogLevel& level, uint32_t value) {
  level = level + value;
  return level;
}
inline constexpr LogLevel operator-(LogLevel level, uint32_t value) {
  return static_cast<LogLevel>(static_cast<uint32_t>(level) - value);
}
inline LogLevel& operator-=(LogLevel& level, uint32_t value) {
  level = level - value;
  return level;
}

/**
 * Construct a LogLevel from a string name.
 */
LogLevel stringToLogLevel(folly::StringPiece name);

/**
 * Get a human-readable string representing the LogLevel.
 */
std::string logLevelToString(LogLevel level);

/**
 * Print a LogLevel in a human readable format.
 */
std::ostream& operator<<(std::ostream& os, LogLevel level);

/**
 * Returns true if and only if a LogLevel is fatal.
 */
inline constexpr bool isLogLevelFatal(LogLevel level) {
  return folly::kIsDebug ? (level >= LogLevel::DFATAL)
                         : (level >= LogLevel::FATAL);
}
} // namespace folly
