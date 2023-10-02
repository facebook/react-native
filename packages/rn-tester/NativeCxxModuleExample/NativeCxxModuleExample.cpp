/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeCxxModuleExample.h"
#include <react/debug/react_native_assert.h>

namespace facebook::react {

NativeCxxModuleExample::NativeCxxModuleExample(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeCxxModuleExampleCxxSpec(std::move(jsInvoker)) {}

void NativeCxxModuleExample::getValueWithCallback(
    jsi::Runtime& rt,
    AsyncCallback<std::string> callback) {
  callback({"value from callback!"});
}

std::vector<std::optional<ObjectStruct>> NativeCxxModuleExample::getArray(
    jsi::Runtime& rt,
    std::vector<std::optional<ObjectStruct>> arg) {
  return arg;
}

bool NativeCxxModuleExample::getBool(jsi::Runtime& rt, bool arg) {
  return arg;
}

ConstantsStruct NativeCxxModuleExample::getConstants(jsi::Runtime& rt) {
  return ConstantsStruct{true, 69, "react-native"};
}

CustomEnumInt NativeCxxModuleExample::getCustomEnum(
    jsi::Runtime& rt,
    CustomEnumInt arg) {
  return arg;
}

std::shared_ptr<CustomHostObject> NativeCxxModuleExample::getCustomHostObject(
    jsi::Runtime& rt) {
  return std::make_shared<CustomHostObject>(
      std::make_shared<CustomHostObjectRef>("answer", 42));
}

std::string NativeCxxModuleExample::consumeCustomHostObject(
    jsi::Runtime& rt,
    std::shared_ptr<CustomHostObject> arg) {
  auto value = arg->getValue();
  return value->a_ + std::to_string(value->b_);
}

NativeCxxModuleExampleCxxEnumFloat NativeCxxModuleExample::getNumEnum(
    jsi::Runtime& rt,
    NativeCxxModuleExampleCxxEnumInt arg) {
  return NativeCxxModuleExampleCxxEnumFloat::FB;
}

NativeCxxModuleExampleCxxEnumStr NativeCxxModuleExample::getStrEnum(
    jsi::Runtime& rt,
    NativeCxxModuleExampleCxxEnumNone arg) {
  return NativeCxxModuleExampleCxxEnumStr::SB;
}

std::map<std::string, std::optional<int32_t>> NativeCxxModuleExample::getMap(
    jsi::Runtime& rt,
    std::map<std::string, std::optional<int32_t>> arg) {
  return arg;
}

double NativeCxxModuleExample::getNumber(jsi::Runtime& rt, double arg) {
  return arg;
}

ObjectStruct NativeCxxModuleExample::getObject(
    jsi::Runtime& rt,
    ObjectStruct arg) {
  return arg;
}

std::set<float> NativeCxxModuleExample::getSet(
    jsi::Runtime& rt,
    std::set<float> arg) {
  return arg;
}

std::string NativeCxxModuleExample::getString(
    jsi::Runtime& rt,
    std::string arg) {
  return arg;
}

std::string NativeCxxModuleExample::getUnion(
    jsi::Runtime& rt,
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
    jsi::Runtime& rt,
    double x,
    std::string y,
    ObjectStruct z) {
  ValueStruct result{x, y, z};
  return result;
}

AsyncPromise<std::string> NativeCxxModuleExample::getValueWithPromise(
    jsi::Runtime& rt,
    bool error) {
  auto promise = AsyncPromise<std::string>(rt, jsInvoker_);
  if (error) {
    promise.reject("intentional promise rejection");
  } else {
    promise.resolve("result!");
  }
  return promise;
}

std::optional<bool> NativeCxxModuleExample::getWithWithOptionalArgs(
    jsi::Runtime& rt,
    std::optional<bool> optionalArg) {
  return optionalArg;
}

void NativeCxxModuleExample::voidFunc(jsi::Runtime& rt) {
  // Nothing to do
}

void NativeCxxModuleExample::emitCustomDeviceEvent(
    jsi::Runtime& rt,
    jsi::String eventName) {
  // Test emitting device events (RCTDeviceEventEmitter.emit) from C++
  // TurboModule with arbitrary arguments
  emitDeviceEvent(
      rt,
      eventName.utf8(rt).c_str(),
      [](jsi::Runtime& rt, std::vector<jsi::Value>& args) {
        args.emplace_back(jsi::Value(true));
        args.emplace_back(jsi::Value(42));
        args.emplace_back(jsi::String::createFromAscii(rt, "stringArg"));
      });
}

void NativeCxxModuleExample::voidFuncThrows(jsi::Runtime& rt) {
  throw std::runtime_error("Intentional exception from Cxx voidFuncThrows");
};

ObjectStruct NativeCxxModuleExample::getObjectThrows(
    jsi::Runtime& rt,
    ObjectStruct arg) {
  throw std::runtime_error("Intentional exception from Cxx getObjectThrows");
};

AsyncPromise<jsi::Value> NativeCxxModuleExample::promiseThrows(
    jsi::Runtime& rt) {
  throw std::runtime_error("Intentional exception from Cxx promiseThrows");
};

void NativeCxxModuleExample::voidFuncAssert(jsi::Runtime& rt) {
  react_native_assert(false && "Intentional assert from Cxx voidFuncAssert");
};

ObjectStruct NativeCxxModuleExample::getObjectAssert(
    jsi::Runtime& rt,
    ObjectStruct arg) {
  react_native_assert(false && "Intentional assert from Cxx getObjectAssert");

  // Asserts disabled
  return {};
};

AsyncPromise<jsi::Value> NativeCxxModuleExample::promiseAssert(
    jsi::Runtime& rt) {
  react_native_assert(false && "Intentional assert from Cxx promiseAssert");

  // Asserts disabled
  auto promise = AsyncPromise<jsi::Value>(rt, jsInvoker_);
  promise.reject("Asserts disabled");
  return promise;
};

} // namespace facebook::react
