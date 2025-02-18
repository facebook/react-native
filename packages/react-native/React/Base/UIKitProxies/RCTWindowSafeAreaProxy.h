/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTWindowSafeAreaProxy : NSObject

+ (instancetype)sharedInstance;

/*
 * Property to access the current safe area insets of the window, read-only.
 * Thread safe.
 */
@property (nonatomic, readonly) UIEdgeInsets currentSafeAreaInsets;

- (void)startObservingSafeArea;

@end

NS_ASSUME_NONNULL_END
