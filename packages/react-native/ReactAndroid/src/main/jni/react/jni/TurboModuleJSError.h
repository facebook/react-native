/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/debug/react_native_assert.h>

namespace facebook::react {

inline jsi::Value createJSRuntimeError(
    jsi::Runtime& runtime,
    jsi::Value&& message) {
  return runtime.global()
      .getPropertyAsFunction(runtime, "Error")
      .call(runtime, std::move(message));
}

inline jsi::Value createJSRuntimeError(
    jsi::Runtime& runtime,
    const std::string& message) {
  return createJSRuntimeError(
      runtime, jsi::String::createFromUtf8(runtime, message));
}

inline jsi::Value createRejectionError(
    jsi::Runtime& rt,
    const folly::dynamic& args) {
  react_native_assert(
      args.size() == 1 && "promise reject should have only one argument");

  auto value = jsi::valueFromDynamic(rt, args[0]);
  react_native_assert(value.isObject() && "promise reject should return a map");

  const jsi::Object& valueAsObject = value.asObject(rt);
  auto jsError = createJSRuntimeError(
      rt, valueAsObject.getProperty(rt, "message"));

  auto jsErrorAsObject = jsError.asObject(rt);
  auto propertyNames = valueAsObject.getPropertyNames(rt);
  for (size_t i = 0; i < propertyNames.size(rt); ++i) {
    auto propertyName = jsi::PropNameID::forString(
        rt, propertyNames.getValueAtIndex(rt, i).asString(rt));
    jsErrorAsObject.setProperty(
        rt, propertyName, valueAsObject.getProperty(rt, propertyName));
  }
  return jsError;
}

} // namespace facebook::react
