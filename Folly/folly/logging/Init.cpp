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
#include <folly/logging/Init.h>

#include <folly/logging/LogConfig.h>
#include <folly/logging/LogConfigParser.h>
#include <folly/logging/LoggerDB.h>
#include <folly/logging/StreamHandlerFactory.h>

namespace folly {

void initLogging(StringPiece configString) {
  // Get the base logging configuration
  auto* const baseConfigStr = getBaseLoggingConfig();
  // Return early if we have nothing to do
  if (!baseConfigStr && configString.empty()) {
    return;
  }

  // Parse the configuration string(s)
  LogConfig config;
  if (baseConfigStr) {
    config = parseLogConfig(baseConfigStr);
    if (!configString.empty()) {
      config.update(parseLogConfig(configString));
    }
  } else {
    config = parseLogConfig(configString);
  }

  // Apply the config settings
  LoggerDB::get().updateConfig(config);
}

void initLoggingOrDie(StringPiece configString) {
  try {
    initLogging(configString);
  } catch (const std::exception& ex) {
    // Print the error message.  We intentionally use ex.what() here instead
    // of folly::exceptionStr() to avoid including the exception type name in
    // the output.  The exceptions thrown by the logging library on error
    // should have enough information to diagnose what is wrong with the
    // input config string.
    //
    // We want the output here to be user-friendly since this will be shown
    // to any user invoking a program with an error in the logging
    // configuration string.  This output is intended for end users rather
    // than developers.
    fprintf(stderr, "error parsing logging configuration: %s\n", ex.what());
    exit(1);
  }
}

} // namespace folly
