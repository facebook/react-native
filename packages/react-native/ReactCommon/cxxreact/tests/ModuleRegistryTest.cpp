/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cxxreact/ModuleRegistry.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

#include <cxxreact/NativeModule.h>
#include <folly/dynamic.h>
#include <gtest/gtest.h>
#include <string>
#include <vector>

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"

namespace facebook::react {

namespace {

// A stub NativeModule that allows configuring name, constants, and methods
// for testing ModuleRegistry behavior.
class StubNativeModule : public NativeModule {
 public:
  explicit StubNativeModule(
      std::string name,
      folly::dynamic constants = folly::dynamic::object(),
      std::vector<MethodDescriptor> methods = {})
      : name_(std::move(name)),
        constants_(std::move(constants)),
        methods_(std::move(methods)) {}

  std::string getName() override {
    return name_;
  }

  std::string getSyncMethodName(unsigned int /*methodId*/) override {
    return "";
  }

  std::vector<MethodDescriptor> getMethods() override {
    return methods_;
  }

  folly::dynamic getConstants() override {
    return constants_;
  }

  void invoke(unsigned int reactMethodId, folly::dynamic&& params, int callId)
      override {
    lastInvokedMethodId_ = reactMethodId;
    lastInvokedParams_ = std::move(params);
    lastCallId_ = callId;
  }

  MethodCallResult callSerializableNativeHook(
      unsigned int reactMethodId,
      folly::dynamic&& args) override {
    lastInvokedMethodId_ = reactMethodId;
    lastInvokedParams_ = std::move(args);
    return folly::dynamic("hook_result");
  }

  unsigned int lastInvokedMethodId_ = 0;
  folly::dynamic lastInvokedParams_;
  int lastCallId_ = -1;

