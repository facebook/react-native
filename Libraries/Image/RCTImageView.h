/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)
#if !TARGET_OS_OSX // [TODO(macOS GH#774)
#import <UIKit/UIKit.h>
#else // [TODO(macOS GH#774)
typedef NS_ENUM(NSInteger, UIImageRenderingMode) {
    UIImageRenderingModeAlwaysOriginal,
    UIImageRenderingModeAlwaysTemplate,
};
#endif // ]TODO(macOS GH#774)
#import <React/RCTView.h>
#import <React/RCTResizeMode.h>

@class RCTBridge;
@class RCTImageSource;

@interface RCTImageView : RCTView

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@property (nonatomic, assign) UIEdgeInsets capInsets;
@property (nonatomic, strong) UIImage *defaultImage;
@property (nonatomic, assign) UIImageRenderingMode renderingMode;
@property (nonatomic, copy) NSArray<RCTImageSource *> *imageSources;
@property (nonatomic, assign) CGFloat blurRadius;
@property (nonatomic, assign) RCTResizeMode resizeMode;
@property (nonatomic, copy) NSString *internal_analyticTag;

#if TARGET_OS_OSX // [TODO(macOS GH#774)
@property (nonatomic, copy) NSColor *tintColor;
#endif // ]TODO(macOS GH#774)
@end
