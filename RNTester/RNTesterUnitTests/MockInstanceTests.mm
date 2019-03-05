// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import <XCTest/XCTest.h>

#import <React/RCTBridgeModule.h>

#import "MockInstance.hpp"
#import "SampleCxxModule.hpp"

using folly::dynamic;
using std::vector;

@interface MyModule : NSObject <RCTBridgeModule>

@property facebook::react::Instance* instance;

- (instancetype) initWithInstance:(facebook::react::Instance*) instance;

@end

@implementation MyModule

// To export a module named CalendarManager
RCT_EXPORT_MODULE();

- (instancetype) initWithInstance:(facebook::react::Instance *)instance
{
  self = [super init];
  if (self)
  {
    _instance = instance;
  }
  
  return self;
}

RCT_EXPORT_METHOD(sum:(NSInteger)a b:(NSInteger)b)
{
  //_instance->callJSFunction("Calculator", "sum", dynamic::array(a, b));
}

@end

@interface MockInstanceTests : XCTestCase

@end

@implementation MockInstanceTests

- (void)setUp {
    [super setUp];
    // Put setup code here. This method is called before the invocation of each test method in the class.
}

- (void)tearDown {
    // Put teardown code here. This method is called after the invocation of each test method in the class.
    [super tearDown];
}

- (void)testMockCallJSFunction {
  auto cache = std::make_shared<vector<int64_t>>();
  auto instance = std::make_shared<MockInstance>(cache);
//  auto module = std::make_unique<SampleCxxModule>();
//
//  module->setInstance(instance);
//
//  auto sumMethod = module->getMethods()[0]; // First method: 'sum'.
//  sumMethod.func(dynamic::array(2, 3), [](vector<dynamic>){}, [](vector<dynamic>){}); // 5
//
//  int64_t result = cache->front();
//  XCTAssert(result == 5); // 2 + 3
  
//  auto module = std::make_unique<SampleNativeModule>(instance);
//  module->invoke(0, dynamic::array(2, 3), 0);
  
  //auto module = [[MyModule alloc] initWithInstance:instance.get()];
  
  //instance->callJSFunction("mod", "meth", dynamic::array(2,3));

  auto x = folly::dynamic::array(2, 3);

  XCTAssert(true);
}

@end
