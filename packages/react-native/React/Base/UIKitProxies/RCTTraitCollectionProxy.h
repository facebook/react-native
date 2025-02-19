/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTTraitCollectionProxy : NSObject

+ (instancetype)sharedInstance;

/*
 * Property to access the current trait collection.
 * Thread safe.
 */
@property (nonatomic, readonly) UITraitCollection *currentTraitCollection;

- (void)startObservingTraitCollection;

@end

NS_ASSUME_NONNULL_END
