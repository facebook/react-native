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
#include <folly/logging/LogCategoryConfig.h>

namespace folly {

LogCategoryConfig::LogCategoryConfig(LogLevel l, bool inherit)
    : level{l}, inheritParentLevel{inherit} {}

LogCategoryConfig::LogCategoryConfig(
    LogLevel l,
    bool inherit,
    std::vector<std::string> h)
    : level{l}, inheritParentLevel{inherit}, handlers{h} {}

bool LogCategoryConfig::operator==(const LogCategoryConfig& other) const {
  return level == other.level &&
      inheritParentLevel == other.inheritParentLevel &&
      handlers == other.handlers;
}

bool LogCategoryConfig::operator!=(const LogCategoryConfig& other) const {
  return !(*this == other);
}

} // namespace folly
