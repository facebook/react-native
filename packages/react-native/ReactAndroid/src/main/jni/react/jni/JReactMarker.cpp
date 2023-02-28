/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JReactMarker.h"
#include <cxxreact/ReactMarker.h>
#include <fbjni/fbjni.h>
#include <glog/logging.h>
#include <mutex>

namespace facebook {
namespace react {

void JReactMarker::setLogPerfMarkerIfNeeded() {
  static std::once_flag flag{};
  std::call_once(flag, []() {
    ReactMarker::logTaggedMarker = JReactMarker::logPerfMarker;
    ReactMarker::logTaggedMarkerBridgeless =
        JReactMarker::logPerfMarkerBridgeless;
  });
}

void JReactMarker::logMarker(const std::string &marker) {
  static auto cls = javaClassStatic();
  static auto meth = cls->getStaticMethod<void(std::string)>("logMarker");
  meth(cls, marker);
}

void JReactMarker::logMarker(
    const std::string &marker,
    const std::string &tag) {
  static auto cls = javaClassStatic();
  static auto meth =
      cls->getStaticMethod<void(std::string, std::string)>("logMarker");
  meth(cls, marker, tag);
}

void JReactMarker::logMarker(
    const std::string &marker,
    const std::string &tag,
    const int instanceKey) {
  static auto cls = javaClassStatic();
  static auto meth =
      cls->getStaticMethod<void(std::string, std::string, int)>("logMarker");
  meth(cls, marker, tag, instanceKey);
}

void JReactMarker::logPerfMarker(
    const ReactMarker::ReactMarkerId markerId,
    const char *tag) {
  const int bridgeInstanceKey = 0;
  logPerfMarkerWithInstanceKey(markerId, tag, bridgeInstanceKey);
}

void JReactMarker::logPerfMarkerBridgeless(
    const ReactMarker::ReactMarkerId markerId,
    const char *tag) {
  const int bridgelessInstanceKey = 1;
  logPerfMarkerWithInstanceKey(markerId, tag, bridgelessInstanceKey);
}

void JReactMarker::logPerfMarkerWithInstanceKey(
    const facebook::react::ReactMarker::ReactMarkerId markerId,
    const char *tag,
    const int instanceKey) {
  switch (markerId) {
    case ReactMarker::RUN_JS_BUNDLE_START:
      JReactMarker::logMarker("RUN_JS_BUNDLE_START", tag, instanceKey);
      break;
    case ReactMarker::RUN_JS_BUNDLE_STOP:
      JReactMarker::logMarker("RUN_JS_BUNDLE_END", tag, instanceKey);
      break;
    case ReactMarker::CREATE_REACT_CONTEXT_STOP:
      JReactMarker::logMarker("CREATE_REACT_CONTEXT_END");
      break;
    case ReactMarker::JS_BUNDLE_STRING_CONVERT_START:
      JReactMarker::logMarker("loadApplicationScript_startStringConvert");
      break;
    case ReactMarker::JS_BUNDLE_STRING_CONVERT_STOP:
      JReactMarker::logMarker("loadApplicationScript_endStringConvert");
      break;
    case ReactMarker::NATIVE_MODULE_SETUP_START:
      JReactMarker::logMarker("NATIVE_MODULE_SETUP_START", tag, instanceKey);
      break;
    case ReactMarker::NATIVE_MODULE_SETUP_STOP:
      JReactMarker::logMarker("NATIVE_MODULE_SETUP_END", tag, instanceKey);
      break;
    case ReactMarker::REGISTER_JS_SEGMENT_START:
      JReactMarker::logMarker("REGISTER_JS_SEGMENT_START", tag, instanceKey);
      break;
    case ReactMarker::REGISTER_JS_SEGMENT_STOP:
      JReactMarker::logMarker("REGISTER_JS_SEGMENT_STOP", tag, instanceKey);
      break;
    case ReactMarker::NATIVE_REQUIRE_START:
    case ReactMarker::NATIVE_REQUIRE_STOP:
    case ReactMarker::REACT_INSTANCE_INIT_START:
    case ReactMarker::REACT_INSTANCE_INIT_STOP:
      // These are not used on Android.
      break;
  }
}

} // namespace react
} // namespace facebook
