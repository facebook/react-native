/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if __has_include(<React-Codegen/AppSpecsJSI.h>) // CocoaPod headers on Apple
#include <React-Codegen/AppSpecsJSI.h>
#elif __has_include("AppSpecsJSI.h") // Cmake headers on Android
#include "AppSpecsJSI.h"
#else // BUCK headers
#include <AppSpecs/AppSpecsJSI.h>
#endif
#include <memory>
#include <optional>
#include <set>
#include <string>
#include <vector>

namespace facebook::react {

#pragma mark - Structs
using ConstantsStruct =
    NativeCxxModuleExampleCxxConstantsStruct<bool, int32_t, std::string>;

template <>
struct Bridging<ConstantsStruct>
    : NativeCxxModuleExampleCxxConstantsStructBridging<ConstantsStruct> {};

using ObjectStruct = NativeCxxModuleExampleCxxObjectStruct<
    int32_t,
    std::string,
    std::optional<std::string>>;

template <>
struct Bridging<ObjectStruct>
    : NativeCxxModuleExampleCxxObjectStructBridging<ObjectStruct> {};

using ValueStruct =
    NativeCxxModuleExampleCxxValueStruct<double, std::string, ObjectStruct>;

template <>
struct Bridging<ValueStruct>
    : NativeCxxModuleExampleCxxValueStructBridging<ValueStruct> {};

#pragma mark - enums
enum CustomEnumInt { A = 23, B = 42 };

template <>
struct Bridging<CustomEnumInt> {
  static CustomEnumInt fromJs(jsi::Runtime& rt, int32_t value) {
    if (value == 23) {
      return CustomEnumInt::A;
    } else if (value == 42) {
      return CustomEnumInt::B;
    } else {
      throw jsi::JSError(rt, "Invalid enum value");
    }
  }

  static jsi::Value toJs(jsi::Runtime& rt, CustomEnumInt value) {
    return bridging::toJs(rt, static_cast<int32_t>(value));
  }
};

#pragma mark - jsi::HostObjects
template <typename T>
class HostObjectWrapper : public jsi::HostObject {
 public:
  HostObjectWrapper(std::shared_ptr<T> value) : value_(std::move(value)) {}

  std::shared_ptr<T> getValue() const {
    return value_;
  }

  ~HostObjectWrapper() override = default;

 private:
  std::shared_ptr<T> value_;
};

struct CustomHostObjectRef {
  CustomHostObjectRef(std::string a, int32_t b) : a_(a), b_(b) {}
  std::string a_;
  int32_t b_;
};

using CustomHostObject = HostObjectWrapper<CustomHostObjectRef>;

#pragma mark - recursive objects
struct BinaryTreeNode {
  std::unique_ptr<BinaryTreeNode> left;
  int32_t value;
  std::unique_ptr<BinaryTreeNode> right;
};

template <>
struct Bridging<BinaryTreeNode> {
  static BinaryTreeNode fromJs(
      jsi::Runtime& rt,
      const jsi::Object& value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    BinaryTreeNode result{
        value.hasProperty(rt, "left")
            ? std::make_unique<BinaryTreeNode>(bridging::fromJs<BinaryTreeNode>(
                  rt, value.getProperty(rt, "left"), jsInvoker))
            : nullptr,
        bridging::fromJs<int32_t>(
            rt, value.getProperty(rt, "value"), jsInvoker),
        value.hasProperty(rt, "right")
            ? std::make_unique<BinaryTreeNode>(bridging::fromJs<BinaryTreeNode>(
                  rt, value.getProperty(rt, "right"), jsInvoker))
            : nullptr};
    return result;
  }

  static jsi::Object toJs(
      jsi::Runtime& rt,
      const BinaryTreeNode& value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    auto result = facebook::jsi::Object(rt);
    if (value.left) {
      result.setProperty(
          rt, "left", bridging::toJs(rt, *value.left, jsInvoker));
    }
    result.setProperty(rt, "value", bridging::toJs(rt, value.value, jsInvoker));
    if (value.right) {
      result.setProperty(
          rt, "right", bridging::toJs(rt, *value.right, jsInvoker));
    }
    return result;
  }
};

struct GraphNode {
  std::string label;
  std::optional<std::vector<GraphNode>> neighbors;
};

template <>
struct Bridging<GraphNode> {
  static GraphNode fromJs(
      jsi::Runtime& rt,
      const jsi::Object& value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    GraphNode result{
        bridging::fromJs<std::string>(
            rt, value.getProperty(rt, "label"), jsInvoker),
        bridging::fromJs<std::optional<std::vector<GraphNode>>>(
            rt, value.getProperty(rt, "neighbors"), jsInvoker)};
    return result;
  }

