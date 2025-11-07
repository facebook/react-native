/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/container/small_vector.h>

#include <optional>
#include <string>

namespace facebook::react::jsinspector_modern::tracing {

enum class Category {
  HiddenTimeline, /*     disabled-by-default-devtools.timeline */
  JavaScriptSampling, /* disabled-by-default-v8.cpu_profiler   */
  RuntimeExecution, /*   v8.execute                            */
  Timeline, /*           devtools.timeline                     */
  UserTiming, /*         blink.user_timing                     */
};

inline std::string tracingCategoryToString(const Category &category)
{
  switch (category) {
    case Category::Timeline:
      return "devtools.timeline";
    case Category::HiddenTimeline:
      return "disabled-by-default-devtools.timeline";
    case Category::UserTiming:
      return "blink.user_timing";
    case Category::JavaScriptSampling:
      return "disabled-by-default-v8.cpu_profiler";
    case Category::RuntimeExecution:
      return "v8.execute";
  }
}

inline std::optional<Category> getTracingCategoryFromString(const std::string &str)
{
  if (str == "blink.user_timing") {
    return Category::UserTiming;
  } else if (str == "devtools.timeline") {
    return Category::Timeline;
  } else if (str == "disabled-by-default-devtools.timeline") {
    return Category::HiddenTimeline;
  } else if (str == "disabled-by-default-v8.cpu_profiler") {
    return Category::JavaScriptSampling;
  } else if (str == "v8.execute") {
    return Category::RuntimeExecution;
  } else {
    return std::nullopt;
  }
}

/**
 * The Trace Event could have multiple categories, but this is extremely rare case.
 */
using Categories = folly::small_vector<Category, 1>;

// { Timeline, UserTiming } => "devtools.timeline,blink.user_timing"
inline std::string serializeTracingCategories(const Categories &categories)
{
  if (categories.size() == 1) {
    return tracingCategoryToString(categories.front());
  }

  std::string serializedValue;
  for (size_t i = 0; i < categories.size(); ++i) {
    serializedValue += tracingCategoryToString(categories[i]);
    if (i < categories.size() - 1) {
      serializedValue += ",";
    }
  }
  return serializedValue;
}

} // namespace facebook::react::jsinspector_modern::tracing
