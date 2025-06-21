/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/timing/primitives.h>

#include <cassert>
#include <optional>
#include <string>
#include <unordered_map>
#include <variant>

namespace facebook::react::jsinspector_modern::tracing {

// https://developer.chrome.com/docs/devtools/performance/extension#inject_your_data_with_consoletimestamp
using TimeStampEntry = std::variant<HighResTimeStamp, std::string>;

// https://developer.chrome.com/docs/devtools/performance/extension#devtools_object
enum class TimeStampColor {
  Primary,
  PrimaryLight,
  PrimaryDark,
  Secondary,
  SecondaryLight,
  SecondaryDark,
  Tertiary,
  TertiaryLight,
  TertiaryDark,
  Error,
};

inline std::string timeStampColorToString(TimeStampColor color) {
  static const std::unordered_map<TimeStampColor, std::string>
      timeStampColorMappings = {
          {TimeStampColor::Primary, "primary"},
          {TimeStampColor::PrimaryLight, "primary-light"},
          {TimeStampColor::PrimaryDark, "primary-dark"},
          {TimeStampColor::Secondary, "secondary"},
          {TimeStampColor::SecondaryLight, "secondary-light"},
          {TimeStampColor::SecondaryDark, "secondary-dark"},
          {TimeStampColor::Tertiary, "tertiary"},
          {TimeStampColor::TertiaryLight, "tertiary-light"},
          {TimeStampColor::TertiaryDark, "tertiary-dark"},
          {TimeStampColor::Error, "error"},
      };

  auto it = timeStampColorMappings.find(color);
  assert(it != timeStampColorMappings.end() && "Unknown TimeStampColor");
  return it->second;
};

inline std::optional<TimeStampColor> getTimeStampColorFromString(
    const std::string& str) {
  static const std::unordered_map<std::string, TimeStampColor>
      timeStampColorMappings = {
          {"primary", TimeStampColor::Primary},
          {"primary-light", TimeStampColor::PrimaryLight},
          {"primary-dark", TimeStampColor::PrimaryDark},
          {"secondary", TimeStampColor::Secondary},
          {"secondary-light", TimeStampColor::SecondaryLight},
          {"secondary-dark", TimeStampColor::SecondaryDark},
          {"tertiary", TimeStampColor::Tertiary},
          {"tertiary-light", TimeStampColor::TertiaryLight},
          {"tertiary-dark", TimeStampColor::TertiaryDark},
          {"error", TimeStampColor::Error},
      };

  auto it = timeStampColorMappings.find(str);
  if (it == timeStampColorMappings.end()) {
    return std::nullopt;
  }
  return it->second;
};

}; // namespace facebook::react::jsinspector_modern::tracing
