/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTBridge.h"

#import <objc/runtime.h>

#import "RCTEventDispatcher.h"
#import "RCTKeyCommands.h"
#import "RCTLog.h"
#import "RCTPerformanceLogger.h"
#import "RCTUtils.h"

NSString *const RCTReloadNotification = @"RCTReloadNotification";
NSString *const RCTJavaScriptDidLoadNotification = @"RCTJavaScriptDidLoadNotification";
NSString *const RCTJavaScriptDidFailToLoadNotification = @"RCTJavaScriptDidFailToLoadNotification";
NSString *const RCTDidCreateNativeModules = @"RCTDidCreateNativeModules";

@class RCTBatchedBridge;

@interface RCTBatchedBridge : RCTBridge <RCTInvalidating>

@property (nonatomic, weak) RCTBridge *parentBridge;

- (instancetype)initWithParentBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

@interface RCTBridge ()

@property (nonatomic, strong) RCTBatchedBridge *batchedBridge;

@end

RCT_EXTERN id<RCTJavaScriptExecutor> RCTGetLatestExecutor(void);

static NSMutableArray *RCTModuleClasses;
NSArray *RCTGetModuleClasses(void);
NSArray *RCTGetModuleClasses(void)
{
  return RCTModuleClasses;
}

void RCTRegisterModule(Class moduleClass)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTModuleClasses = [[NSMutableArray alloc] init];
  });

  RCTAssert([moduleClass conformsToProtocol:@protocol(RCTBridgeModule)],
            @"%@ does not conform to the RCTBridgeModule protocol",
            NSStringFromClass(moduleClass));

  // Register module
  [RCTModuleClasses addObject:moduleClass];
}

/**
 * This function returns the module name for a given class.
 */
NSString *RCTBridgeModuleNameForClass(Class cls)
{
  NSString *name = nil;
  if ([cls respondsToSelector:NSSelectorFromString(@"moduleName")]) {
    name = [cls valueForKey:@"moduleName"];
  }
  if ([name length] == 0) {
    name = NSStringFromClass(cls);
  }
  if ([name hasPrefix:@"RK"]) {
    name = [name stringByReplacingCharactersInRange:(NSRange){0,@"RK".length} withString:@"RCT"];
  }
  return name;
}


@implementation RCTBridge

dispatch_queue_t RCTJSThread;

+ (void)initialize
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{

    // Set up JS thread
    RCTJSThread = (id)kCFNull;

#if RCT_DEBUG

    // Set up module classes
    static unsigned int classCount;
    Class *classes = objc_copyClassList(&classCount);

    for (unsigned int i = 0; i < classCount; i++)
    {
      Class cls = classes[i];
      Class superclass = cls;
      while (superclass)
      {
        if (class_conformsToProtocol(superclass, @protocol(RCTBridgeModule)))
        {
          if (![RCTModuleClasses containsObject:cls]) {
            RCTLogError(@"Class %@ was not exported. Did you forget to use "
                        "RCT_EXPORT_MODULE()?", NSStringFromClass(cls));
          }
          break;
        }
        superclass = class_getSuperclass(superclass);
      }
    }

    free(classes);

#endif

  });
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   moduleProvider:(RCTBridgeModuleProviderBlock)block
                    launchOptions:(NSDictionary *)launchOptions
{
  RCTAssertMainThread();

  if ((self = [super init])) {
    RCTPerformanceLoggerStart(RCTPLTTI);

    _bundleURL = bundleURL;
    _moduleProvider = block;
    _launchOptions = [launchOptions copy];
    [self bindKeys];
    [self setUp];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-init)

- (void)dealloc
{
  /**
   * This runs only on the main thread, but crashes the subclass
   * RCTAssertMainThread();
   */
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [self invalidate];
}

- (void)bindKeys
{
  RCTAssertMainThread();

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(reload)
                                               name:RCTReloadNotification
                                             object:nil];

#if TARGET_IPHONE_SIMULATOR

  __weak RCTBridge *weakSelf = self;
  RCTKeyCommands *commands = [RCTKeyCommands sharedInstance];

  // reload in current mode
  [commands registerKeyCommandWithInput:@"r"
                          modifierFlags:UIKeyModifierCommand
                                 action:^(__unused UIKeyCommand *command) {
                                   [weakSelf reload];
                                 }];

#endif

}

- (RCTEventDispatcher *)eventDispatcher
{
  return self.modules[RCTBridgeModuleNameForClass([RCTEventDispatcher class])];
}

- (void)reload
{
  /**
   * AnyThread
   */
  dispatch_async(dispatch_get_main_queue(), ^{
    [self invalidate];
    [self setUp];
  });
}

- (void)setUp
{
  RCTAssertMainThread();

  _batchedBridge = [[RCTBatchedBridge alloc] initWithParentBridge:self];
}

- (BOOL)isLoading
{
  return _batchedBridge.loading;
}

- (BOOL)isValid
{
  return _batchedBridge.isValid;
}

- (void)invalidate
{
  RCTAssertMainThread();

  [_batchedBridge invalidate];
  _batchedBridge = nil;
}

+ (void)logMessage:(NSString *)message level:(NSString *)level
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!RCTGetLatestExecutor().isValid) {
      return;
    }

    [RCTGetLatestExecutor() executeJSCall:@"RCTLog"
                                   method:@"logIfNoNativeHook"
                                arguments:@[level, message]
                                  context:RCTGetExecutorID(RCTGetLatestExecutor())
                                 callback:^(__unused id json, __unused NSError *error) {}];
  });
}

- (NSDictionary *)modules
{
  return _batchedBridge.modules;
}

#define RCT_INNER_BRIDGE_ONLY(...) \
- (void)__VA_ARGS__ \
{ \
  RCTLogMustFix(@"Called method \"%@\" on top level bridge. This method should \
              only be called from bridge instance in a bridge module", @(__func__)); \
}

- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args
{
  [self.batchedBridge enqueueJSCall:moduleDotMethod args:args];
}

RCT_INNER_BRIDGE_ONLY(_invokeAndProcessModule:(__unused NSString *)module
                      method:(__unused NSString *)method
                      arguments:(__unused NSArray *)args
                      context:(__unused NSNumber *)context)

@end
