/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#import <React/RCTComponent.h>

#if !TARGET_OS_OSX // TODO(macOS GH#774)
@interface RCTSwitch : UISwitch
#else // [TODO(macOS GH#774)
@interface RCTSwitch : NSSwitch
#endif // ]TODO(macOS GH#774)

#if !TARGET_OS_OSX // TODO(macOS GH#774)
@property (nonatomic, assign) BOOL wasOn;
#else // [TODO(macOS GH#774)
@property (nonatomic, assign) BOOL on;
- (void)setOn:(BOOL)on animated:(BOOL)animated;
#endif // ]TODO(macOS GH#774)
@property (nonatomic, copy) RCTBubblingEventBlock onChange;

@end
