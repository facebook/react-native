/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactMarker.h"
#include <cxxreact/JSExecutor.h>

namespace facebook::react::ReactMarker {

#if __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wglobal-constructors"
#endif

LogTaggedMarker logTaggedMarkerBridgelessImpl = nullptr;
LogTaggedMarker logTaggedMarkerImpl = nullptr;
std::shared_mutex logTaggedMarkerImplMutex;

#if __clang__
#pragma clang diagnostic pop
#endif

void logMarker(const ReactMarkerId markerId) {
  logTaggedMarker(markerId, nullptr);
}

void logTaggedMarker(const ReactMarkerId markerId, const char* tag) {
  LogTaggedMarker marker = nullptr;
  {
    std::shared_lock lock(logTaggedMarkerImplMutex);
    marker = logTaggedMarkerImpl;
  }
  if (marker != nullptr) {
    marker(markerId, tag);
  }
}

void logMarkerBridgeless(const ReactMarkerId markerId) {
  logTaggedMarkerBridgeless(markerId, nullptr);
}

void logTaggedMarkerBridgeless(const ReactMarkerId markerId, const char* tag) {
  logTaggedMarkerBridgelessImpl(markerId, tag);
}

void logMarkerDone(const ReactMarkerId markerId, double markerTime) {
  StartupLogger::getInstance().logStartupEvent(markerId, markerTime);
}

StartupLogger& StartupLogger::getInstance() {
  static StartupLogger instance;
  return instance;
}

void StartupLogger::logStartupEvent(
    const ReactMarkerId markerId,
    double markerTime) {
  switch (markerId) {
    case ReactMarkerId::APP_STARTUP_START:
      if (!std::isnan(appStartupStartTime)) {
        // We had a startup start time, which indicates a warm start (user
        // closed the app and start again). In this case we need to invalidate
        // all other startup timings.
        reset();
      }
      appStartupStartTime = markerTime;
      return;

    case ReactMarkerId::APP_STARTUP_STOP:
      if (std::isnan(appStartupEndTime)) {
        appStartupEndTime = markerTime;
      }
      return;

    case ReactMarkerId::INIT_REACT_RUNTIME_START:
      if (std::isnan(initReactRuntimeStartTime)) {
        initReactRuntimeStartTime = markerTime;
      }
      return;

    case ReactMarkerId::INIT_REACT_RUNTIME_STOP:
      if (std::isnan(initReactRuntimeEndTime)) {
        initReactRuntimeEndTime = markerTime;
      }
      return;

    case ReactMarkerId::RUN_JS_BUNDLE_START:
      if (std::isnan(runJSBundleStartTime)) {
        runJSBundleStartTime = markerTime;
      }
      return;

    case ReactMarkerId::RUN_JS_BUNDLE_STOP:
      if (std::isnan(runJSBundleEndTime)) {
        runJSBundleEndTime = markerTime;
      }
      return;

    default:
      return;
  }
}

void StartupLogger::reset() {
  appStartupStartTime = std::nan("");
  appStartupEndTime = std::nan("");
  initReactRuntimeStartTime = std::nan("");
  initReactRuntimeEndTime = std::nan("");
  runJSBundleStartTime = std::nan("");
  runJSBundleEndTime = std::nan("");
}

double StartupLogger::getAppStartupStartTime() {
  return appStartupStartTime;
}

double StartupLogger::getInitReactRuntimeStartTime() {
  return initReactRuntimeStartTime;
}

double StartupLogger::getInitReactRuntimeEndTime() {
  return initReactRuntimeEndTime;
}

double StartupLogger::getRunJSBundleStartTime() {
  return runJSBundleStartTime;
}

double StartupLogger::getRunJSBundleEndTime() {
  return runJSBundleEndTime;
}

double StartupLogger::getAppStartupEndTime() {
  return appStartupEndTime;
}

} // namespace facebook::react::ReactMarker
