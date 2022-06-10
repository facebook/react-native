/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#if TARGET_OS_OSX // [TODO(macOS GH#774)
@interface RCTAlertController : NSViewController
#else
@interface RCTAlertController : UIAlertController
#endif // ]TODO(macOS GH#774)

#if !TARGET_OS_OSX // [TODO(macOS GH#774)
- (void)show:(BOOL)animated completion:(void (^)(void))completion;
- (void)hide;
#endif // ]TODO(macOS GH#774)

@end
