/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

#import <React/RCTResizeMode.h>

@class RCTBridge;
@class RCTImageSource;

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
typedef NS_ENUM(NSInteger, UIImageRenderingMode) {
    UIImageRenderingModeAlwaysOriginal,
    UIImageRenderingModeAlwaysTemplate,
};
#endif

#if !TARGET_OS_OSX // ]TODO(macOS ISS#2323203)
@interface RCTImageView : UIImageView
#else // [TODO(macOS ISS#2323203)
@interface RCTImageView : NSImageView
#endif // ]TODO(macOS ISS#2323203)

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@property (nonatomic, assign) UIEdgeInsets capInsets;
@property (nonatomic, strong) UIImage *defaultImage;
@property (nonatomic, assign) UIImageRenderingMode renderingMode;
@property (nonatomic, copy) NSArray<RCTImageSource *> *imageSources;
@property (nonatomic, assign) CGFloat blurRadius;
@property (nonatomic, assign) RCTResizeMode resizeMode;

@end
