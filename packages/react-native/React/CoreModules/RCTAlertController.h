/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

#if !TARGET_OS_OSX // [macOS]
@interface RCTAlertController : UIAlertController
#else // [macOS
@interface RCTAlertController : NSViewController
#endif // macOS]

#if !TARGET_OS_OSX // [macOS]
- (void)show:(BOOL)animated completion:(void (^)(void))completion;
- (void)hide;
#endif // [macOS]

@end
