/*
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

#import <XCTest/XCTest.h>

#import <React/RCTBridgeModule.h>
#import "MockInstance.hpp"
#import "SampleCxxModule.hpp"

@interface MockInstanceTests : XCTestCase

@end

@implementation MockInstanceTests

- (void)setUp {
  [super setUp];
}

- (void)tearDown {
  [super tearDown];
}

- (void)testMockCallJSFunction {
  auto cache = std::make_shared<vector<int64_t>>();
  auto instance = std::make_shared<MockInstance>(cache);
  auto module = std::make_unique<SampleCxxModule>();

  module->setInstance(instance);

  auto sumMethod = module->getMethods()[0]; // First method: 'sum'.
  sumMethod.func(dynamic::array(2, 3), [](vector<dynamic>){}, [](vector<dynamic>){}); // 5

  int64_t result = cache->front();
  XCTAssert(result == 5); // 2 + 3
}

@end
