/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

@interface RCTActivityIndicatorView : UIActivityIndicatorView

#if TARGET_OS_OSX // [TODO(macOS GH#774)
@property (nonatomic, assign) UIActivityIndicatorViewStyle activityIndicatorViewStyle;
@property (nonatomic, assign) BOOL hidesWhenStopped;
@property (nullable, readwrite, nonatomic, strong) RCTUIColor *color; // TODO(OSS Candidate ISS#2710739)
@property (nonatomic, readonly, getter=isAnimating) BOOL animating;
- (void)startAnimating;
- (void)stopAnimating;
#endif // ]TODO(macOS GH#774)

@end
