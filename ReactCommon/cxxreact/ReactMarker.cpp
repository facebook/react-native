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
  StartupLogger::getInstance().logStartupEvent(markerId);
  logTaggedMarkerImpl(markerId, tag);
}

void logMarkerBridgeless(const ReactMarkerId markerId) {
  logTaggedMarkerBridgeless(markerId, nullptr);
}

void logTaggedMarkerBridgeless(const ReactMarkerId markerId, const char *tag) {
  StartupLogger::getInstance().logStartupEvent(markerId);
  logTaggedMarkerBridgelessImpl(markerId, tag);
}

StartupLogger &StartupLogger::getInstance() {
  static StartupLogger instance;
  return instance;
}

void StartupLogger::logStartupEvent(const ReactMarkerId markerId) {
  auto now = JSExecutor::performanceNow();
  switch (markerId) {
    case ReactMarkerId::RUN_JS_BUNDLE_START:
      if (runJSBundleStartTime == 0) {
        runJSBundleStartTime = now;
      }
      return;

    case ReactMarkerId::RUN_JS_BUNDLE_STOP:
      if (runJSBundleEndTime == 0) {
        runJSBundleEndTime = now;
      }
      return;

    default:
      return;
  }
}

double StartupLogger::getAppStartTime() {
  if (getAppStartTimeImpl == nullptr) {
    return 0;
  }

  return getAppStartTimeImpl();
}

double StartupLogger::getRunJSBundleStartTime() {
  return runJSBundleStartTime;
}

double StartupLogger::getRunJSBundleEndTime() {
  return runJSBundleEndTime;
}

} // namespace ReactMarker
} // namespace react
} // namespace facebook
