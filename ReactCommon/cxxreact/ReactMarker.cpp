/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactMarker.h"
#include <cxxreact/JSExecutor.h>

namespace facebook {
namespace react {
namespace ReactMarker {

#if __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wglobal-constructors"
#endif

LogTaggedMarker logTaggedMarkerImpl = nullptr;
LogTaggedMarker logTaggedMarkerBridgelessImpl = nullptr;
GetAppStartTime getAppStartTimeImpl = nullptr;

#if __clang__
#pragma clang diagnostic pop
#endif

void logMarker(const ReactMarkerId markerId) {
  logTaggedMarker(markerId, nullptr);
}

void logTaggedMarker(const ReactMarkerId markerId, const char *tag) {
  StartupLogger::getInstance().logStartupEvent(markerId, tag);
  logTaggedMarkerImpl(markerId, tag);
}

void logMarkerBridgeless(const ReactMarkerId markerId) {
  logTaggedMarkerBridgeless(markerId, nullptr);
}

void logTaggedMarkerBridgeless(const ReactMarkerId markerId, const char *tag) {
  StartupLogger::getInstance().logStartupEvent(markerId, tag);
  logTaggedMarkerBridgelessImpl(markerId, tag);
}

double getAppStartTime() {
  if (getAppStartTimeImpl == nullptr) {
    return 0;
  }

  return getAppStartTimeImpl();
}

StartupLogger &StartupLogger::getInstance() {
  static StartupLogger instance;
  return instance;
}

void StartupLogger::logStartupEvent(
    const ReactMarkerId markerId,
    const char *tag) {
  if (startupStopped) {
    return;
  }

  if (markerId == ReactMarkerId::RUN_JS_BUNDLE_START ||
      markerId == ReactMarkerId::RUN_JS_BUNDLE_STOP) {
    startupReactMarkers.push_back(
        {markerId, tag, JSExecutor::performanceNow()});
    startupStopped = markerId == ReactMarkerId::RUN_JS_BUNDLE_STOP;
  }
}

std::vector<ReactMarkerEvent> StartupLogger::getStartupReactMarkers() {
  return startupReactMarkers;
}

} // namespace ReactMarker
} // namespace react
} // namespace facebook
