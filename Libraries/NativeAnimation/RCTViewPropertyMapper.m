/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTViewPropertyMapper.h"

#import <UIKit/UIKit.h>

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTUIManager.h>

#import "RCTNativeAnimatedModule.h"

@interface RCTViewPropertyMapper ()

@property (nonatomic, weak) UIView *cachedView;
@property (nonatomic, weak) RCTUIManager *uiManager;

@end

@implementation RCTViewPropertyMapper

- (instancetype)initWithViewTag:(NSNumber *)viewTag
                      uiManager:(RCTUIManager *)uiManager
{
  if ((self = [super init])) {
    _uiManager = uiManager;
    _viewTag = viewTag;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)updateViewWithDictionary:(NSDictionary<NSString *, NSObject *> *)properties
{
  // cache the view for perf reasons (avoid constant lookups)
  UIView *view = _cachedView = _cachedView ?: [self.uiManager viewForReactTag:_viewTag];
  if (!view) {
    RCTLogError(@"No view to update.");
    return;
  }

  if (!properties.count) {
    return;
  }

  NSNumber *opacity = [RCTConvert NSNumber:properties[@"opacity"]];
  if (opacity) {
    view.alpha = opacity.floatValue;
  }

  NSObject *transform = properties[@"transform"];
  if ([transform isKindOfClass:[NSValue class]]) {
    view.layer.allowsEdgeAntialiasing = YES;
    view.layer.transform = ((NSValue *)transform).CATransform3DValue;
  }
}

@end
