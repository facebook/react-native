/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#if __has_include("rncoreJSI.h") // Cmake headers on Android
#include "rncoreJSI.h"
#elif __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif

#include <react/renderer/core/ShadowNodeFamily.h>

namespace facebook::react {

class NativeDOM : public NativeDOMCxxSpec<NativeDOM> {
 public:
  NativeDOM(std::shared_ptr<CallInvoker> jsInvoker);

#pragma mark - Methods from the `Node` interface (for `ReadOnlyNode`).

  double compareDocumentPosition(
      jsi::Runtime& rt,
      jsi::Value nativeNodeReference,
      jsi::Value otherNativeNodeReference);

  std::vector<jsi::Value> getChildNodes(
      jsi::Runtime& rt,
      jsi::Value nativeNodeReference);

  jsi::Value getParentNode(jsi::Runtime& rt, jsi::Value nativeNodeReference);

  bool isConnected(jsi::Runtime& rt, jsi::Value nativeNodeReference);

#pragma mark - Methods from the `Element` interface (for `ReactNativeElement`).

  std::tuple<
      /* topWidth: */ int,
      /* rightWidth: */ int,
      /* bottomWidth: */ int,
      /* leftWidth: */ int>
  getBorderWidth(jsi::Runtime& rt, jsi::Value nativeElementReference);

  std::tuple<
      /* x: */ double,
      /* y: */ double,
      /* width: */ double,
      /* height: */ double>
  getBoundingClientRect(
      jsi::Runtime& rt,
      jsi::Value nativeElementReference,
      bool includeTransform);

  std::tuple</* width: */ int, /* height: */ int> getInnerSize(
      jsi::Runtime& rt,
      jsi::Value nativeElementReference);

  std::tuple</* scrollLeft: */ double, /* scrollTop: */ double>
  getScrollPosition(jsi::Runtime& rt, jsi::Value nativeElementReference);

  std::tuple</* scrollWidth: */ int, /* scrollHeight */ int> getScrollSize(
      jsi::Runtime& rt,
      jsi::Value nativeElementReference);

  std::string getTagName(jsi::Runtime& rt, jsi::Value nativeElementReference);

  std::string getTextContent(jsi::Runtime& rt, jsi::Value nativeNodeReference);

  bool hasPointerCapture(
      jsi::Runtime& rt,
      jsi::Value nativeElementReference,
      double pointerId);

  void releasePointerCapture(
      jsi::Runtime& rt,
      jsi::Value nativeElementReference,
      double pointerId);

  void setPointerCapture(
      jsi::Runtime& rt,
      jsi::Value nativeElementReference,
      double pointerId);

#pragma mark - Methods from the `HTMLElement` interface (for `ReactNativeElement`).

  std::tuple<
      /* offsetParent: */ jsi::Value,
      /* top: */ double,
      /* left: */ double>
  getOffset(jsi::Runtime& rt, jsi::Value nativeElementReference);

#pragma mark - Special methods to handle the root node.

  jsi::Value linkRootNode(
      jsi::Runtime& rt,
      SurfaceId surfaceId,
      jsi::Value instanceHandle);

#pragma mark - Legacy layout APIs (for `ReactNativeElement`).

  void measure(
      jsi::Runtime& rt,
      jsi::Value nativeElementReference,
      jsi::Function callback);

  void measureInWindow(
      jsi::Runtime& rt,
      jsi::Value nativeElementReference,
      jsi::Function callback);

  void measureLayout(
      jsi::Runtime& rt,
      jsi::Value nativeElementReference,
      jsi::Value relativeToNativeElementReference,
      jsi::Function onFail,
      jsi::Function onSuccess);
};

} // namespace facebook::react