  static jsi::Object toJs(
      jsi::Runtime& rt,
      const GraphNode value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    auto result = facebook::jsi::Object(rt);
    result.setProperty(rt, "label", bridging::toJs(rt, value.label, jsInvoker));
    if (value.neighbors) {
      result.setProperty(
          rt,
          "neighbors",
          bridging::toJs(rt, value.neighbors.value(), jsInvoker));
    }
    return result;
  }
};

#pragma mark - implementation
class NativeCxxModuleExample
    : public NativeCxxModuleExampleCxxSpec<NativeCxxModuleExample> {
 public:
  NativeCxxModuleExample(std::shared_ptr<CallInvoker> jsInvoker);

  void getValueWithCallback(
      jsi::Runtime& rt,
      AsyncCallback<std::string> callback);

  std::function<void()> setValueCallbackWithSubscription(
      jsi::Runtime& rt,
      AsyncCallback<std::string> callback);

  std::vector<std::optional<ObjectStruct>> getArray(
      jsi::Runtime& rt,
      std::vector<std::optional<ObjectStruct>> arg);

  bool getBool(jsi::Runtime& rt, bool arg);

  ConstantsStruct getConstants(jsi::Runtime& rt);

  CustomEnumInt getCustomEnum(jsi::Runtime& rt, CustomEnumInt arg);

  std::shared_ptr<CustomHostObject> getCustomHostObject(jsi::Runtime& rt);

  std::string consumeCustomHostObject(
      jsi::Runtime& rt,
      std::shared_ptr<CustomHostObject> arg);

  BinaryTreeNode getBinaryTreeNode(jsi::Runtime& rt, BinaryTreeNode arg);

  GraphNode getGraphNode(jsi::Runtime& rt, GraphNode arg);

  NativeCxxModuleExampleCxxEnumFloat getNumEnum(
      jsi::Runtime& rt,
      NativeCxxModuleExampleCxxEnumInt arg);

  NativeCxxModuleExampleCxxEnumStr getStrEnum(
      jsi::Runtime& rt,
      NativeCxxModuleExampleCxxEnumNone arg);

  std::map<std::string, std::optional<int32_t>> getMap(
      jsi::Runtime& rt,
      std::map<std::string, std::optional<int32_t>> arg);

  double getNumber(jsi::Runtime& rt, double arg);

  ObjectStruct getObject(jsi::Runtime& rt, ObjectStruct arg);

  std::set<float> getSet(jsi::Runtime& rt, std::set<float> arg);

  std::string getString(jsi::Runtime& rt, std::string arg);

  std::string getUnion(jsi::Runtime& rt, float x, std::string y, jsi::Object z);

  ValueStruct
  getValue(jsi::Runtime& rt, double x, std::string y, ObjectStruct z);

  AsyncPromise<std::string> getValueWithPromise(jsi::Runtime& rt, bool error);

  std::optional<bool> getWithWithOptionalArgs(
      jsi::Runtime& rt,
      std::optional<bool> optionalArg);

  void voidFunc(jsi::Runtime& rt);

  void emitCustomDeviceEvent(jsi::Runtime& rt, jsi::String eventName);

  void voidFuncThrows(jsi::Runtime& rt);

  ObjectStruct getObjectThrows(jsi::Runtime& rt, ObjectStruct arg);

  AsyncPromise<jsi::Value> promiseThrows(jsi::Runtime& rt);

  void voidFuncAssert(jsi::Runtime& rt);

  ObjectStruct getObjectAssert(jsi::Runtime& rt, ObjectStruct arg);

  AsyncPromise<jsi::Value> promiseAssert(jsi::Runtime& rt);

 private:
  std::optional<AsyncCallback<std::string>> valueCallback_;
};

} // namespace facebook::react
