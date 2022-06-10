/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>
#import <React/RCTInvalidating.h>
#import <React/RCTViewManager.h>

@interface RCTConvert (RCTModalHostView)

+ (UIModalPresentationStyle)UIModalPresentationStyle:(id)json;

@end

typedef void (^RCTModalViewInteractionBlock)(
    UIViewController *reactViewController,
    UIViewController *viewController,
    BOOL animated,
    dispatch_block_t completionBlock);

@interface RCTModalHostViewManager : RCTViewManager <RCTInvalidating>

/**
 * `presentationBlock` and `dismissalBlock` allow you to control how a Modal interacts with your case,
 * e.g. in case you have a native navigator that has its own way to display a modal.
 * If these are not specified, it falls back to the UIViewController standard way of presenting.
 */
@property (nonatomic, strong) RCTModalViewInteractionBlock presentationBlock;
@property (nonatomic, strong) RCTModalViewInteractionBlock dismissalBlock;

@end
