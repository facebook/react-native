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

#include <folly/Conv.h>
#include <folly/Format.h>
#include <folly/logging/LogCategory.h>
#include <folly/logging/LogLevel.h>
#include <folly/logging/LogStream.h>
#include <folly/logging/LogStreamProcessor.h>

/**
 * Log a message to the specified logger.
 *
 * This macro avoids evaluating the log arguments unless the log level check
 * succeeds.
 *
 * Beware that the logger argument is evaluated twice, so this argument should
 * be an expression with no side-effects.
 */
#define FB_LOG(logger, level, ...)         \
  FB_LOG_IMPL(                             \
      logger,                              \
      ::folly::LogLevel::level,            \
      ::folly::LogStreamProcessor::APPEND, \
      ##__VA_ARGS__)

/**
 * Log a message to the specified logger, using a folly::format() string.
 *
 * The arguments will be processed using folly::format().  The format syntax
 * is similar to Python format strings.
 *
 * This macro avoids evaluating the log arguments unless the log level check
 * succeeds.
 *
 * Beware that the logger argument is evaluated twice, so this argument should
 * be an expression with no side-effects.
 */
#define FB_LOGF(logger, level, fmt, arg1, ...) \
  FB_LOG_IMPL(                                 \
      logger,                                  \
      ::folly::LogLevel::level,                \
      ::folly::LogStreamProcessor::FORMAT,     \
      fmt,                                     \
      arg1,                                    \
      ##__VA_ARGS__)

/**
 * FB_LOG_RAW() can be used by callers that want to pass in the log level as a
 * variable, and/or who want to explicitly specify the filename and line
 * number.
 *
 * This is useful for callers implementing their own log wrapper functions
 * that want to pass in their caller's filename and line number rather than
 * their own.
 *
 * The log level parameter must be an explicitly qualified LogLevel value, or a
 * LogLevel variable.  (This differs from FB_LOG() and FB_LOGF() which accept
 * an unqualified LogLevel name.)
 */
#define FB_LOG_RAW(logger, level, filename, linenumber, functionName, ...) \
  FB_LOG_RAW_IMPL(                                                         \
      logger,                                                              \
      level,                                                               \
      filename,                                                            \
      linenumber,                                                          \
      functionName,                                                        \
      ::folly::LogStreamProcessor::APPEND,                                 \
      ##__VA_ARGS__)

/**
 * FB_LOGF_RAW() is similar to FB_LOG_RAW(), but formats the log arguments
 * using folly::format().
 */
#define FB_LOGF_RAW(                                                   \
    logger, level, filename, linenumber, functionName, fmt, arg1, ...) \
  FB_LOG_RAW_IMPL(                                                     \
      logger,                                                          \
      level,                                                           \
      filename,                                                        \
      linenumber,                                                      \
      functionName,                                                    \
      ::folly::LogStreamProcessor::FORMAT,                             \
      fmt,                                                             \
      arg1,                                                            \
      ##__VA_ARGS__)

/**
 * Helper macro for implementing FB_LOG() and FB_LOGF().
 *
 * This macro generally should not be used directly by end users.
 */
#define FB_LOG_IMPL(logger, level, type, ...)                          \
  (!(logger).getCategory()->logCheck(level))                           \
      ? ::folly::logDisabledHelper(                                    \
            ::folly::bool_constant<::folly::isLogLevelFatal(level)>{}) \
      : ::folly::LogStreamVoidify<::folly::isLogLevelFatal(level)>{} & \
          ::folly::LogStreamProcessor{(logger).getCategory(),          \
                                      (level),                         \
                                      __FILE__,                        \
                                      __LINE__,                        \
                                      __func__,                        \
                                      (type),                          \
                                      ##__VA_ARGS__}                   \
              .stream()

/**
 * Helper macro for implementing FB_LOG_RAW() and FB_LOGF_RAW().
 *
 * This macro generally should not be used directly by end users.
 *
 * This is very similar to FB_LOG_IMPL(), but since the level may be a variable
 * instead of a compile-time constant, we cannot detect at compile time if this
 * is a fatal log message or not.
 */
#define FB_LOG_RAW_IMPL(                                      \
    logger, level, filename, line, functionName, type, ...)   \
  (!(logger).getCategory()->logCheck(level))                  \
      ? static_cast<void>(0)                                  \
      : ::folly::LogStreamVoidify<false>{} &                  \
          ::folly::LogStreamProcessor{(logger).getCategory(), \
                                      (level),                \
                                      (filename),             \
                                      (line),                 \
                                      (functionName),         \
                                      (type),                 \
                                      ##__VA_ARGS__}          \
              .stream()

namespace folly {

class LoggerDB;
class LogMessage;

/**
 * Logger is the class you will use to specify the log category when logging
 * messages with FB_LOG().
 *
 * Logger is really just a small wrapper class that contains a pointer to the
 * appropriate LogCategory object.  It primarily exists as syntactic sugar to
 * allow for easily looking up LogCategory objects.
 */
class Logger {
 public:
  /**
   * Construct a Logger for the given category name.
   *
   * A LogCategory object for this category will be created if one does not
   * already exist.
   */
  explicit Logger(folly::StringPiece name);

  /**
   * Construct a Logger pointing to an existing LogCategory object.
   */
  explicit Logger(LogCategory* cat);

  /**
   * Construct a Logger for a specific LoggerDB object, rather than the main
   * singleton.
   *
   * This is primarily intended for use in unit tests.
   */
  Logger(LoggerDB* db, folly::StringPiece name);

  /**
   * Get the LogCategory that this Logger refers to.
   */
  LogCategory* getCategory() const {
    return category_;
  }

 private:
  LogCategory* const category_{nullptr};
};
} // namespace folly
