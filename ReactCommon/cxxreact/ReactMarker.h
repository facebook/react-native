/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __APPLE__
#include <functional>
#endif

namespace facebook {
namespace react {
namespace ReactMarker {

enum ReactMarkerId {
  NATIVE_REQUIRE_START,
  NATIVE_REQUIRE_STOP,
  RUN_JS_BUNDLE_START,
  RUN_JS_BUNDLE_STOP,
  CREATE_REACT_CONTEXT_STOP,
  JS_BUNDLE_STRING_CONVERT_START,
  JS_BUNDLE_STRING_CONVERT_STOP,
  NATIVE_MODULE_SETUP_START,
  NATIVE_MODULE_SETUP_STOP,
  REGISTER_JS_SEGMENT_START,
  REGISTER_JS_SEGMENT_STOP,
  REACT_INSTANCE_INIT_START,
  REACT_INSTANCE_INIT_STOP
};

#ifdef __APPLE__
using LogTaggedMarker =
    std::function<void(const ReactMarkerId, const char *tag)>;
using LogTaggedMarkerWithInstanceKey = std::function<
    void(const ReactMarkerId, const char *tag, const int instanceKey)>;
#else
typedef void (*LogTaggedMarker)(const ReactMarkerId, const char *tag);
typedef void (*LogTaggedMarkerWithInstanceKey)(
    const ReactMarkerId,
    const char *tag,
    const int instanceKey);
#endif

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

extern RN_EXPORT LogTaggedMarker logTaggedMarker;
extern RN_EXPORT LogTaggedMarkerWithInstanceKey logTaggedMarkerWithInstanceKey;

extern RN_EXPORT void logMarker(const ReactMarkerId markerId);

} // namespace ReactMarker
} // namespace react
} // namespace facebook
