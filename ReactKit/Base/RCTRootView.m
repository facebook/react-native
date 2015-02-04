// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTRootView.h"

#import "RCTBridge.h"
#import "RCTContextExecutor.h"
#import "RCTEventDispatcher.h"
#import "RCTJavaScriptAppEngine.h"
#import "RCTModuleIDs.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "RCTViewManager.h"
#import "UIView+ReactKit.h"
#import "RCTKeyCommands.h"

NSString *const RCTRootViewReloadNotification = @"RCTRootViewReloadNotification";

@implementation RCTRootView
{
  dispatch_queue_t _shadowQueue;
  RCTBridge *_bridge;
  RCTJavaScriptAppEngine *_appEngine;
  RCTTouchHandler *_touchHandler;
}

+ (void)initialize
{

#if DEBUG

  // Register Cmd-R as a global refresh key
  [[RCTKeyCommands sharedInstance] registerKeyCommandWithInput:@"r"
                                                 modifierFlags:UIKeyModifierCommand
                                                        action:^(UIKeyCommand *command) {
                                                          [self reloadAll];
                                                        }];

#endif
  
}

- (id)initWithCoder:(NSCoder *)aDecoder
{
  self = [super initWithCoder:aDecoder];
  if (!self) return nil;

  [self setUp];

  return self;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:frame];
  if (!self) return nil;

  [self setUp];

  return self;
}

- (void)setUp
{
  // TODO: does it make sense to do this here? What if there's more than one host view?
  _shadowQueue = dispatch_queue_create("com.facebook.ReactKit.ShadowQueue", DISPATCH_QUEUE_SERIAL);

  // Every root view that is created must have a unique react tag.
  // Numbering of these tags goes from 1, 11, 21, 31, etc
  static NSInteger rootViewTag = 1;
  self.reactTag = @(rootViewTag);
  rootViewTag += 10;

  // Add reload observer
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(reload)
                                               name:RCTRootViewReloadNotification
                                             object:nil];
  self.backgroundColor = [UIColor whiteColor];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)bundleFinishedLoading:(NSError *)error
{
  if (error != nil) {
    NSArray *stack = [[error userInfo] objectForKey:@"stack"];
    if (stack) {
      [[RCTRedBox sharedInstance] showErrorMessage:[error localizedDescription] withStack:stack];
    } else {
      [[RCTRedBox sharedInstance] showErrorMessage:[error localizedDescription] withDetails:[error localizedFailureReason]];
    }
  } else {
    
    [_bridge.uiManager registerRootView:self];

    NSString *moduleName = _moduleName ?: @"";
    NSDictionary *appParameters = @{
      @"rootTag": self.reactTag ?: @0,
      @"initialProps": self.initialProperties ?: @{},
    };
    [_appEngine.bridge enqueueJSCall:RCTModuleIDBundler
                            methodID:RCTBundlerRunApplication
                                args:@[moduleName, appParameters]];
  }
}

- (void)loadBundle
{
  // Clear view
  [self.subviews makeObjectsPerformSelector:@selector(removeFromSuperview)];
  
  if (!_scriptURL) {
    return;
  }
  
  __weak typeof(self) weakSelf = self;
  RCTJavaScriptCompleteBlock callback = ^(NSError *error) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [weakSelf bundleFinishedLoading:error];
    });
  };

  [_executor invalidate];
  [_appEngine invalidate];
  [_bridge invalidate];

  _executor = [[RCTContextExecutor alloc] init];
  _bridge = [[RCTBridge alloc] initWithJavaScriptExecutor:_executor
                                              shadowQueue:_shadowQueue
                                  javaScriptModulesConfig:[RCTModuleIDs config]];

  _appEngine = [[RCTJavaScriptAppEngine alloc] initWithBridge:_bridge];
  _touchHandler = [[RCTTouchHandler alloc] initWithEventDispatcher:_bridge.eventDispatcher rootView:self];

  [_appEngine loadBundleAtURL:_scriptURL useCache:NO onComplete:callback];
}

- (void)setScriptURL:(NSURL *)scriptURL
{
  if ([_scriptURL isEqual:scriptURL]) {
    return;
  }

  _scriptURL = scriptURL;
  [self loadBundle];
}

- (void)setExecutor:(id<RCTJavaScriptExecutor>)executor
{
  RCTAssert(!_bridge, @"You may only change the Javascript Executor prior to loading a script bundle.");
  _executor = executor;
}

- (BOOL)isReactRootView
{
  return YES;
}

- (void)reload
{
  [RCTJavaScriptAppEngine resetCacheForBundleAtURL:_scriptURL];
  [self loadBundle];
}

+ (void)reloadAll
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTRootViewReloadNotification object:nil];
}

#pragma mark - Key commands

- (NSArray *)keyCommands
{
  return @[
           
    // Reload
    [UIKeyCommand keyCommandWithInput:@"r"
                       modifierFlags:UIKeyModifierCommand
                              action:@selector(reload)]
    ];
}

- (BOOL)canBecomeFirstResponder
{
  return YES;
}

@end
