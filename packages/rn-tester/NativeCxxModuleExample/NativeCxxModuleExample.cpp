/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeCxxModuleExample.h"

namespace facebook::react {

NativeCxxModuleExample::NativeCxxModuleExample(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeCxxModuleExampleCxxSpec(std::move(jsInvoker)) {}

void NativeCxxModuleExample::getValueWithCallback(
    jsi::Runtime &rt,
    AsyncCallback<std::string> callback) {
  callback({"value from callback!"});
}

std::vector<std::optional<ObjectStruct>> NativeCxxModuleExample::getArray(
    jsi::Runtime &rt,
    std::vector<std::optional<ObjectStruct>> arg) {
  return arg;
}

bool NativeCxxModuleExample::getBool(jsi::Runtime &rt, bool arg) {
  return arg;
}

ConstantsStruct NativeCxxModuleExample::getConstants(jsi::Runtime &rt) {
  return ConstantsStruct{true, 69, "react-native"};
}

EnumInt NativeCxxModuleExample::getEnum(jsi::Runtime &rt, EnumInt arg) {
  return arg;
}

std::map<std::string, std::optional<int32_t>> NativeCxxModuleExample::getMap(
    jsi::Runtime &rt,
    std::map<std::string, std::optional<int32_t>> arg) {
  return arg;
}

double NativeCxxModuleExample::getNumber(jsi::Runtime &rt, double arg) {
  return arg;
}

ObjectStruct NativeCxxModuleExample::getObject(
    jsi::Runtime &rt,
    ObjectStruct arg) {
  return arg;
}

std::set<float> NativeCxxModuleExample::getSet(
    jsi::Runtime &rt,
    std::set<float> arg) {
  return arg;
}

std::string NativeCxxModuleExample::getString(
    jsi::Runtime &rt,
    std::string arg) {
  return arg;
}

std::string NativeCxxModuleExample::getUnion(
    jsi::Runtime &rt,
    float x,
    std::string y,
    jsi::Object z) {
  std::string result = "x: " + std::to_string(x) + ", y: " + y + ", z: { ";
  if (z.hasProperty(rt, "value")) {
    result += "value: ";
    result += std::to_string(z.getProperty(rt, "value").getNumber());
  } else if (z.hasProperty(rt, "low")) {
    result += "low: ";
    result += z.getProperty(rt, "low").getString(rt).utf8(rt);
  }
  result += " }";
  return result;
}

ValueStruct NativeCxxModuleExample::getValue(
    jsi::Runtime &rt,
    double x,
    std::string y,
    ObjectStruct z) {
  ValueStruct result{x, y, z};
  return result;
}

AsyncPromise<std::string> NativeCxxModuleExample::getValueWithPromise(
    jsi::Runtime &rt,
    bool error) {
  auto promise = AsyncPromise<std::string>(rt, jsInvoker_);
  if (error) {
    promise.reject("intentional promise rejection");
  } else {
    promise.resolve("result!");
  }
  return promise;
}

void NativeCxxModuleExample::voidFunc(jsi::Runtime &rt) {
  // Nothing to do
}

} // namespace facebook::react
