/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <ReactCommon/RCTTurboModule.h>
#import <hermes/hermes.h>

#import <OCMock/OCMock.h>

using namespace facebook::react;

@protocol RCTTestTurboModule <RCTBridgeModule, RCTTurboModule>

- (void)testMethodWhichTakesObject:(id)object;

@end

class StubNativeMethodCallInvoker : public NativeMethodCallInvoker {
 public:
  void invokeAsync(const std::string &methodName, NativeMethodCallFunc &&func) noexcept override
  {
    func();
  }
  void invokeSync(const std::string &methodName, NativeMethodCallFunc &&func) noexcept override
  {
    func();
  }
};

@interface RCTTurboModuleTests : XCTestCase
@end

@implementation RCTTurboModuleTests {
  std::unique_ptr<ObjCTurboModule> module_;
  id<RCTTestTurboModule> instance_;
}

- (void)setUp
{
  [super setUp];
  instance_ = OCMProtocolMock(@protocol(RCTTestTurboModule));

  ObjCTurboModule::InitParams params = {
      .moduleName = "TestModule",
      .instance = instance_,
      .jsInvoker = nullptr,
      .nativeMethodCallInvoker = std::make_shared<StubNativeMethodCallInvoker>(),
      .isSyncModule = false,
      .shouldVoidMethodsExecuteSync = true,
  };
  module_ = std::make_unique<ObjCTurboModule>(params);
}

- (void)tearDown
{
  module_ = nullptr;
  instance_ = nil;

  [super tearDown];
}

- (void)testInvokeTurboModuleWithNull
{
  auto hermesRuntime = facebook::hermes::makeHermesRuntime();
  facebook::jsi::Runtime *rt = hermesRuntime.get();

  // Empty object
  facebook::jsi::Value args[1] = {facebook::jsi::Object(*rt)};
  module_->invokeObjCMethod(
      *rt, VoidKind, "testMethodWhichTakesObject", @selector(testMethodWhichTakesObject:), args, 1);
  OCMVerify(OCMTimes(1), [instance_ testMethodWhichTakesObject:@{}]);

  // Object with one key
  args[0].asObject(*rt).setProperty(*rt, "foo", "bar");
  module_->invokeObjCMethod(
      *rt, VoidKind, "testMethodWhichTakesObject", @selector(testMethodWhichTakesObject:), args, 1);
  OCMVerify(OCMTimes(1), [instance_ testMethodWhichTakesObject:@{@"foo" : @"bar"}]);

  // Object with key without value
  args[0].asObject(*rt).setProperty(*rt, "foo", "facebook::jsi::Value::undefined()");
  module_->invokeObjCMethod(
      *rt, VoidKind, "testMethodWhichTakesObject", @selector(testMethodWhichTakesObject:), args, 1);
  // FIXME this should be called with @{@"foo": kCFNull}
  OCMVerify(OCMTimes(1), [instance_ testMethodWhichTakesObject:@{}]);

  // Null
  args[0] = facebook::jsi::Value::null();
  module_->invokeObjCMethod(
      *rt, VoidKind, "testMethodWhichTakesObject", @selector(testMethodWhichTakesObject:), args, 1);
  OCMVerify(OCMTimes(1), [instance_ testMethodWhichTakesObject:nil]);
}

@end
