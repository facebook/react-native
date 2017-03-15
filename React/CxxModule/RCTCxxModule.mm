/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTCxxModule.h"

#import <React/RCTBridge.h>
#import <React/RCTFollyConvert.h>
#import <React/RCTLog.h>
#import <cxxreact/CxxModule.h>

#import "RCTCxxMethod.h"

using namespace facebook::react;

@implementation RCTCxxModule
{
  std::unique_ptr<facebook::xplat::module::CxxModule> _module;
}

- (instancetype)init
{
  return nil;
}

- (instancetype)initWithCxxModule:(std::unique_ptr<facebook::xplat::module::CxxModule>)module
{
  RCTAssert([RCTBridgeModuleNameForClass([self class]) isEqualToString:@(module->getName().c_str())],
            @"CxxModule class name %@ does not match runtime name %s",
            RCTBridgeModuleNameForClass([self class]), module->getName().c_str());

  if ((self = [super init])) {
    _module = std::move(module);
  }

  return self;
}

- (std::unique_ptr<facebook::xplat::module::CxxModule>)move
{
  return std::move(_module);
}

+ (NSString *)moduleName
{
  return @"";
}

- (NSArray *)methodsToExport
{
  CHECK(_module) << "Can't call methodsToExport on moved module";

  NSMutableArray *moduleMethods = [NSMutableArray new];
  for (const auto &method : _module->getMethods()) {
    [moduleMethods addObject:[[RCTCxxMethod alloc] initWithCxxMethod:method]];
  }
  return moduleMethods;
}

- (NSDictionary *)constantsToExport
{
  CHECK(_module) << "Can't call constantsToExport on moved module";

  NSMutableDictionary *moduleConstants = [NSMutableDictionary new];
  for (const auto &c : _module->getConstants()) {
    moduleConstants[@(c.first.c_str())] = convertFollyDynamicToId(c.second);
  }
  return moduleConstants;
}

@end
