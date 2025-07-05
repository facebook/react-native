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

std::function<void()> NativeCxxModuleExample::setValueCallbackWithSubscription(
    jsi::Runtime& rt,
    AsyncCallback<std::string> callback) {
  valueCallback_ = std::make_optional(callback);
  return [&]() {
    if (valueCallback_.has_value()) {
      valueCallback_.value()({"value from callback on clean up!"});
      valueCallback_ = std::nullopt;
    }
  };
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

BinaryTreeNode NativeCxxModuleExample::getBinaryTreeNode(
    jsi::Runtime& rt,
    BinaryTreeNode arg) {
  return arg;
}

GraphNode NativeCxxModuleExample::getGraphNode(
    jsi::Runtime& rt,
    GraphNode arg) {
  if (arg.neighbors) {
    arg.neighbors->emplace_back(GraphNode{.label = "top"});
    arg.neighbors->emplace_back(GraphNode{.label = "down"});
  }
  return arg;
}

NativeCxxModuleExampleEnumInt NativeCxxModuleExample::getNumEnum(
    jsi::Runtime& rt,
    NativeCxxModuleExampleEnumInt arg) {
  return arg;
}

NativeCxxModuleExampleEnumStr NativeCxxModuleExample::getStrEnum(
    jsi::Runtime& rt,
    NativeCxxModuleExampleEnumNone /*arg*/) {
  return NativeCxxModuleExampleEnumStr::SB;
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
  // Emit some events
  emitOnPress();
  emitOnClick<std::string>("value from callback on click!");
  emitOnChange(ObjectStruct{1, "two", std::nullopt});
  emitOnSubmit(std::vector{
      ObjectStruct{1, "two", std::nullopt},
      ObjectStruct{3, "four", std::nullopt},
      ObjectStruct{5, "six", std::nullopt}});
  emitOnEvent(NativeCxxModuleExampleEnumNone::NA);
}

AsyncPromise<> NativeCxxModuleExample::voidPromise(jsi::Runtime& rt) {
  AsyncPromise<> promise(rt, jsInvoker_);
  promise.resolve();
  return promise;
}

void NativeCxxModuleExample::setMenu(jsi::Runtime& rt, MenuItem menuItem) {
  menuItem.onPress("value", true);
  if (menuItem.items) {
    for (auto subMenuItem : *menuItem.items) {
      subMenuItem.onPress("another value", false);
    }
  }
}

void NativeCxxModuleExample::emitCustomDeviceEvent(
    jsi::Runtime& rt,
    const std::string& eventName) {
  // Test emitting device events (RCTDeviceEventEmitter.emit) from C++
  // TurboModule with arbitrary arguments. This can be called from any thread
  emitDeviceEvent(
      eventName,
      [jsInvoker = jsInvoker_](
          jsi::Runtime& rt, std::vector<jsi::Value>& args) {
        args.emplace_back(jsi::Value(true));
        args.emplace_back(jsi::Value(42));
        args.emplace_back(jsi::String::createFromAscii(rt, "stringArg"));
        args.emplace_back(bridging::toJs(
            rt, CustomDeviceEvent{"one", 2, std::nullopt}, jsInvoker));
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

AsyncPromise<> NativeCxxModuleExample::promiseThrows(jsi::Runtime& rt) {
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

AsyncPromise<> NativeCxxModuleExample::promiseAssert(jsi::Runtime& rt) {
  react_native_assert(false && "Intentional assert from Cxx promiseAssert");

  // Asserts disabled
  auto promise = AsyncPromise<>(rt, jsInvoker_);
  promise.reject("Asserts disabled");
  return promise;
};

} // namespace facebook::react
