/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

#import <React/RCTComponent.h>

#if !TARGET_OS_OSX // [macOS]
@interface RCTSegmentedControl : UISegmentedControl
#else // [macOS
@interface RCTSegmentedControl : NSSegmentedControl
#endif // macOS]

#if TARGET_OS_OSX // [macOS]
@property (nonatomic, assign, getter = isMomentary) BOOL momentary;
#endif // [macOS]

@property (nonatomic, copy) NSArray<NSString *> *values;
@property (nonatomic, assign) NSInteger selectedIndex;
@property (nonatomic, copy) RCTBubblingEventBlock onChange;

@end