 private:
  std::string name_;
  folly::dynamic constants_;
  std::vector<MethodDescriptor> methods_;
};

std::unique_ptr<NativeModule> makeModule(
    std::string name,
    folly::dynamic constants = folly::dynamic::object(),
    std::vector<MethodDescriptor> methods = {}) {
  return std::make_unique<StubNativeModule>(
      std::move(name), std::move(constants), std::move(methods));
}

} // namespace

class ModuleRegistryTest : public ::testing::Test {};

// Tests getConfig's core logic: name normalization (RCT/RK prefix stripping),
// config structure with constants and categorized method IDs (promise vs sync),
// and the optimization that returns nullopt for modules with no useful config.
// Bug caught: If name normalization or method categorization is broken, JS
// bridge would fail to find modules or dispatch calls to wrong method types.
TEST_F(ModuleRegistryTest, testGetConfigNormalizesNamesAndCategorizesMethods) {
  std::vector<MethodDescriptor> methods;
  methods.emplace_back("fetchData", "async");
  methods.emplace_back("getData", "promise");
  methods.emplace_back("getDataSync", "sync");

  std::vector<std::unique_ptr<NativeModule>> modules;
  modules.push_back(makeModule(
      "RCTTestModule",
      folly::dynamic::object("timeout", 30),
      std::move(methods)));
  modules.push_back(makeModule("RKEmptyModule"));
  modules.push_back(makeModule("PlainModule"));

  ModuleRegistry registry(std::move(modules));

  // Verify name normalization: RCT prefix stripped
  auto names = registry.moduleNames();
  ASSERT_EQ(3u, names.size());
  EXPECT_EQ("TestModule", names[0]);
  EXPECT_EQ("EmptyModule", names[1]);
  EXPECT_EQ("PlainModule", names[2]);

  // Verify getConfig returns properly structured config with categorized
  // methods
  auto config = registry.getConfig("TestModule");
  ASSERT_TRUE(config.has_value());
  EXPECT_EQ(0u, config->index);

  auto& configArray = config->config;
  // config = [name, constants, methodNames, promiseMethodIds, syncMethodIds]
  ASSERT_EQ(5u, configArray.size());
  EXPECT_EQ("TestModule", configArray[0].asString());
  EXPECT_EQ(30, configArray[1]["timeout"].asInt());

  auto& methodNames = configArray[2];
  ASSERT_EQ(3u, methodNames.size());
  EXPECT_EQ("fetchData", methodNames[0].asString());
  EXPECT_EQ("getData", methodNames[1].asString());
  EXPECT_EQ("getDataSync", methodNames[2].asString());

  // Promise method IDs: getData is at index 1
  ASSERT_EQ(1u, configArray[3].size());
  EXPECT_EQ(1, configArray[3][0].asInt());

  // Sync method IDs: getDataSync is at index 2
  ASSERT_EQ(1u, configArray[4].size());
  EXPECT_EQ(2, configArray[4][0].asInt());

  // Empty module (no constants, no methods) returns nullopt
  auto emptyConfig = registry.getConfig("EmptyModule");
  EXPECT_FALSE(emptyConfig.has_value());
}

// Tests error handling: registerModules throws when a previously-unknown module
// is registered, callNativeMethod/callSerializableNativeHook throw on out-of-
// range moduleId, and the moduleNotFoundCallback is invoked for missing
// modules. Also verifies that valid calls correctly delegate to the underlying
// module. Bug caught: If bounds checking is removed, out-of-range moduleId
// causes UB. If the unknown-module check is removed, late registration causes
// inconsistency.
TEST_F(ModuleRegistryTest, testErrorHandlingAndDelegation) {
  std::vector<std::unique_ptr<NativeModule>> modules;
  auto* rawPtr = new StubNativeModule("Module0");
  modules.emplace_back(rawPtr);
  modules.push_back(
      makeModule("ExistingModule", folly::dynamic::object("k", 1)));

  bool callbackInvoked = false;
  std::string callbackRequestedName;

  ModuleRegistry registry(
      std::move(modules), [&](const std::string& name) -> bool {
        callbackInvoked = true;
        callbackRequestedName = name;
        return false; // Module not found by callback
      });

  // Out-of-range moduleId should throw for all call methods
  EXPECT_THROW(
      registry.callNativeMethod(99, 0, folly::dynamic::array(), 0),
      std::runtime_error);
  EXPECT_THROW(
      registry.callSerializableNativeHook(99, 0, folly::dynamic::array()),
      std::runtime_error);
  EXPECT_THROW(registry.getModuleName(99), std::runtime_error);

  // Valid callNativeMethod should delegate to the correct module
  auto params = folly::dynamic::array("arg1", 42);
  registry.callNativeMethod(0, 5, std::move(params), 123);
  EXPECT_EQ(5u, rawPtr->lastInvokedMethodId_);
  EXPECT_EQ(123, rawPtr->lastCallId_);
  EXPECT_EQ("arg1", rawPtr->lastInvokedParams_[0].asString());

  // callSerializableNativeHook should return the module's result
  auto hookResult = registry.callSerializableNativeHook(
      0, 3, folly::dynamic::array("hookArg"));
  ASSERT_TRUE(hookResult.has_value());
  EXPECT_EQ("hook_result", hookResult->asString());

  // getConfig for unknown module invokes the callback
  auto missingConfig = registry.getConfig("NonExistent");
  EXPECT_FALSE(missingConfig.has_value());
  EXPECT_TRUE(callbackInvoked);
  EXPECT_EQ("NonExistent", callbackRequestedName);

  // Registering a module that was previously requested (and marked unknown)
  // should throw to prevent inconsistent state
  std::vector<std::unique_ptr<NativeModule>> lateModules;
  lateModules.push_back(makeModule("NonExistent"));
  EXPECT_THROW(
      registry.registerModules(std::move(lateModules)), std::runtime_error);
}

} // namespace facebook::react

#pragma GCC diagnostic pop

#endif // RCT_REMOVE_LEGACY_ARCH
