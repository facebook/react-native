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
#include <set>
#include <string>
#include <vector>

namespace facebook::react {

#pragma mark - Structs
using ConstantsStruct =
    NativeCxxModuleExampleCxxBaseConstantsStruct<bool, int32_t, std::string>;

template <>
struct Bridging<ConstantsStruct>
    : NativeCxxModuleExampleCxxBaseConstantsStructBridging<
          bool,
          int32_t,
          std::string> {};

using ObjectStruct = NativeCxxModuleExampleCxxBaseObjectStruct<
    int32_t,
    std::string,
    std::optional<std::string>>;

template <>
struct Bridging<ObjectStruct>
    : NativeCxxModuleExampleCxxBaseObjectStructBridging<
          int32_t,
          std::string,
          std::optional<std::string>> {};

using ValueStruct =
    NativeCxxModuleExampleCxxBaseValueStruct<double, std::string, ObjectStruct>;

template <>
struct Bridging<ValueStruct> : NativeCxxModuleExampleCxxBaseValueStructBridging<
                                   double,
                                   std::string,
                                   ObjectStruct> {};

#pragma mark - implementation
class NativeCxxModuleExample
    : public NativeCxxModuleExampleCxxSpec<NativeCxxModuleExample> {
 public:
  NativeCxxModuleExample(std::shared_ptr<CallInvoker> jsInvoker);

  void getValueWithCallback(
      jsi::Runtime &rt,
      AsyncCallback<std::string> callback);

  std::vector<std::optional<ObjectStruct>> getArray(
      jsi::Runtime &rt,
      std::vector<std::optional<ObjectStruct>> arg);

  bool getBool(jsi::Runtime &rt, bool arg);

  ConstantsStruct getConstants(jsi::Runtime &rt);

  int32_t getEnum(jsi::Runtime &rt, int32_t arg);

  std::map<std::string, std::optional<int32_t>> getMap(
      jsi::Runtime &rt,
      std::map<std::string, std::optional<int32_t>> arg);

  double getNumber(jsi::Runtime &rt, double arg);

  ObjectStruct getObject(jsi::Runtime &rt, ObjectStruct arg);

  std::set<float> getSet(jsi::Runtime &rt, std::set<float> arg);

  std::string getString(jsi::Runtime &rt, std::string arg);

  std::string getUnion(jsi::Runtime &rt, float x, std::string y, jsi::Object z);

  ValueStruct
  getValue(jsi::Runtime &rt, double x, std::string y, ObjectStruct z);

  AsyncPromise<std::string> getValueWithPromise(jsi::Runtime &rt, bool error);

  void voidFunc(jsi::Runtime &rt);
};

} // namespace facebook::react
