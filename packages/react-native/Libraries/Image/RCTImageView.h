/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTResizeMode.h>
#import <React/RCTView.h>
#import <UIKit/UIKit.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

@class RCTBridge;
@class RCTImageSource;

@interface RCTImageView : RCTView

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@property (nonatomic, assign) UIEdgeInsets capInsets
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, strong) UIImage *defaultImage
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) UIImageRenderingMode renderingMode
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) NSArray<RCTImageSource *> *imageSources
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) CGFloat blurRadius
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) RCTResizeMode resizeMode
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) NSString *internal_analyticTag
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
