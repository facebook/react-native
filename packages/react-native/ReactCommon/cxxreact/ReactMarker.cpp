/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactMarker.h"
#include <cxxreact/JSExecutor.h>
#include <cxxreact/PerformanceEntryLogger.h>

#include <reactperflogger/BridgeNativeModulePerfLogger.h>

#include <algorithm>
#include <string>

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
bool appCreatePerformanceEntryLogged = false;

#if __clang__
#pragma clang diagnostic pop
#endif

// Mapping of ReactMarkerId to the string names. Please keep in sync with the
// ReactMarkerId definition!!!
constexpr const char *getMarkerName(ReactMarkerId markerId) {
  switch (markerId) {
    case ReactMarker::NATIVE_REQUIRE_START:
      return "NATIVE_REQUIRE_START";
    case ReactMarker::NATIVE_REQUIRE_STOP:
      return "NATIVE_REQUIRE_STOP";
    case ReactMarker::RUN_JS_BUNDLE_START:
      return "RUN_JS_BUNDLE_START";
    case ReactMarker::RUN_JS_BUNDLE_STOP:
      return "RUN_JS_BUNDLE_STOP";
    case ReactMarker::CREATE_REACT_CONTEXT_STOP:
      return "CREATE_REACT_CONTEXT_STOP";
    case ReactMarker::JS_BUNDLE_STRING_CONVERT_START:
      return "JS_BUNDLE_STRING_CONVERT_START";
    case ReactMarker::JS_BUNDLE_STRING_CONVERT_STOP:
      return "JS_BUNDLE_STRING_CONVERT_STOP";
    case ReactMarker::NATIVE_MODULE_SETUP_START:
      return "NATIVE_MODULE_SETUP_START";
    case ReactMarker::NATIVE_MODULE_SETUP_STOP:
      return "NATIVE_MODULE_SETUP_STOP";
    case ReactMarker::REGISTER_JS_SEGMENT_START:
      return "REGISTER_JS_SEGMENT_START";
    case ReactMarker::REGISTER_JS_SEGMENT_STOP:
      return "REGISTER_JS_SEGMENT_STOP";
    case ReactMarker::REACT_INSTANCE_INIT_START:
      return "REACT_INSTANCE_INIT_START";
    case ReactMarker::REACT_INSTANCE_INIT_STOP:
      return "REACT_INSTANCE_INIT_STOP";
    case ReactMarker::APP_CREATE:
      return "APP_CREATE";
  }
  return "UNDEFINED";
}

static constexpr const char *START_SUFFIX = "_START";
static constexpr const char *END_SUFFIX = "_STOP";

static void logPerformanceEntry(const ReactMarkerId markerId, const char *tag) {
  PerformanceEntryLogger *logger = getPerformanceEntryLogger();
  if (logger == nullptr) {
    return;
  }

  if (!appCreatePerformanceEntryLogged && getAppStartTimeImpl != nullptr) {
    auto appStartTime = getAppStartTimeImpl();
    logger->onReactMarkerStart("app_create", appStartTime);
    logger->onReactMarkerEnd("app_create", appStartTime);
    appCreatePerformanceEntryLogged = true;
  }

  // Preprocess marker name
  std::string markerName = getMarkerName(markerId);
  bool isStart = true;
  bool isEnd = true;

  // Check whether a start marker
  auto pos = markerName.rfind(START_SUFFIX);
  if (pos != std::string::npos) {
    markerName =
        markerName.substr(0, markerName.size() - std::strlen(START_SUFFIX));
    isEnd = false;
  }

  // Check whether an end marker
  pos = markerName.rfind(END_SUFFIX);
  if (pos != std::string::npos) {
    markerName =
        markerName.substr(0, markerName.size() - std::strlen(END_SUFFIX));
    isStart = false;
  }

  // To lowercase
  std::transform(
      markerName.begin(), markerName.end(), markerName.begin(), ::tolower);

  // Append tag
  if (tag != nullptr && tag[0] != 0) {
    markerName += ":";
    markerName += tag;
  }

  auto timeStamp = JSExecutor::performanceNow();
  if (isStart) {
    logger->onReactMarkerStart(markerName.c_str(), timeStamp);
  }

  if (isEnd) {
    logger->onReactMarkerEnd(markerName.c_str(), timeStamp);
  }
}

void logMarker(const ReactMarkerId markerId) {
  logTaggedMarker(markerId, nullptr);
}

void logTaggedMarker(const ReactMarkerId markerId, const char *tag) {
  logPerformanceEntry(markerId, tag);
  logTaggedMarkerImpl(markerId, tag);
}

void logMarkerBridgeless(const ReactMarkerId markerId) {
  logTaggedMarkerBridgeless(markerId, nullptr);
}

void logTaggedMarkerBridgeless(const ReactMarkerId markerId, const char *tag) {
  logPerformanceEntry(markerId, tag);
  logTaggedMarkerBridgelessImpl(markerId, tag);
}

} // namespace ReactMarker
} // namespace react
} // namespace facebook
