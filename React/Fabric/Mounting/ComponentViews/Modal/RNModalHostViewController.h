/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@protocol RNModalHostViewControllerDelegate <NSObject>
- (void)boundsDidChange:(CGRect)newBounds;
@end

@interface RNModalHostViewController : UIViewController

@property (nonatomic, weak) id<RNModalHostViewControllerDelegate> delegate;

#if !TARGET_OS_TV
@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientations;
#endif

@end
