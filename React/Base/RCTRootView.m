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

#import "RCTBridge.h"
#import "RCTContextExecutor.h"
#import "RCTDevMenu.h"
#import "RCTEventDispatcher.h"
#import "RCTKeyCommands.h"
#import "RCTLog.h"
#import "RCTSourceCode.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "RCTWebViewExecutor.h"
#import "UIView+React.h"

/**
 * HACK(t6568049) This should be removed soon, hiding to prevent people from
 * relying on it
 */
@interface RCTBridge (RCTRootView)

- (void)setJavaScriptExecutor:(id<RCTJavaScriptExecutor>)executor;

@end

@interface RCTUIManager (RCTRootView)

- (NSNumber *)allocateRootTag;

@end

@implementation RCTRootView
{
  RCTDevMenu *_devMenu;
  RCTBridge *_bridge;
  RCTTouchHandler *_touchHandler;
  NSString *_moduleName;
  NSDictionary *_launchOptions;
  UIView *_contentView;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
{
  RCTAssert(bridge, @"A bridge instance is required to create an RCTRootView");
  RCTAssert(moduleName, @"A moduleName is required to create an RCTRootView");

  if ((self = [super init])) {

    self.backgroundColor = [UIColor whiteColor];

#ifdef DEBUG

    _enableDevMenu = YES;

#endif

    _bridge = bridge;
    _moduleName = moduleName;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bundleFinishedLoading)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:_bridge];
    if (!_bridge.loading) {
      [self bundleFinishedLoading];
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

- (BOOL)isValid
{
  return _contentView.userInteractionEnabled;
}

- (void)invalidate
{
  _contentView.userInteractionEnabled = NO;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  if (_contentView) {
    [_bridge enqueueJSCall:@"ReactIOS.unmountComponentAtNodeAndRemoveContainer"
                      args:@[_contentView.reactTag]];
  }
}

- (UIViewController *)backingViewController
{
  return _backingViewController ?: [super backingViewController];
}

- (BOOL)canBecomeFirstResponder
{
  return YES;
}

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (motion == UIEventSubtypeMotionShake && self.enableDevMenu) {
    if (!_devMenu) {
      _devMenu = [[RCTDevMenu alloc] initWithBridge:_bridge];
    }
    [_devMenu show];
  } else {
    [super motionEnded:motion withEvent:event];
  }
}

RCT_IMPORT_METHOD(AppRegistry, runApplication)
RCT_IMPORT_METHOD(ReactIOS, unmountComponentAtNodeAndRemoveContainer)

- (void)bundleFinishedLoading
{
  dispatch_async(dispatch_get_main_queue(), ^{

    /**
     * Every root view that is created must have a unique react tag.
     * Numbering of these tags goes from 1, 11, 21, 31, etc
     *
     * NOTE: Since the bridge persists, the RootViews might be reused, so now
     * the react tag is assigned every time we load new content.
     */
    [_contentView removeFromSuperview];
    _contentView = [[UIView alloc] initWithFrame:self.bounds];
    _contentView.reactTag = [_bridge.uiManager allocateRootTag];
    _touchHandler = [[RCTTouchHandler alloc] initWithBridge:_bridge];
    [_contentView addGestureRecognizer:_touchHandler];
    [self addSubview:_contentView];

    NSString *moduleName = _moduleName ?: @"";
    NSDictionary *appParameters = @{
      @"rootTag": _contentView.reactTag,
      @"initialProps": self.initialProperties ?: @{},
    };
    [_bridge.uiManager registerRootView:_contentView];
    [_bridge enqueueJSCall:@"AppRegistry.runApplication"
                      args:@[moduleName, appParameters]];
  });
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  if (_contentView) {
    _contentView.frame = self.bounds;
    [_bridge.uiManager setFrame:self.frame forRootView:_contentView];
  }
}

- (NSNumber *)reactTag
{
  return _contentView.reactTag;
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
