/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if !TARGET_OS_OSX // [macOS]
#import <UIKit/UIKit.h>

@interface RCTModalHostViewController : UIViewController

@property (nonatomic, copy) void (^boundsDidChangeBlock)(CGRect newBounds);

@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientations;

@end
#endif // [macOS]
