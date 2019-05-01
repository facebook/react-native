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
#include <folly/logging/LogConfigParser.h>

#include <folly/Conv.h>
#include <folly/String.h>
#include <folly/dynamic.h>
#include <folly/json.h>
#include <folly/lang/SafeAssert.h>
#include <folly/logging/LogName.h>

using std::shared_ptr;
using std::string;

namespace folly {

namespace {

/**
 * Get the type of a folly::dynamic object as a string, for inclusion in
 * exception messages.
 */
std::string dynamicTypename(const dynamic& value) {
  switch (value.type()) {
    case dynamic::NULLT:
      return "null";
    case dynamic::ARRAY:
      return "array";
    case dynamic::BOOL:
      return "boolean";
    case dynamic::DOUBLE:
      return "double";
    case dynamic::INT64:
      return "integer";
    case dynamic::OBJECT:
      return "object";
    case dynamic::STRING:
      return "string";
  }
  return "unknown type";
}

/**
 * Parse a LogLevel from a JSON value.
 *
 * This accepts the log level either as an integer value or a string that can
 * be parsed with stringToLogLevel()
 *
 * On success updates the result parameter and returns true.
 * Returns false if the input is not a string or integer.
 * Throws a LogConfigParseError on other errors.
 */
bool parseJsonLevel(
    const dynamic& value,
    StringPiece categoryName,
    LogLevel& result) {
  if (value.isString()) {
    auto levelString = value.asString();
    try {
      result = stringToLogLevel(levelString);
      return true;
    } catch (const std::exception&) {
      throw LogConfigParseError{to<string>(
          "invalid log level \"",
          levelString,
          "\" for category \"",
          categoryName,
          "\"")};
    }
  } else if (value.isInt()) {
    auto level = static_cast<LogLevel>(value.asInt());
    if (level < LogLevel::MIN_LEVEL || level > LogLevel::MAX_LEVEL) {
      throw LogConfigParseError{to<string>(
          "invalid log level ",
          value.asInt(),
          " for category \"",
          categoryName,
          "\": outside of valid range")};
    }
    result = level;
    return true;
  }

  return false;
}

LogCategoryConfig parseJsonCategoryConfig(
    const dynamic& value,
    StringPiece categoryName) {
  LogCategoryConfig config;

  // If the input is not an object, allow it to be
  // just a plain level specification
  if (!value.isObject()) {
    if (!parseJsonLevel(value, categoryName, config.level)) {
      throw LogConfigParseError{to<string>(
          "unexpected data type for configuration of category \"",
          categoryName,
          "\": got ",
          dynamicTypename(value),
          ", expected an object, string, or integer")};
    }
    return config;
  }

  auto* level = value.get_ptr("level");
  if (!level) {
    // Require that level information be present for each log category.
    throw LogConfigParseError{to<string>(
        "no log level specified for category \"", categoryName, "\"")};
  }
  if (!parseJsonLevel(*level, categoryName, config.level)) {
    throw LogConfigParseError{to<string>(
        "unexpected data type for level field of category \"",
        categoryName,
        "\": got ",
        dynamicTypename(*level),
        ", expected a string or integer")};
  }

  auto* inherit = value.get_ptr("inherit");
  if (inherit) {
    if (!inherit->isBool()) {
      throw LogConfigParseError{to<string>(
          "unexpected data type for inherit field of category \"",
          categoryName,
          "\": got ",
          dynamicTypename(*inherit),
          ", expected a boolean")};
    }
    config.inheritParentLevel = inherit->asBool();
  }

  auto* handlers = value.get_ptr("handlers");
  if (handlers) {
    if (!handlers->isArray()) {
      throw LogConfigParseError{to<string>(
          "the \"handlers\" field for category ",
          categoryName,
          " must be a list")};
    }
    config.handlers = std::vector<std::string>{};
    for (const auto& item : *handlers) {
      if (!item.isString()) {
        throw LogConfigParseError{to<string>(
            "the \"handlers\" list for category ",
            categoryName,
            " must be contain only strings")};
      }
      config.handlers->push_back(item.asString());
    }
  }

  return config;
}

LogHandlerConfig parseJsonHandlerConfig(
    const dynamic& value,
    StringPiece handlerName) {
  if (!value.isObject()) {
    throw LogConfigParseError{to<string>(
        "unexpected data type for configuration of handler \"",
        handlerName,
        "\": got ",
        dynamicTypename(value),
        ", expected an object")};
  }

  // Parse the handler type
  auto* type = value.get_ptr("type");
  if (!type) {
    throw LogConfigParseError{to<string>(
        "no handler type specified for log handler \"", handlerName, "\"")};
  }
  if (!type->isString()) {
    throw LogConfigParseError{to<string>(
        "unexpected data type for \"type\" field of handler \"",
        handlerName,
        "\": got ",
        dynamicTypename(*type),
        ", expected a string")};
  }
  LogHandlerConfig config{type->asString()};

  // Parse the handler options
  auto* options = value.get_ptr("options");
  if (options) {
    if (!options->isObject()) {
      throw LogConfigParseError{to<string>(
          "unexpected data type for \"options\" field of handler \"",
          handlerName,
          "\": got ",
          dynamicTypename(*options),
          ", expected an object")};
    }

    for (const auto& item : options->items()) {
      if (!item.first.isString()) {
        // This shouldn't really ever happen.
        // We deserialize the json with allow_non_string_keys set to False.
        throw LogConfigParseError{to<string>(
            "unexpected data type for option of handler \"",
            handlerName,
            "\": got ",
            dynamicTypename(item.first),
            ", expected string")};
      }
      if (!item.second.isString()) {
        throw LogConfigParseError{to<string>(
            "unexpected data type for option \"",
            item.first.asString(),
            "\" of handler \"",
            handlerName,
            "\": got ",
            dynamicTypename(item.second),
            ", expected a string")};
      }
      config.options[item.first.asString()] = item.second.asString();
    }
  }

  return config;
}

LogConfig::CategoryConfigMap parseCategoryConfigs(StringPiece value) {
  LogConfig::CategoryConfigMap categoryConfigs;

  // Allow empty (or all whitespace) input
  value = trimWhitespace(value);
  if (value.empty()) {
    return categoryConfigs;
  }

  std::unordered_map<string, string> seenCategories;
  std::vector<StringPiece> pieces;
  folly::split(",", value, pieces);
  for (const auto& piece : pieces) {
    LogCategoryConfig categoryConfig;
    StringPiece categoryName;
    StringPiece configString;

    auto equalIndex = piece.find('=');
    if (equalIndex == StringPiece::npos) {
      // If level information is supplied without a category name,
      // apply it to the root log category.
      categoryName = StringPiece{"."};
      configString = trimWhitespace(piece);
    } else {
      categoryName = piece.subpiece(0, equalIndex);
      configString = piece.subpiece(equalIndex + 1);

      // If ":=" is used instead of just "=", disable inheriting the parent's
      // effective level if it is lower than this category's level.
      if (categoryName.endsWith(':')) {
        categoryConfig.inheritParentLevel = false;
        categoryName.subtract(1);
      }

      // Remove whitespace from the category name
      categoryName = trimWhitespace(categoryName);
    }

    // Split the configString into level and handler information.
    std::vector<StringPiece> handlerPieces;
    folly::split(":", configString, handlerPieces);
    FOLLY_SAFE_DCHECK(
        handlerPieces.size() >= 1,
        "folly::split() always returns a list of length 1");
    auto levelString = trimWhitespace(handlerPieces[0]);

    bool hasHandlerConfig = handlerPieces.size() > 1;
    if (handlerPieces.size() == 2 && trimWhitespace(handlerPieces[1]).empty()) {
      // This is an explicitly empty handler list.
      // This requests LoggerDB::updateConfig() to clear all existing log
      // handlers from this category.
      categoryConfig.handlers = std::vector<std::string>{};
    } else if (hasHandlerConfig) {
      categoryConfig.handlers = std::vector<std::string>{};
      for (size_t n = 1; n < handlerPieces.size(); ++n) {
        auto handlerName = trimWhitespace(handlerPieces[n]);
        if (handlerName.empty()) {
          throw LogConfigParseError{to<string>(
              "error parsing configuration for log category \"",
              categoryName,
              "\": log handler name cannot be empty")};
        }
        categoryConfig.handlers->push_back(handlerName.str());
      }
    }

    // Parse the levelString into a LogLevel
    levelString = trimWhitespace(levelString);
    try {
      categoryConfig.level = stringToLogLevel(levelString);
    } catch (const std::exception&) {
      throw LogConfigParseError{to<string>(
          "invalid log level \"",
          levelString,
          "\" for category \"",
          categoryName,
          "\"")};
    }

    // Check for multiple entries for the same category with different but
    // equivalent names.
    auto canonicalName = LogName::canonicalize(categoryName);
    auto ret = seenCategories.emplace(canonicalName, categoryName.str());
    if (!ret.second) {
      throw LogConfigParseError{to<string>(
          "category \"",
          canonicalName,
          "\" listed multiple times under different names: \"",
          ret.first->second,
          "\" and \"",
          categoryName,
          "\"")};
    }

    auto emplaceResult =
        categoryConfigs.emplace(canonicalName, std::move(categoryConfig));
    FOLLY_SAFE_DCHECK(
        emplaceResult.second,
        "category name must be new since it was not in seenCategories");
  }

  return categoryConfigs;
}

bool splitNameValue(
    StringPiece input,
    StringPiece* outName,
    StringPiece* outValue) {
  size_t equalIndex = input.find('=');
  if (equalIndex == StringPiece::npos) {
    return false;
  }

  StringPiece name{input.begin(), input.begin() + equalIndex};
  StringPiece value{input.begin() + equalIndex + 1, input.end()};

  *outName = trimWhitespace(name);
  *outValue = trimWhitespace(value);
  return true;
}

std::pair<std::string, LogHandlerConfig> parseHandlerConfig(StringPiece value) {
  // Parse the handler name and optional type
  auto colonIndex = value.find(':');
  StringPiece namePortion;
  StringPiece optionsStr;
  if (colonIndex == StringPiece::npos) {
    namePortion = value;
  } else {
    namePortion = StringPiece{value.begin(), value.begin() + colonIndex};
    optionsStr = StringPiece{value.begin() + colonIndex + 1, value.end()};
  }

  StringPiece handlerName;
  Optional<StringPiece> handlerType(in_place);
  if (!splitNameValue(namePortion, &handlerName, &handlerType.value())) {
    handlerName = trimWhitespace(namePortion);
    handlerType = folly::none;
  }

  // Make sure the handler name and type are not empty.
  // Also disallow commas in the name: this helps catch accidental errors where
  // the user left out the ':' and intended to be specifying options instead of
  // part of the name or type.
  if (handlerName.empty()) {
    throw LogConfigParseError{
        "error parsing log handler configuration: empty log handler name"};
  }
  if (handlerName.contains(',')) {
    throw LogConfigParseError{to<string>(
        "error parsing configuration for log handler \"",
        handlerName,
        "\": name cannot contain a comma when using the basic config format")};
  }
  if (handlerType.hasValue()) {
    if (handlerType->empty()) {
      throw LogConfigParseError{to<string>(
          "error parsing configuration for log handler \"",
          handlerName,
          "\": empty log handler type")};
    }
    if (handlerType->contains(',')) {
      throw LogConfigParseError{to<string>(
          "error parsing configuration for log handler \"",
          handlerName,
          "\": invalid type \"",
          handlerType.value(),
          "\": type name cannot contain a comma when using "
          "the basic config format")};
    }
  }

  // Parse the options
  LogHandlerConfig config{handlerType};
  optionsStr = trimWhitespace(optionsStr);
  if (!optionsStr.empty()) {
    std::vector<StringPiece> pieces;
    folly::split(",", optionsStr, pieces);
    FOLLY_SAFE_DCHECK(
        pieces.size() >= 1, "folly::split() always returns a list of length 1");

    for (const auto& piece : pieces) {
      StringPiece optionName;
      StringPiece optionValue;
      if (!splitNameValue(piece, &optionName, &optionValue)) {
        throw LogConfigParseError{to<string>(
            "error parsing configuration for log handler \"",
            handlerName,
            "\": options must be of the form NAME=VALUE")};
      }

      auto ret = config.options.emplace(optionName.str(), optionValue.str());
      if (!ret.second) {
        throw LogConfigParseError{to<string>(
            "error parsing configuration for log handler \"",
            handlerName,
            "\": duplicate configuration for option \"",
            optionName,
            "\"")};
      }
    }
  }

  return std::make_pair(handlerName.str(), std::move(config));
}

} // namespace

LogConfig parseLogConfig(StringPiece value) {
  value = trimWhitespace(value);
  if (value.startsWith('{')) {
    return parseLogConfigJson(value);
  }

  // Split the input string on semicolons.
  // Everything up to the first semicolon specifies log category configs.
  // From then on each section specifies a single LogHandler config.
  std::vector<StringPiece> pieces;
  folly::split(";", value, pieces);
  FOLLY_SAFE_DCHECK(
      pieces.size() >= 1, "folly::split() always returns a list of length 1");

  auto categoryConfigs = parseCategoryConfigs(pieces[0]);
  LogConfig::HandlerConfigMap handlerConfigs;
  for (size_t n = 1; n < pieces.size(); ++n) {
    auto handlerInfo = parseHandlerConfig(pieces[n]);
    auto ret = handlerConfigs.emplace(
        handlerInfo.first, std::move(handlerInfo.second));
    if (!ret.second) {
      throw LogConfigParseError{to<string>(
          "configuration for log category \"",
          handlerInfo.first,
          "\" specified multiple times")};
    }
  }

  return LogConfig{std::move(handlerConfigs), std::move(categoryConfigs)};
}

LogConfig parseLogConfigJson(StringPiece value) {
  json::serialization_opts opts;
  opts.allow_trailing_comma = true;
  auto jsonData = folly::parseJson(json::stripComments(value), opts);
  return parseLogConfigDynamic(jsonData);
}

LogConfig parseLogConfigDynamic(const dynamic& value) {
  if (!value.isObject()) {
    throw LogConfigParseError{"JSON config input must be an object"};
  }

  std::unordered_map<string, string> seenCategories;
  LogConfig::CategoryConfigMap categoryConfigs;
  auto* categories = value.get_ptr("categories");
  if (categories) {
    if (!categories->isObject()) {
      throw LogConfigParseError{to<string>(
          "unexpected data type for log categories config: got ",
          dynamicTypename(*categories),
          ", expected an object")};
    }

    for (const auto& entry : categories->items()) {
      if (!entry.first.isString()) {
        // This shouldn't really ever happen.
        // We deserialize the json with allow_non_string_keys set to False.
        throw LogConfigParseError{"category name must be a string"};
      }
      auto categoryName = entry.first.asString();
      auto categoryConfig = parseJsonCategoryConfig(entry.second, categoryName);

      // Check for multiple entries for the same category with different but
      // equivalent names.
      auto canonicalName = LogName::canonicalize(categoryName);
      auto ret = seenCategories.emplace(canonicalName, categoryName);
      if (!ret.second) {
        throw LogConfigParseError{to<string>(
            "category \"",
            canonicalName,
            "\" listed multiple times under different names: \"",
            ret.first->second,
            "\" and \"",
            categoryName,
            "\"")};
      }

      categoryConfigs[canonicalName] = std::move(categoryConfig);
    }
  }

  LogConfig::HandlerConfigMap handlerConfigs;
  auto* handlers = value.get_ptr("handlers");
  if (handlers) {
    if (!handlers->isObject()) {
      throw LogConfigParseError{to<string>(
          "unexpected data type for log handlers config: got ",
          dynamicTypename(*handlers),
          ", expected an object")};
    }

    for (const auto& entry : handlers->items()) {
      if (!entry.first.isString()) {
        // This shouldn't really ever happen.
        // We deserialize the json with allow_non_string_keys set to False.
        throw LogConfigParseError{"handler name must be a string"};
      }
      auto handlerName = entry.first.asString();
      handlerConfigs.emplace(
          handlerName, parseJsonHandlerConfig(entry.second, handlerName));
    }
  }

  return LogConfig{std::move(handlerConfigs), std::move(categoryConfigs)};
}

dynamic logConfigToDynamic(const LogConfig& config) {
  dynamic categories = dynamic::object;
  for (const auto& entry : config.getCategoryConfigs()) {
    categories.insert(entry.first, logConfigToDynamic(entry.second));
  }

  dynamic handlers = dynamic::object;
  for (const auto& entry : config.getHandlerConfigs()) {
    handlers.insert(entry.first, logConfigToDynamic(entry.second));
  }

  return dynamic::object("categories", std::move(categories))(
      "handlers", std::move(handlers));
}

dynamic logConfigToDynamic(const LogHandlerConfig& config) {
  dynamic options = dynamic::object;
  for (const auto& opt : config.options) {
    options.insert(opt.first, opt.second);
  }
  auto result = dynamic::object("options", options);
  if (config.type.hasValue()) {
    result("type", config.type.value());
  }
  return std::move(result);
}

dynamic logConfigToDynamic(const LogCategoryConfig& config) {
  auto value = dynamic::object("level", logLevelToString(config.level))(
      "inherit", config.inheritParentLevel);
  if (config.handlers.hasValue()) {
    auto handlers = dynamic::array();
    for (const auto& handlerName : config.handlers.value()) {
      handlers.push_back(handlerName);
    }
    value("handlers", std::move(handlers));
  }
  return std::move(value);
}

} // namespace folly
