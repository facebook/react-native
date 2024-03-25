/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventLogger.h"

namespace facebook::react {

EventLogger* eventLogger;

void setEventLogger(EventLogger* logger) {
  eventLogger = logger;
}

EventLogger* getEventLogger() {
  return eventLogger;
}

} // namespace facebook::react
