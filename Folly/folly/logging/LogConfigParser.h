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

#include <stdexcept>

#include <folly/CPortability.h>
#include <folly/Range.h>
#include <folly/logging/LogConfig.h>

/*
 * This file contains utility functions for parsing and serializing
 * LogConfig strings.
 *
 * This is separate from the LogConfig class itself, to reduce the dependencies
 * of the core logging library.  Other code that wants to use the logging
 * library to log messages but does not need to parse log config strings
 * therefore does not need to depend on the folly JSON library.
 */

namespace folly {

struct dynamic;

class FOLLY_EXPORT LogConfigParseError : public std::invalid_argument {
 public:
  using std::invalid_argument::invalid_argument;
};

/**
 * Parse a log configuration string.
 *
 * See the documentation in logging/docs/Config.md for a description of the
 * configuration string syntax.
 *
 * Throws a LogConfigParseError on error.
 */
LogConfig parseLogConfig(StringPiece value);

/**
 * Parse a JSON configuration string.
 *
 * See the documentation in logging/docs/Config.md for a description of the
 * JSON configuration object format.
 *
 * This function uses relaxed JSON parsing, allowing C and C++ style
 * comments, as well as trailing commas.
 */
LogConfig parseLogConfigJson(StringPiece value);

/**
 * Parse a folly::dynamic object.
 *
 * The input should be an object data type, and is parsed the same as a JSON
 * object accpted by parseLogConfigJson().
 */
LogConfig parseLogConfigDynamic(const dynamic& value);

/**
 * Convert a LogConfig object to a folly::dynamic object.
 *
 * This can be used to serialize it as a JSON string, which can later be read
 * back using parseLogConfigJson().
 */
dynamic logConfigToDynamic(const LogConfig& config);
dynamic logConfigToDynamic(const LogHandlerConfig& config);
dynamic logConfigToDynamic(const LogCategoryConfig& config);

} // namespace folly
