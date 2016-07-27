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

#import "RCTBridge.h"
#import "RCTUIManager.h"
#import "RCTNativeAnimatedModule.h"
#import "RCTTransformAnimatedNode.h"

@implementation RCTViewPropertyMapper
{
  RCTNativeAnimatedModule *_animationModule;
  CATransform3D _lastTransform;
  CGFloat _lastOpacity;
}

- (instancetype)initWithViewTag:(NSNumber *)viewTag
                animationModule:(RCTNativeAnimatedModule *)animationModule
{
  if ((self = [super init])) {
    _viewTag = viewTag;
    _animationModule = animationModule;
    _lastTransform = CATransform3DIdentity;
    _lastOpacity = 1.0;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)updateViewWithProps:(NSDictionary<NSString *,NSNumber *> *)props
                     styles:(NSDictionary<NSString *,NSNumber *> *)styles
                  transform:(CATransform3D)transform
{
  UIView *view = [_animationModule.bridge.uiManager viewForReactTag:_viewTag];
  if (!view) {
    return;
  }

  if (styles.count) {
    NSNumber *opacityUpdate = styles[@"opacity"];
    if (opacityUpdate) {
      CGFloat opacity = opacityUpdate.floatValue;
      if (opacity != _lastOpacity) {
        view.alpha = opacity;
        _lastOpacity = opacity;
      }
    }
  }

  if (!CATransform3DEqualToTransform(transform, _lastTransform)) {
    view.layer.allowsEdgeAntialiasing = YES;
    view.layer.transform = transform;
    _lastTransform = transform;
  }
}

@end
