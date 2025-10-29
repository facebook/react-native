/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTResizeMode.h>
#import <React/RCTView.h>
#import <UIKit/UIKit.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

@class RCTBridge;
@class RCTImageSource;

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTImageView : RCTView

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@property (nonatomic, assign) UIEdgeInsets capInsets;
@property (nonatomic, strong) UIImage *defaultImage;
@property (nonatomic, assign) UIImageRenderingMode renderingMode;
@property (nonatomic, copy) NSArray<RCTImageSource *> *imageSources;
@property (nonatomic, assign) CGFloat blurRadius;
@property (nonatomic, assign) RCTResizeMode resizeMode;
@property (nonatomic, copy) NSString *internal_analyticTag;

@end

#endif // RCT_REMOVE_LEGACY_ARCH
