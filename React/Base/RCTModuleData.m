/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTModuleData.h"

#import "RCTBridge.h"
#import "RCTModuleMethod.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@interface RCTBridge (Private)

- (void)registerModuleForFrameUpdates:(RCTModuleData *)moduleData;

@end

@implementation RCTModuleData
{
  NSString *_queueName;
  __weak RCTBridge *_bridge;
}

@synthesize methods = _methods;
@synthesize instance = _instance;
@synthesize methodQueue = _methodQueue;

- (instancetype)initWithModuleClass:(Class)moduleClass
                             bridge:(RCTBridge *)bridge
{
  if ((self = [super init])) {
    _moduleClass = moduleClass;
    _bridge = bridge;
  }
  return self;
}

- (instancetype)initWithModuleInstance:(id<RCTBridgeModule>)instance
{
  if ((self = [super init])) {
    _instance = instance;
    _moduleClass = [instance class];

    [self cacheImplementedSelectors];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init);

- (BOOL)hasInstance
{
  return _instance != nil;
}

- (id<RCTBridgeModule>)instance
{
  if (!_instance) {
    _instance = [_moduleClass new];

    // Bridge must be set before methodQueue is set up, as methodQueue
    // initialization requires it (View Managers get their queue by calling
    // self.bridge.uiManager.methodQueue)
    [self setBridgeForInstance:_bridge];

    // Initialize queue
    [self methodQueue];

    [self cacheImplementedSelectors];
  }
  return _instance;
}

- (void)cacheImplementedSelectors
{
  _implementsBatchDidComplete = [_instance respondsToSelector:@selector(batchDidComplete)];
  _implementsPartialBatchDidFlush = [_instance respondsToSelector:@selector(partialBatchDidFlush)];
}

- (void)setBridgeForInstance:(RCTBridge *)bridge
{
  if ([_instance respondsToSelector:@selector(bridge)]) {
    @try {
      [(id)_instance setValue:bridge forKey:@"bridge"];
    }
    @catch (NSException *exception) {
      RCTLogError(@"%@ has no setter or ivar for its bridge, which is not "
                  "permitted. You must either @synthesize the bridge property, "
                  "or provide your own setter method.", self.name);
    }
  }
  [bridge registerModuleForFrameUpdates:self];
}

- (NSString *)name
{
  return RCTBridgeModuleNameForClass(_moduleClass);
}

- (NSArray<id<RCTBridgeMethod>> *)methods
{
  if (!_methods) {
    NSMutableArray<id<RCTBridgeMethod>> *moduleMethods = [NSMutableArray new];

    if ([_instance respondsToSelector:@selector(methodsToExport)]) {
      [moduleMethods addObjectsFromArray:[_instance methodsToExport]];
    }

    unsigned int methodCount;
    Method *methods = class_copyMethodList(object_getClass(_moduleClass), &methodCount);

    for (unsigned int i = 0; i < methodCount; i++) {
      Method method = methods[i];
      SEL selector = method_getName(method);
      if ([NSStringFromSelector(selector) hasPrefix:@"__rct_export__"]) {
        IMP imp = method_getImplementation(method);
        NSArray<NSString *> *entries =
          ((NSArray<NSString *> *(*)(id, SEL))imp)(_moduleClass, selector);
        id<RCTBridgeMethod> moduleMethod =
          [[RCTModuleMethod alloc] initWithObjCMethodName:entries[1]
                                             JSMethodName:entries[0]
                                              moduleClass:_moduleClass];

        [moduleMethods addObject:moduleMethod];
      }
    }

    free(methods);

    _methods = [moduleMethods copy];
  }
  return _methods;
}

- (NSArray *)config
{
  __block NSDictionary<NSString *, id> *constants;
  if (RCTClassOverridesInstanceMethod(_moduleClass, @selector(constantsToExport))) {
    [self instance]; // Initialize instance
    RCTExecuteOnMainThread(^{
      constants = [_instance constantsToExport];
    }, YES);
  }

  if (constants.count == 0 && self.methods.count == 0) {
    return (id)kCFNull; // Nothing to export
  }

  NSMutableArray<NSString *> *methods = self.methods.count ? [NSMutableArray new] : nil;
  NSMutableArray<NSNumber *> *asyncMethods = nil;
  for (id<RCTBridgeMethod> method in self.methods) {
    if (method.functionType == RCTFunctionTypePromise) {
      if (!asyncMethods) {
        asyncMethods = [NSMutableArray new];
      }
      [asyncMethods addObject:@(methods.count)];
    }
    [methods addObject:method.JSMethodName];
  }

  NSMutableArray *config = [NSMutableArray new];
  [config addObject:self.name];
  if (constants.count) {
    [config addObject:constants];
  }
  if (methods) {
    [config addObject:methods];
    if (asyncMethods) {
      [config addObject:asyncMethods];
    }
  }
  return config;
}

- (dispatch_queue_t)methodQueue
{
  if (!_methodQueue) {
    BOOL implementsMethodQueue = [self.instance respondsToSelector:@selector(methodQueue)];
    if (implementsMethodQueue) {
      _methodQueue = _instance.methodQueue;
    }
    if (!_methodQueue) {

      // Create new queue (store queueName, as it isn't retained by dispatch_queue)
      _queueName = [NSString stringWithFormat:@"com.facebook.React.%@Queue", self.name];
      _methodQueue = dispatch_queue_create(_queueName.UTF8String, DISPATCH_QUEUE_SERIAL);

      // assign it to the module
      if (implementsMethodQueue) {
        @try {
          [(id)_instance setValue:_methodQueue forKey:@"methodQueue"];
        }
        @catch (NSException *exception) {
          RCTLogError(@"%@ is returning nil for it's methodQueue, which is not "
                      "permitted. You must either return a pre-initialized "
                      "queue, or @synthesize the methodQueue to let the bridge "
                      "create a queue for you.", self.name);
        }
      }
    }
  }
  return _methodQueue;
}

- (void)invalidate
{
  _methodQueue = nil;
}

@end
