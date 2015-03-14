// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTView.h"

@class RCTEventDispatcher;

@interface RCTWebView : RCTView

@property (nonatomic, strong) NSURL *URL;
@property (nonatomic, assign) UIEdgeInsets contentInset;
@property (nonatomic, assign) BOOL shouldInjectAJAXHandler;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

- (void)goForward;
- (void)goBack;
- (void)reload;

@end
