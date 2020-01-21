/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JReactMarker.h"
#include <cxxreact/ReactMarker.h>
#include <fbjni/fbjni.h>
#include <mutex>

namespace facebook {
namespace react {

void JReactMarker::setLogPerfMarkerIfNeeded() {
  static std::once_flag flag{};
  std::call_once(flag, []() {
    ReactMarker::logTaggedMarker = JReactMarker::logPerfMarker;
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

void JReactMarker::logPerfMarker(
    const ReactMarker::ReactMarkerId markerId,
    const char *tag) {
  switch (markerId) {
    case ReactMarker::RUN_JS_BUNDLE_START:
      JReactMarker::logMarker("RUN_JS_BUNDLE_START", tag);
      break;
    case ReactMarker::RUN_JS_BUNDLE_STOP:
      JReactMarker::logMarker("RUN_JS_BUNDLE_END", tag);
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
      JReactMarker::logMarker("NATIVE_MODULE_SETUP_START", tag);
      break;
    case ReactMarker::NATIVE_MODULE_SETUP_STOP:
      JReactMarker::logMarker("NATIVE_MODULE_SETUP_END", tag);
      break;
    case ReactMarker::REGISTER_JS_SEGMENT_START:
      JReactMarker::logMarker("REGISTER_JS_SEGMENT_START", tag);
      break;
    case ReactMarker::REGISTER_JS_SEGMENT_STOP:
      JReactMarker::logMarker("REGISTER_JS_SEGMENT_STOP", tag);
      break;
    case ReactMarker::NATIVE_REQUIRE_START:
    case ReactMarker::NATIVE_REQUIRE_STOP:
      // These are not used on Android.
      break;
  }
}

} // namespace react
} // namespace facebook
