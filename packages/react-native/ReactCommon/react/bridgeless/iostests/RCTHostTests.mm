/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <RCTTestUtils/ShimRCTInstance.h>
#import <ReactCommon/RCTHermesInstance.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTInstance.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#import <OCMock/OCMock.h>

@interface RCTHostTests : XCTestCase
@end

@implementation RCTHostTests {
  RCTHost *_subject;
  id<RCTHostDelegate> _mockHostDelegate;
}

static ShimRCTInstance *shimmedRCTInstance;

- (void)setUp
{
  [super setUp];

  shimmedRCTInstance = [ShimRCTInstance new];

  _mockHostDelegate = OCMProtocolMock(@protocol(RCTHostDelegate));
  _subject = [[RCTHost alloc] initWithBundleURL:OCMClassMock([NSURL class])
                                   hostDelegate:_mockHostDelegate
                     turboModuleManagerDelegate:OCMProtocolMock(@protocol(RCTTurboModuleManagerDelegate))
                               jsEngineProvider:^std::shared_ptr<facebook::react::JSEngineInstance>() {
                                 return std::make_shared<facebook::react::RCTHermesInstance>();
                               }];
}

- (void)testStart
{
  [_subject start];
  OCMVerify(OCMTimes(1), [_mockHostDelegate hostDidStart:_subject]);
}

@end
