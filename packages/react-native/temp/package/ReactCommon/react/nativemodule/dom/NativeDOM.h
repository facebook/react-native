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

namespace facebook::react {

class NativeDOM : public NativeDOMCxxSpec<NativeDOM> {
 public:
  NativeDOM(std::shared_ptr<CallInvoker> jsInvoker);

  jsi::Value getParentNode(jsi::Runtime& rt, jsi::Value shadowNodeValue);

  std::vector<jsi::Value> getChildNodes(
      jsi::Runtime& rt,
      jsi::Value shadowNodeValue);

  bool isConnected(jsi::Runtime& rt, jsi::Value shadowNodeValue);

  double compareDocumentPosition(
      jsi::Runtime& rt,
      jsi::Value shadowNodeValue,
      jsi::Value otherShadowNodeValue);

  std::string getTextContent(jsi::Runtime& rt, jsi::Value shadowNodeValue);

  std::tuple<
      /* x: */ double,
      /* y: */ double,
      /* width: */ double,
      /* height: */ double>
  getBoundingClientRect(
      jsi::Runtime& rt,
      jsi::Value shadowNodeValue,
      bool includeTransform);

  std::tuple<
      /* offsetParent: */ jsi::Value,
      /* top: */ double,
      /* left: */ double>
  getOffset(jsi::Runtime& rt, jsi::Value shadowNodeValue);

  std::tuple</* scrollLeft: */ double, /* scrollTop: */ double>
  getScrollPosition(jsi::Runtime& rt, jsi::Value shadowNodeValue);

  std::tuple</* scrollWidth: */ int, /* scrollHeight */ int> getScrollSize(
      jsi::Runtime& rt,
      jsi::Value shadowNodeValue);

  std::tuple</* width: */ int, /* height: */ int> getInnerSize(
      jsi::Runtime& rt,
      jsi::Value shadowNodeValue);

  std::tuple<
      /* topWidth: */ int,
      /* rightWidth: */ int,
      /* bottomWidth: */ int,
      /* leftWidth: */ int>
  getBorderWidth(jsi::Runtime& rt, jsi::Value shadowNodeValue);

  std::string getTagName(jsi::Runtime& rt, jsi::Value shadowNodeValue);

  bool hasPointerCapture(
      jsi::Runtime& rt,
      jsi::Value shadowNodeValue,
      double pointerId);

  void setPointerCapture(
      jsi::Runtime& rt,
      jsi::Value shadowNodeValue,
      double pointerId);

  void releasePointerCapture(
      jsi::Runtime& rt,
      jsi::Value shadowNodeValue,
      double pointerId);

  // Legacy layout APIs

  void
  measure(jsi::Runtime& rt, jsi::Value shadowNodeValue, jsi::Function callback);

  void measureInWindow(
      jsi::Runtime& rt,
      jsi::Value shadowNodeValue,
      jsi::Function callback);

  void measureLayout(
      jsi::Runtime& rt,
      jsi::Value shadowNodeValue,
      jsi::Value relativeToShadowNodeValue,
      jsi::Function onFail,
      jsi::Function onSuccess);
};

} // namespace facebook::react
