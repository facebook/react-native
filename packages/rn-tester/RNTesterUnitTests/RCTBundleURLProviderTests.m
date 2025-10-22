/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTBundleURLProvider.h>
#import <React/RCTConstants.h>
#import <React/RCTUtils.h>

#import "OCMock/OCMock.h"

static NSString *const testFile = @"test.jsbundle";
static NSString *const mainBundle = @"main.jsbundle";

static NSURL *mainBundleURL(void)
{
  return [[[NSBundle mainBundle] bundleURL] URLByAppendingPathComponent:mainBundle];
}

static NSURL *localhostBundleURL(void)
{
  return [NSURL
      URLWithString:
          [NSString
              stringWithFormat:
                  @"http://localhost:8081/%@.bundle?platform=%@&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.apple.dt.xctest.tool",
                  testFile,
                  RCTPlatformName]];
}

static NSURL *ipBundleURL(void)
{
  return [NSURL
      URLWithString:
          [NSString
              stringWithFormat:
                  @"http://192.168.1.1:8081/%@.bundle?platform=%@&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.apple.dt.xctest.tool",
                  testFile,
                  RCTPlatformName]];
}

@implementation NSBundle (RCTBundleURLProviderTests)

- (NSURL *)RCT_URLForResource:(NSString *)name withExtension:(NSString *)ext
{
  // Ensure that test files is always reported as existing
  if ([[name stringByAppendingFormat:@".%@", ext] isEqualToString:mainBundle]) {
    return [[self bundleURL] URLByAppendingPathComponent:mainBundle];
  }
  return [self RCT_URLForResource:name withExtension:ext];
}

@end

@interface RCTBundleURLProviderTests : XCTestCase
@end

@implementation RCTBundleURLProviderTests

- (void)setUp
{
  [super setUp];

  RCTSwapInstanceMethods(
      [NSBundle class], @selector(URLForResource:withExtension:), @selector(RCT_URLForResource:withExtension:));
}

- (void)tearDown
{
  RCTSwapInstanceMethods(
      [NSBundle class], @selector(URLForResource:withExtension:), @selector(RCT_URLForResource:withExtension:));

  [super tearDown];
}

- (void)testBundleURL
{
  RCTBundleURLProvider *settings = [RCTBundleURLProvider sharedSettings];
  settings.jsLocation = nil;
  NSURL *URL = [settings jsBundleURLForBundleRoot:testFile];
  if (!getenv("CI_USE_PACKAGER")) {
    XCTAssertEqualObjects(URL, mainBundleURL());
  } else {
    XCTAssertEqualObjects(URL, localhostBundleURL());
  }
}

- (void)testLocalhostURL
{
  id classMock = OCMClassMock([RCTBundleURLProvider class]);
  [[[classMock stub] andReturnValue:@YES] isPackagerRunning:[OCMArg any] scheme:[OCMArg any]];
  RCTBundleURLProvider *settings = [RCTBundleURLProvider sharedSettings];
  settings.jsLocation = @"localhost";
  NSURL *URL = [settings jsBundleURLForBundleRoot:testFile];
  XCTAssertEqualObjects(URL, localhostBundleURL());
}

- (void)testIPURL
{
  id classMock = OCMClassMock([RCTBundleURLProvider class]);
  [[[classMock stub] andReturnValue:@YES] isPackagerRunning:[OCMArg any] scheme:[OCMArg any]];
  RCTBundleURLProvider *settings = [RCTBundleURLProvider sharedSettings];
  settings.jsLocation = @"192.168.1.1";
  NSURL *URL = [settings jsBundleURLForBundleRoot:testFile];
  XCTAssertEqualObjects(URL, ipBundleURL());
}

@end
