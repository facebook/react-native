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
#import "RCTBridge+Private.h"
#import "RCTModuleMethod.h"
#import "RCTLog.h"
#import "RCTProfile.h"
#import "RCTUtils.h"

@implementation RCTModuleData
{
  NSDictionary<NSString *, id> *_constantsToExport;
  NSString *_queueName;
  __weak RCTBridge *_bridge;
  NSLock *_instanceLock;
  BOOL _setupComplete;
}

@synthesize methods = _methods;
@synthesize instance = _instance;
@synthesize methodQueue = _methodQueue;

- (void)setUp
{
  _implementsBatchDidComplete = [_moduleClass instancesRespondToSelector:@selector(batchDidComplete)];
  _implementsPartialBatchDidFlush = [_moduleClass instancesRespondToSelector:@selector(partialBatchDidFlush)];

  _instanceLock = [NSLock new];

  static IMP objectInitMethod;
  static SEL setBridgeSelector;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    objectInitMethod = [NSObject instanceMethodForSelector:@selector(init)];
    setBridgeSelector = NSSelectorFromString(@"setBridge:");
  });

  // If a module overrides `init`, `setBridge:` then we must assume that it
  // expects for both of those methods to be called on the main thread, because
  // they may need to access UIKit.
  _requiresMainThreadSetup =
  [_moduleClass instancesRespondToSelector:setBridgeSelector] ||
  (!_instance && [_moduleClass instanceMethodForSelector:@selector(init)] != objectInitMethod);

  // If a module overrides `constantsToExport` then we must assume that it
  // must be called on the main thread, because it may need to access UIKit.
  _hasConstantsToExport = RCTClassOverridesInstanceMethod(_moduleClass, @selector(constantsToExport));
}

- (instancetype)initWithModuleClass:(Class)moduleClass
                             bridge:(RCTBridge *)bridge
{
  if ((self = [super init])) {
    _bridge = bridge;
    _moduleClass = moduleClass;
    [self setUp];
  }
  return self;
}

- (instancetype)initWithModuleInstance:(id<RCTBridgeModule>)instance
                                bridge:(RCTBridge *)bridge
{
  if ((self = [super init])) {
    _bridge = bridge;
    _instance = instance;
    _moduleClass = [instance class];
    [self setUp];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init);

#pragma mark - private setup methods

- (void)setUpInstanceAndBridge
{
  [_instanceLock lock];
  if (!_setupComplete && _bridge.valid) {
    if (!_instance) {
      if (RCT_DEBUG && _requiresMainThreadSetup) {
        RCTAssertMainThread();
      }
      _instance = [_moduleClass new];
      if (!_instance) {
        // Module init returned nil, probably because automatic instantatiation
        // of the module is not supported, and it is supposed to be passed in to
        // the bridge constructor. Mark setup complete to avoid doing more work.
        _setupComplete = YES;
        RCTLogWarn(@"The module %@ is returning nil from its constructor. You "
                   "may need to instantiate it yourself and pass it into the "
                   "bridge.", _moduleClass);
      }
    }
    // Bridge must be set before methodQueue is set up, as methodQueue
    // initialization requires it (View Managers get their queue by calling
    // self.bridge.uiManager.methodQueue)
    [self setBridgeForInstance];
  }
  [_instanceLock unlock];

  // This is called outside of the lock in order to prevent deadlock issues
  // because the logic in `setUpMethodQueue` can cause `moduleData.instance`
  // to be accessed re-entrantly.
  [self setUpMethodQueue];

  // This is called outside of the lock in order to prevent deadlock issues
  // because the logic in `finishSetupForInstance` can cause
  // `moduleData.instance` to be accessed re-entrantly.
  if (_bridge.moduleSetupComplete) {
    [self finishSetupForInstance];
  }
}

- (void)setBridgeForInstance
{
  if ([_instance respondsToSelector:@selector(bridge)] && _instance.bridge != _bridge) {
    @try {
      [(id)_instance setValue:_bridge forKey:@"bridge"];
    }
    @catch (NSException *exception) {
      RCTLogError(@"%@ has no setter or ivar for its bridge, which is not "
                  "permitted. You must either @synthesize the bridge property, "
                  "or provide your own setter method.", self.name);
    }
  }
}

- (void)finishSetupForInstance
{
  if (!_setupComplete && _instance) {
    _setupComplete = YES;
    [_bridge registerModuleForFrameUpdates:_instance withModuleData:self];
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTDidInitializeModuleNotification
                                                        object:_bridge
                                                      userInfo:@{@"module": _instance}];
  }
}

- (void)setUpMethodQueue
{
  if (_instance && !_methodQueue && _bridge.valid) {
    BOOL implementsMethodQueue = [_instance respondsToSelector:@selector(methodQueue)];
    if (implementsMethodQueue && _bridge.valid) {
      _methodQueue = _instance.methodQueue;
    }
    if (!_methodQueue && _bridge.valid) {

      // Create new queue (store queueName, as it isn't retained by dispatch_queue)
      _queueName = [NSString stringWithFormat:@"com.facebook.React.%@Queue", self.name];
      _methodQueue = dispatch_queue_create(_queueName.UTF8String, DISPATCH_QUEUE_SERIAL);

      // assign it to the module
      if (implementsMethodQueue) {
        @try {
          [(id)_instance setValue:_methodQueue forKey:@"methodQueue"];
        }
        @catch (NSException *exception) {
          RCTLogError(@"%@ is returning nil for its methodQueue, which is not "
                      "permitted. You must either return a pre-initialized "
                      "queue, or @synthesize the methodQueue to let the bridge "
                      "create a queue for you.", self.name);
        }
      }
    }
  }
}

#pragma mark - public getters

- (BOOL)hasInstance
{
  return _instance != nil;
}

- (id<RCTBridgeModule>)instance
{
  if (!_setupComplete) {
    RCT_PROFILE_BEGIN_EVENT(0, [NSString stringWithFormat:@"[RCTModuleData instanceForClass:%@]", _moduleClass], nil);
    if (_requiresMainThreadSetup) {
      // The chances of deadlock here are low, because module init very rarely
      // calls out to other threads, however we can't control when a module might
      // get accessed by client code during bridge setup, and a very low risk of
      // deadlock is better than a fairly high risk of an assertion being thrown.
      RCTExecuteOnMainThread(^{
        [self setUpInstanceAndBridge];
      }, YES);
    } else {
      [self setUpInstanceAndBridge];
    }
    RCT_PROFILE_END_EVENT(0, @"", nil);
  }
  return _instance;
}

- (NSString *)name
{
  return RCTBridgeModuleNameForClass(_moduleClass);
}

- (NSArray<id<RCTBridgeMethod>> *)methods
{
  if (!_methods) {
    NSMutableArray<id<RCTBridgeMethod>> *moduleMethods = [NSMutableArray new];

    if ([_moduleClass instancesRespondToSelector:@selector(methodsToExport)]) {
      [self instance];
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
          [[RCTModuleMethod alloc] initWithMethodSignature:entries[1]
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

- (void)gatherConstants
{
  if (_hasConstantsToExport && !_constantsToExport) {
    (void)[self instance];
    RCTExecuteOnMainThread(^{
      _constantsToExport = [_instance constantsToExport] ?: @{};
    }, YES);
  }
}

- (NSArray *)config
{
  [self gatherConstants];
  __block NSDictionary<NSString *, id> *constants = _constantsToExport;
  _constantsToExport = nil; // Not needed anymore

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
  (void)[self instance];
  return _methodQueue;
}

- (void)invalidate
{
  _methodQueue = nil;
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; name=\"%@\">", [self class], self, self.name];
}

@end
