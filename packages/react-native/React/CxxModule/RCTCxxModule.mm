/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTCxxModule.h"

#import <React/RCTBridge.h>
#import <React/RCTLog.h>
#import <cxxreact/CxxModule.h>
#import <react/utils/FollyConvert.h>

#import "RCTCxxMethod.h"

using namespace facebook::react;

@implementation RCTCxxModule {
  std::unique_ptr<facebook::xplat::module::CxxModule> _module;
}

+ (NSString *)moduleName
{
  return @"";
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)lazyInit
{
  if (!_module) {
    _module = [self createModule];

    if (_module) {
      RCTAssert(
          [RCTBridgeModuleNameForClass([self class]) isEqualToString:@(_module->getName().c_str())],
          @"CxxModule class name %@ does not match runtime name %s",
          RCTBridgeModuleNameForClass([self class]),
          _module->getName().c_str());
    }
  }
}

- (std::unique_ptr<facebook::xplat::module::CxxModule>)createModule
{
  RCTAssert(NO, @"Subclass %@ must override createModule", [self class]);
  return nullptr;
}

- (NSArray<id<RCTBridgeMethod>> *)methodsToExport
{
  [self lazyInit];
  if (!_module) {
    return nil;
  }

  NSMutableArray *moduleMethods = [NSMutableArray new];
  for (const auto &method : _module->getMethods()) {
    [moduleMethods addObject:[[RCTCxxMethod alloc] initWithCxxMethod:method]];
  }
  return moduleMethods;
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary<NSString *, id> *)getConstants
{
  [self lazyInit];
  if (!_module) {
    return nil;
  }

  NSMutableDictionary *moduleConstants = [NSMutableDictionary new];
  for (const auto &c : _module->getConstants()) {
    moduleConstants[@(c.first.c_str())] = convertFollyDynamicToId(c.second);
  }
  return moduleConstants;
}

@end
