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

/*
 * This file contains function to help configure the logging library behavior
 * during program start-up.
 */

#include <folly/Range.h>

namespace folly {

/**
 * Initialize the logging library.
 *
 * This function performs the following steps:
 * - Call folly::getBaseLoggingConfig() to get the base logging configuration
 *   for your program.
 * - Parse the input configString parameter with parseLogConfig(), and update
 *   the base configuration with the settings from this argument.
 * - Apply these combined settings to the main LoggerDB singleton using
 *   LoggerDB::updateConfig()
 *
 * This function will throw an exception on error.  Most errors are normally
 * due to invalid logging configuration strings: e.g., invalid log level names
 * or referencing undefined log handlers.
 *
 * If you are invoking this from your program's main() function it is often
 * more convenient to use initLoggingOrDie() to terminate your program
 * gracefully on error rather than having to handle exceptions yourself.
 */
void initLogging(folly::StringPiece configString = "");

/**
 * Initialize the logging library, and exit the program on error.
 *
 * This function behaves like initLogging(), but if an error occurs processing
 * the logging configuration it will print an error message to stderr and then
 * call exit(1) to terminate the program.
 */
void initLoggingOrDie(folly::StringPiece configString = "");

/**
 * folly::getBaseLoggingConfig() allows individual executables to easily
 * customize their default logging configuration.
 *
 * You can define this function in your executable and folly::initLogging()
 * will call it to get the base logging configuration.  The settings returned
 * by getBaseLoggingConfig() will then be modified by updating them with the
 * configuration string parameter passed to initLogging().
 *
 * This allows the user-specified configuration passed to initLogging() to
 * update the base configuration.  The user-specified configuration can apply
 * additional settings, and it may also override settings for categories and
 * handlers defined in the base configuration.
 *
 * See folly/logging/example/main.cpp for an example that defines
 * getBaseLoggingConfig().
 *
 * If this function returns a non-null pointer, it should point to a
 * null-terminated string with static storage duration.
 */
const char* getBaseLoggingConfig();

} // namespace folly

/**
 * A helper macro to set the default logging configuration in a program.
 *
 * This defines the folly::getBaseLoggingConfig() function, and makes it return
 * the specified string.
 *
 * This macro should be used at the top-level namespace in a .cpp file in your
 * program.
 */
#define FOLLY_INIT_LOGGING_CONFIG(config)            \
  namespace folly {                                  \
  const char* getBaseLoggingConfig() {               \
    static constexpr StringPiece configSP((config)); \
    return configSP.data();                          \
  }                                                  \
  }                                                  \
  static_assert(true, "require a semicolon after FOLLY_INIT_LOGGING_CONFIG()")
