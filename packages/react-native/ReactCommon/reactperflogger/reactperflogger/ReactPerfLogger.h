/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <reactperflogger/ReactPerfettoCategories.h>
#include <string>

namespace facebook::react {

class ReactPerfLogger {
 public:
  static void mark(
      const std::string_view& eventName,
      double startTime,
      const std::string_view& trackName);

  /**
   * This accepts performance events that should go to internal tracing
   * frameworks like Perfetto, and should go to DevTools like Fusebox.
   */
  static void measure(
      const std::string_view& eventName,
      double startTime,
      double endTime,
      const std::string_view& trackName);

  static double performanceNow();
};

} // namespace facebook::react
