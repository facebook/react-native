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
#include <folly/logging/LogHandlerConfig.h>

#include <folly/lang/SafeAssert.h>

using std::string;

namespace folly {

LogHandlerConfig::LogHandlerConfig() {}

LogHandlerConfig::LogHandlerConfig(StringPiece t) : type{t.str()} {}

LogHandlerConfig::LogHandlerConfig(Optional<StringPiece> t)
    : type{t.hasValue() ? Optional<string>{t->str()} : Optional<string>{}} {}

LogHandlerConfig::LogHandlerConfig(StringPiece t, Options opts)
    : type{t.str()}, options{std::move(opts)} {}

LogHandlerConfig::LogHandlerConfig(Optional<StringPiece> t, Options opts)
    : type{t.hasValue() ? Optional<string>{t->str()} : Optional<string>{}},
      options{std::move(opts)} {}

void LogHandlerConfig::update(const LogHandlerConfig& other) {
  FOLLY_SAFE_DCHECK(
      !other.type.hasValue(), "LogHandlerConfig type cannot be updated");
  for (const auto& option : other.options) {
    options[option.first] = option.second;
  }
}

bool LogHandlerConfig::operator==(const LogHandlerConfig& other) const {
  return type == other.type && options == other.options;
}

bool LogHandlerConfig::operator!=(const LogHandlerConfig& other) const {
  return !(*this == other);
}

} // namespace folly
