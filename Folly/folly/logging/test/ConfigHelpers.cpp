/*
 * Copyright 2004-present Facebook, Inc.
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
#include <folly/logging/test/ConfigHelpers.h>

#include <ostream>

#include <folly/String.h>
#include <folly/logging/LogConfig.h>
#include <folly/logging/LogConfigParser.h>
#include <folly/logging/LogHandler.h>

namespace folly {

std::ostream& operator<<(std::ostream& os, const LogConfig& config) {
  // We could just use folly::toPrettyJson(logConfigToDynamic(config))
  // However, the format here is much more compact and easier to read if there
  // are discrepancies between configs in a test check.

  // Sort the categories by name before printing
  os << "{\n  categories: {\n";
  std::vector<std::string> names;
  const auto& catConfigs = config.getCategoryConfigs();
  for (const auto& cc : catConfigs) {
    names.push_back(cc.first);
  }
  std::sort(names.begin(), names.end());
  for (const auto& name : names) {
    os << "    " << name << "=" << catConfigs.at(name) << "\n";
  }

  // Sort the handlers by name before printing
  os << "  }\n  handlers: {\n";
  const auto& handlerConfigs = config.getHandlerConfigs();
  names.clear();
  for (const auto& cc : handlerConfigs) {
    names.push_back(cc.first);
  }
  std::sort(names.begin(), names.end());
  for (const auto& name : names) {
    os << "    " << name << "=" << handlerConfigs.at(name) << "\n";
  }

  os << "  }\n}";
  return os;
}

std::ostream& operator<<(std::ostream& os, const LogCategoryConfig& config) {
  // Rather than printing the JSON configuration, we print a shorter
  // representation closer to the basic config string format.
  os << logLevelToString(config.level);
  if (!config.inheritParentLevel) {
    os << "!";
  }
  if (config.handlers.hasValue()) {
    os << ":" << join(",", config.handlers.value());
  }
  return os;
}

std::ostream& operator<<(std::ostream& os, const LogHandlerConfig& config) {
  // Rather than printing the JSON configuration, we print a shorter
  // representation closer to the basic config string format.
  os << (config.type ? config.type.value() : "[no type]");
  bool first = true;
  for (const auto& opt : config.options) {
    if (!first) {
      os << ",";
    } else {
      os << ":";
      first = false;
    }
    os << opt.first << "=" << opt.second;
  }
  return os;
}

void PrintTo(const std::shared_ptr<LogHandler>& handler, std::ostream* os) {
  *os << "Handler(" << handler->getConfig() << ")";
}

} // namespace folly
