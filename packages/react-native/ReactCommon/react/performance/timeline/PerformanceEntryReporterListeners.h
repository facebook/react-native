/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "PerformanceEntry.h"

#include <folly/dynamic.h>
#include <react/timing/primitives.h>

namespace facebook::react {

class PerformanceEntryReporterEventTimingListener {
 public:
  virtual ~PerformanceEntryReporterEventTimingListener() = default;

  virtual void onEventTimingEntry(const PerformanceEventTiming& /*entry*/) {}

  virtual void onLongTaskEntry(const PerformanceLongTaskTiming& /*entry*/) {}
};

} // namespace facebook::react
