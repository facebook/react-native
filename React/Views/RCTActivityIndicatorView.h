/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

@interface RCTActivityIndicatorView : UIActivityIndicatorView

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
@property (nonatomic, assign) UIActivityIndicatorViewStyle activityIndicatorViewStyle;
@property (nonatomic, assign) BOOL hidesWhenStopped;
@property (nullable, readwrite, nonatomic, strong) UIColor *color;
@property (nonatomic, readonly, getter=isAnimating) BOOL animating;
- (void)startAnimating;
- (void)stopAnimating;
#endif // ]TODO(macOS ISS#2323203)

@end
