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
NSString *const RCTJavaScriptWillStartLoadingNotification = @"RCTJavaScriptWillStartLoadingNotification";
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

static NSMutableArray *RCTModuleClasses;
NSArray *RCTGetModuleClasses(void);
NSArray *RCTGetModuleClasses(void)
{
  return RCTModuleClasses;
}

/**
 * Register the given class as a bridge module. All modules must be registered
 * prior to the first bridge initialization.
 */
void RCTRegisterModule(Class);
void RCTRegisterModule(Class moduleClass)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTModuleClasses = [NSMutableArray new];
  });

  RCTAssert([moduleClass conformsToProtocol:@protocol(RCTBridgeModule)],
            @"%@ does not conform to the RCTBridgeModule protocol",
            moduleClass);

  // Register module
  [RCTModuleClasses addObject:moduleClass];
}

/**
 * This function returns the module name for a given class.
 */
NSString *RCTBridgeModuleNameForClass(Class cls)
{
#if RCT_DEV
  RCTAssert([cls conformsToProtocol:@protocol(RCTBridgeModule)], @"Bridge module classes must conform to RCTBridgeModule");
#endif

  NSString *name = [cls moduleName];
  if (name.length == 0) {
    name = NSStringFromClass(cls);
  }
  if ([name hasPrefix:@"RK"]) {
    name = [name stringByReplacingCharactersInRange:(NSRange){0,@"RK".length} withString:@"RCT"];
  }
  return name;
}

/**
 * Check if class has been registered
 */
BOOL RCTBridgeModuleClassIsRegistered(Class);
BOOL RCTBridgeModuleClassIsRegistered(Class cls)
{
  return [objc_getAssociatedObject(cls, &RCTBridgeModuleClassIsRegistered) ?: @YES boolValue];
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
            RCTLogWarn(@"Class %@ was not exported. Did you forget to use "
                       "RCT_EXPORT_MODULE()?", cls);

            RCTRegisterModule(cls);
            objc_setAssociatedObject(cls, &RCTBridgeModuleClassIsRegistered,
                                     @NO, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
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

static RCTBridge *RCTCurrentBridgeInstance = nil;

/**
 * The last current active bridge instance. This is set automatically whenever
 * the bridge is accessed. It can be useful for static functions or singletons
 * that need to access the bridge for purposes such as logging, but should not
 * be relied upon to return any particular instance, due to race conditions.
 */
+ (instancetype)currentBridge
{
  return RCTCurrentBridgeInstance;
}

+ (void)setCurrentBridge:(RCTBridge *)currentBridge
{
  RCTCurrentBridgeInstance = currentBridge;
}

- (instancetype)initWithDelegate:(id<RCTBridgeDelegate>)delegate
                   launchOptions:(NSDictionary *)launchOptions
{
  RCTAssertMainThread();

  if ((self = [super init])) {
    RCTPerformanceLoggerStart(RCTPLTTI);

    _delegate = delegate;
    _launchOptions = [launchOptions copy];
    [self setUp];
    [self bindKeys];
  }
  return self;
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
    [self setUp];
    [self bindKeys];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

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
  RCTKeyCommands *commands = [RCTKeyCommands sharedInstance];

  // reload in current mode
  [commands registerKeyCommandWithInput:@"r"
                          modifierFlags:UIKeyModifierCommand
                                 action:^(__unused UIKeyCommand *command) {
                                    [[NSNotificationCenter defaultCenter] postNotificationName:RCTReloadNotification
                                                                                        object:nil
                                                                                      userInfo:nil];
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

  _bundleURL = [self.delegate sourceURLForBridge:self] ?: _bundleURL;
  _batchedBridge = [[RCTBatchedBridge alloc] initWithParentBridge:self];
}

- (BOOL)isLoading
{
  return _batchedBridge.loading;
}

- (BOOL)isValid
{
  return _batchedBridge.valid;
}

- (void)invalidate
{
  RCTAssertMainThread();

  [_batchedBridge invalidate];
  _batchedBridge = nil;
}

- (void)logMessage:(NSString *)message level:(NSString *)level
{
  [_batchedBridge logMessage:message level:level];
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
                      arguments:(__unused NSArray *)args);
@end
