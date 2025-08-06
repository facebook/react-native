/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

@interface RCTModalHostViewController : UIViewController

@property (nonatomic, copy) void (^boundsDidChangeBlock)(CGRect newBounds);

@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientations;

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
