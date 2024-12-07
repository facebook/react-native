/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <reactperflogger/ReactPerfettoCategories.h>

#include <optional>
#include <string>

namespace facebook::react {

/**
 * An internal interface for logging performance events to configured React
 * Native performance tools, such as Perfetto or React Native DevTools.
 *
 * Approximates https://w3c.github.io/user-timing/.
 */
class ReactPerfLogger {
 public:
  static void mark(
      const std::string_view& eventName,
      double startTime,
      const std::optional<std::string_view>& trackName);

  static void measure(
      const std::string_view& eventName,
      double startTime,
      double endTime,
      const std::optional<std::string_view>& trackName);

  static double performanceNow();
};

} // namespace facebook::react
