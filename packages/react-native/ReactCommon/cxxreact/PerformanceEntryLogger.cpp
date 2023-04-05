/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryLogger.h"

namespace facebook::react {

PerformanceEntryLogger *performanceEntryLogger;

void setPerformanceEntryLogger(PerformanceEntryLogger *logger) {
  performanceEntryLogger = logger;
}

PerformanceEntryLogger *getPerformanceEntryLogger() {
  return performanceEntryLogger;
}

} // namespace facebook::react
