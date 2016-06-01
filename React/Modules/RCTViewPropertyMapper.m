/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTViewPropertyMapper.h"
#import "RCTAnimation.h"
#import "RCTNativeAnimatedModule.h"
#import "RCTNativeAnimationManager.h"
#import <UIKit/UIKit.h>
#import "RCTBridge.h"
#import "RCTUIManager.h"

@implementation RCTViewPropertyMapper {
  CGFloat tX_;
  CGFloat tY_;
  CGFloat sX_;
  CGFloat sY_;
  CGFloat r_;
}

- (instancetype)initWithViewTag:(NSNumber *)viewTag {
  self = [super init];
  if (self) {
    _viewTag = viewTag;
    tX_ = 0;
    tY_ = 0;
    sX_ = 1;
    sY_ = 1;
    r_ = 0;
  }
  return self;
}

- (void)updateViewWithDictionary:(NSDictionary *)updates {
  if (updates.count) {
    RCTNativeAnimatedModule *animationModule =
      [[RCTNativeAnimationManager sharedManager] nativeAnimationModule];
    UIView *view = [animationModule.bridge.uiManager viewForReactTag:_viewTag];
    if (!view) {
      return;
    }
    
    NSNumber *opacity = updates[@"opacity"];
    if (opacity) {
      view.alpha = opacity.floatValue;
    }
    
    NSNumber *scale = updates[@"scale"];
    if (scale) {
      sX_ = scale.floatValue;
      sY_ = scale.floatValue;
    }
    NSNumber *scaleX = updates[@"scaleX"];
    if (scaleX) {
      sX_ = scaleX.floatValue;
    }
    NSNumber *scaleY = updates[@"scaleY"];
    if (scaleY) {
      sY_ = scaleY.floatValue;
    }
    NSNumber *translateX = updates[@"translateX"];
    if (translateX) {
      tX_ = translateX.floatValue;
    }
    NSNumber *translateY = updates[@"translateY"];
    if (translateY) {
      tY_ = translateY.floatValue;
    }
    NSNumber *rotation = updates[@"rotate"];
    if (rotation) {
      r_ = rotation.floatValue;
    }
    
    if (translateX || translateY || scale || scaleX || scaleY || rotation) {
      CATransform3D xform = CATransform3DMakeScale(sX_, sY_, 0);
      xform = CATransform3DTranslate(xform, tX_, tY_, 0);
      xform = CATransform3DRotate(xform, r_, 0, 0, 1);
      view.layer.allowsEdgeAntialiasing = YES;
      view.layer.transform = xform;
    }
  }
}

@end
