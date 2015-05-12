/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTRootView.h"

#import <objc/runtime.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTContextExecutor.h"
#import "RCTEventDispatcher.h"
#import "RCTKeyCommands.h"
#import "RCTLog.h"
#import "RCTSourceCode.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "RCTWebViewExecutor.h"
#import "UIView+React.h"

@interface RCTBridge (RCTRootView)

@property (nonatomic, weak, readonly) RCTBridge *batchedBridge;

@end

@interface RCTUIManager (RCTRootView)

- (NSNumber *)allocateRootTag;

@end

@interface RCTRootContentView : RCTView <RCTInvalidating>

- (instancetype)initWithFrame:(CGRect)frame bridge:(RCTBridge *)bridge;

@end

@implementation RCTRootView
{
  RCTBridge *_bridge;
  NSString *_moduleName;
  NSDictionary *_launchOptions;
  RCTRootContentView *_contentView;
}

  - (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
{
  RCTAssertMainThread();
  RCTAssert(bridge, @"A bridge instance is required to create an RCTRootView");
  RCTAssert(moduleName, @"A moduleName is required to create an RCTRootView");

  if ((self = [super init])) {

    self.backgroundColor = [UIColor whiteColor];

    _bridge = bridge;
    _moduleName = moduleName;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(javaScriptDidLoad:)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:_bridge];
    if (!_bridge.batchedBridge.isLoading) {
      [self bundleFinishedLoading:_bridge.batchedBridge];
    }
  }
  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                    launchOptions:(NSDictionary *)launchOptions
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:bundleURL
                                            moduleProvider:nil
                                             launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName];
}

- (UIViewController *)backingViewController
{
  return _backingViewController ?: [super backingViewController];
}

- (BOOL)canBecomeFirstResponder
{
  return YES;
}

RCT_IMPORT_METHOD(AppRegistry, runApplication)
RCT_IMPORT_METHOD(ReactNative, unmountComponentAtNodeAndRemoveContainer)


- (void)javaScriptDidLoad:(NSNotification *)notification
{
  RCTBridge *bridge = notification.userInfo[@"bridge"];
  [self bundleFinishedLoading:bridge];
}

- (void)bundleFinishedLoading:(RCTBridge *)bridge
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!bridge.isValid) {
      return;
    }

    /**
     * Every root view that is created must have a unique React tag.
     * Numbering of these tags goes from 1, 11, 21, 31, etc
     *
     * NOTE: Since the bridge persists, the RootViews might be reused, so now
     * the React tag is assigned every time we load new content.
     */
    [_contentView removeFromSuperview];
    _contentView = [[RCTRootContentView alloc] initWithFrame:self.bounds
                                                      bridge:bridge];
    [self addSubview:_contentView];

    NSString *moduleName = _moduleName ?: @"";
    NSDictionary *appParameters = @{
      @"rootTag": _contentView.reactTag,
      @"initialProps": _initialProperties ?: @{},
    };
    [bridge enqueueJSCall:@"AppRegistry.runApplication"
                      args:@[moduleName, appParameters]];
  });
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  if (_contentView) {
    _contentView.frame = self.bounds;
  }
}

- (NSNumber *)reactTag
{
  return _contentView.reactTag;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [_contentView invalidate];
}

@end

@implementation RCTUIManager (RCTRootView)

- (NSNumber *)allocateRootTag
{
  NSNumber *rootTag = objc_getAssociatedObject(self, _cmd) ?: @1;
  objc_setAssociatedObject(self, _cmd, @(rootTag.integerValue + 10), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  return rootTag;
}

@end

@implementation RCTRootContentView
{
  __weak RCTBridge *_bridge;
  RCTTouchHandler *_touchHandler;
}

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(RCTBridge *)bridge
{
  if ((self = [super init])) {
    _bridge = bridge;
    [self setUp];
    self.frame = frame;
  }
  return self;
}

- (void)setFrame:(CGRect)frame
{
  [super setFrame:frame];
  if (self.reactTag && _bridge.isValid) {
    [_bridge.uiManager setFrame:self.bounds forRootView:self];
  }
}

- (void)setUp
{
  /**
   * Every root view that is created must have a unique react tag.
   * Numbering of these tags goes from 1, 11, 21, 31, etc
   *
   * NOTE: Since the bridge persists, the RootViews might be reused, so now
   * the react tag is assigned every time we load new content.
   */
  self.reactTag = [_bridge.uiManager allocateRootTag];
  [self addGestureRecognizer:[[RCTTouchHandler alloc] initWithBridge:_bridge]];
  [_bridge.uiManager registerRootView:self];
}

- (BOOL)isValid
{
  return self.userInteractionEnabled;
}

- (void)invalidate
{
  if (self.isValid) {
    self.userInteractionEnabled = NO;
    [self removeFromSuperview];
    [_bridge enqueueJSCall:@"ReactNative.unmountComponentAtNodeAndRemoveContainer"
                      args:@[self.reactTag]];
  }
}

@end
