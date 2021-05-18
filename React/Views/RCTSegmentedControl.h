/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#import <React/RCTComponent.h>

#if !TARGET_OS_OSX // TODO(macOS GH#774)
@interface RCTSegmentedControl : UISegmentedControl
#else // [TODO(macOS GH#774)
@interface RCTSegmentedControl : NSSegmentedControl
#endif // ]TODO(macOS GH#774)

#if TARGET_OS_OSX // [TODO(macOS GH#774)
@property (nonatomic, assign, getter = isMomentary) BOOL momentary;
#endif // ]TODO(macOS GH#774)

@property (nonatomic, copy) NSArray<NSString *> *values;
@property (nonatomic, assign) NSInteger selectedIndex;
@property (nonatomic, copy) RCTBubblingEventBlock onChange;

@end
