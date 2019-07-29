/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "SampleTurboCxxModule.h"

#import <ReactCommon/TurboModuleUtils.h>

using namespace facebook;

namespace facebook {
namespace react {

SampleTurboCxxModule::SampleTurboCxxModule(
    std::shared_ptr<JSCallInvoker> jsInvoker)
    : NativeSampleTurboCxxModuleSpecJSI(jsInvoker) {}

void SampleTurboCxxModule::voidFunc(jsi::Runtime &rt) {
  // Nothing to do
}

bool SampleTurboCxxModule::getBool(jsi::Runtime &rt, bool arg) {
  return arg;
}

double SampleTurboCxxModule::getNumber(jsi::Runtime &rt, double arg) {
  return arg;
}

jsi::String SampleTurboCxxModule::getString(
    jsi::Runtime &rt,
    const jsi::String &arg) {
  return jsi::String::createFromUtf8(rt, arg.utf8(rt));
}

jsi::Array SampleTurboCxxModule::getArray(
    jsi::Runtime &rt,
    const jsi::Array &arg) {
  return deepCopyJSIArray(rt, arg);
}

jsi::Object SampleTurboCxxModule::getObject(
    jsi::Runtime &rt,
    const jsi::Object &arg) {
  return deepCopyJSIObject(rt, arg);
}

jsi::Object SampleTurboCxxModule::getValue(
    jsi::Runtime &rt,
    double x,
    const jsi::String &y,
    const jsi::Object &z) {
  // Note: return type isn't type-safe.
  jsi::Object result(rt);
  result.setProperty(rt, "x", jsi::Value(x));
  result.setProperty(rt, "y", jsi::String::createFromUtf8(rt, y.utf8(rt)));
  result.setProperty(rt, "z", deepCopyJSIObject(rt, z));
  return result;
}

void SampleTurboCxxModule::getValueWithCallback(
    jsi::Runtime &rt,
    const jsi::Function &callback) {
  callback.call(rt, jsi::String::createFromUtf8(rt, "value from callback!"));
}

jsi::Value SampleTurboCxxModule::getValueWithPromise(
    jsi::Runtime &rt,
    bool error) {
  return createPromiseAsJSIValue(
      rt, [error](jsi::Runtime &rt2, std::shared_ptr<Promise> promise) {
        if (error) {
          promise->reject("intentional promise rejection");
        } else {
          promise->resolve(jsi::String::createFromUtf8(rt2, "result!"));
        }
      });
}

jsi::Object SampleTurboCxxModule::getConstants(jsi::Runtime &rt) {
  // Note: return type isn't type-safe.
  jsi::Object result(rt);
  result.setProperty(rt, "const1", jsi::Value(true));
  result.setProperty(rt, "const2", jsi::Value(375));
  result.setProperty(
      rt, "const3", jsi::String::createFromUtf8(rt, "something"));
  return result;
}

} // namespace react
} // namespace facebook
