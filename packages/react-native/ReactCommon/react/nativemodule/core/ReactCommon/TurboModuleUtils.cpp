/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModuleUtils.h"

namespace facebook::react {

static jsi::Value deepCopyJSIValue(jsi::Runtime& rt, const jsi::Value& value) {
  if (value.isNull()) {
    return jsi::Value::null();
  }

  if (value.isBool()) {
    return jsi::Value(value.getBool());
  }

  if (value.isNumber()) {
    return jsi::Value(value.getNumber());
  }

  if (value.isString()) {
    return value.getString(rt);
  }

  if (value.isObject()) {
    jsi::Object o = value.getObject(rt);
    if (o.isArray(rt)) {
      return deepCopyJSIArray(rt, o.getArray(rt));
    }
    if (o.isFunction(rt)) {
      return o.getFunction(rt);
    }
    return deepCopyJSIObject(rt, o);
  }

  return jsi::Value::undefined();
}

jsi::Object deepCopyJSIObject(jsi::Runtime& rt, const jsi::Object& obj) {
  jsi::Object copy(rt);
  jsi::Array propertyNames = obj.getPropertyNames(rt);
  size_t size = propertyNames.size(rt);
  for (size_t i = 0; i < size; i++) {
    jsi::String name = propertyNames.getValueAtIndex(rt, i).getString(rt);
    jsi::Value value = obj.getProperty(rt, name);
    copy.setProperty(rt, name, deepCopyJSIValue(rt, value));
  }
  return copy;
}

jsi::Array deepCopyJSIArray(jsi::Runtime& rt, const jsi::Array& arr) {
  size_t size = arr.size(rt);
  jsi::Array copy(rt, size);
  for (size_t i = 0; i < size; i++) {
    copy.setValueAtIndex(
        rt, i, deepCopyJSIValue(rt, arr.getValueAtIndex(rt, i)));
  }
  return copy;
}

Promise::Promise(jsi::Runtime& rt, jsi::Function resolve, jsi::Function reject)
    : runtime_(rt), resolve_(std::move(resolve)), reject_(std::move(reject)) {}

void Promise::resolve(const jsi::Value& result) {
  resolve_.call(runtime_, result);
}

void Promise::reject(const std::string& message) {
  jsi::Object error(runtime_);
  error.setProperty(
      runtime_, "message", jsi::String::createFromUtf8(runtime_, message));
  reject_.call(runtime_, error);
}

jsi::Value createPromiseAsJSIValue(
    jsi::Runtime& rt,
    PromiseSetupFunctionType&& func) {
  jsi::Function JSPromise = rt.global().getPropertyAsFunction(rt, "Promise");
  jsi::Function fn = jsi::Function::createFromHostFunction(
      rt,
      jsi::PropNameID::forAscii(rt, "fn"),
      2,
      [func = std::move(func)](
          jsi::Runtime& rt2,
          const jsi::Value& thisVal,
          const jsi::Value* args,
          size_t count) {
        jsi::Function resolve = args[0].getObject(rt2).getFunction(rt2);
        jsi::Function reject = args[1].getObject(rt2).getFunction(rt2);
        auto wrapper = std::make_shared<Promise>(
            rt2, std::move(resolve), std::move(reject));
        func(rt2, wrapper);
        return jsi::Value::undefined();
      });

  return JSPromise.callAsConstructor(rt, fn);
}

} // namespace facebook::react
