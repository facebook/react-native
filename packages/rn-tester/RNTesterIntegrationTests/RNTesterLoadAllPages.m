/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// [macOS]

#import <React/RCTUIKit.h>
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>
#import <React/RCTLog.h>

#import <objc/runtime.h>

@interface RNTesterLoadAllPages : XCTestCase {
  RCTTestRunner *_runner;
  NSString *_testName;
}

@end

@implementation RNTesterLoadAllPages

- (void)setUp
{
  _runner = RCTInitRunnerForApp(@"js/RNTesterApp", nil, nil);
}

- (id)initWithName:(NSString *)testName
{
  // This method for dynamically adding tests borrowed from:
  // https://github.com/google/google-toolbox-for-mac/blob/master/UnitTesting/GTMGoogleTestRunner.mm
  // Xcode 6.1 started taking the testName from the selector instead of calling -name.
  // So we will add selectors to this XCTestCase.
  Class cls = [self class];
  NSString *selectorTestName = testName;
  SEL selector = sel_registerName([selectorTestName UTF8String]);
  Method method = class_getInstanceMethod(cls, @selector(internalTestRunner));
  IMP implementation = method_getImplementation(method);
  const char *encoding = method_getTypeEncoding(method);
  // We may be called more than once for the same testName. Check before adding new method to avoid
  // failure from adding multiple methods with the same name.
  if (!class_getInstanceMethod(cls, selector) && !class_addMethod(cls, selector, implementation, encoding)) {
    // If we can't add a method, we should blow up here.
    [NSException raise:NSInternalInconsistencyException format:@"Unable to add %@ to %@.", testName, cls];
  }
  if ((self = [super initWithSelector:selector])) {
    _testName = testName;
  }
  return self;
}

- (NSString *)name
{
  return _testName;
}

+ (XCTestSuite *)defaultTestSuite
{
  RCTTestRunner *runner = RCTInitRunnerForApp(@"js/RNTesterApp", nil, nil);

  __block NSMutableArray<NSString *> *testNames = [NSMutableArray new];

  RCTLogFunction defaultLogFunction = RCTGetLogFunction();
  RCTSetLogFunction(
      ^(RCTLogLevel level, RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
        defaultLogFunction(level, source, fileName, lineNumber, message);
        if (level == RCTLogLevelTrace) {
          // message string is in the format:
          // 'ActivityIndicatorExample', '\n    in EnumerateExamplePages (at renderApplication.js:46)'
          NSArray *items = [message componentsSeparatedByString:@","];
          NSString *testName =
              [items[0] stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"'"]];
          [testNames addObject:testName];
        }
      });

  [runner runTest:_cmd module:@"EnumerateExamplePages"];

  RCTSetLogFunction(defaultLogFunction);

  XCTestSuite *suite = [XCTestSuite testSuiteForTestCaseClass:self];

  for (NSString *testName in testNames) {
    XCTestCase *testCase = [[self alloc] initWithName:testName];
    [suite addTest:testCase];
  }

  return suite;
}

- (void)internalTestRunner
{
  // this performs the actual test
  NSString *testName = [@"LoadPageTest_" stringByAppendingString:_testName];
  [_runner runTest:_cmd module:testName];
}

@end
