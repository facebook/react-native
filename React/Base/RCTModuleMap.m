/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTModuleMap.h"

#import "RCTBridge.h"
#import "RCTBridgeModule.h"
#import "RCTDefines.h"
#import "RCTLog.h"

@implementation RCTModuleMap
{
  NSDictionary *_modulesByName;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:aDecoder)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithObjects:(const id [])objects
                                            forKeys:(const id<NSCopying> [])keys
                                              count:(NSUInteger)cnt)

- (instancetype)initWithDictionary:(NSDictionary *)modulesByName
{
  if ((self = [super init])) {
    _modulesByName = [modulesByName copy];
  }
  return self;
}

- (NSUInteger)count
{
  return _modulesByName.count;
}

//declared in RCTBridge.m
extern BOOL RCTBridgeModuleClassIsRegistered(Class cls);

- (id)objectForKey:(NSString *)moduleName
{
  id<RCTBridgeModule> module = _modulesByName[moduleName];
  if (RCT_DEBUG) {
    if (module) {
      Class moduleClass = [module class];
      if (!RCTBridgeModuleClassIsRegistered(moduleClass)) {
        RCTLogError(@"Class %@ was not exported. Did you forget to use "
                    "RCT_EXPORT_MODULE()?", moduleClass);
      }
    } else {
      Class moduleClass = NSClassFromString(moduleName);
      module = _modulesByName[moduleName];
      if (module) {
        RCTLogError(@"bridge.modules[name] expects a module name, not a class "
                    "name. Did you mean to pass '%@' instead?",
                    RCTBridgeModuleNameForClass(moduleClass));
      }
    }
  }
  return module;
}

- (NSEnumerator *)keyEnumerator
{
  return [_modulesByName keyEnumerator];
}

- (NSArray<id<RCTBridgeModule>> *)allValues
{
  // don't perform validation in this case because we only want to error when
  // an invalid module is specifically requested
  return _modulesByName.allValues;
}

@end
