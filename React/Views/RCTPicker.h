/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/UIView+React.h>
#import <React/RCTUIKit.h> // TODO(OSS Candidate ISS#2710739)

#if !TARGET_OS_OSX // TODO(OSS Candidate ISS#2710739)
@interface RCTPicker : UIPickerView
#else // [TODO(OSS Candidate ISS#2710739)
@interface RCTPicker : NSComboBox
#endif // ]TODO(OSS Candidate ISS#2710739)

@property (nonatomic, copy) NSArray<NSDictionary *> *items;
@property (nonatomic, assign) NSInteger selectedIndex;

@property (nonatomic, strong) UIColor *color;
@property (nonatomic, strong) UIFont *font;
@property (nonatomic, assign) NSTextAlignment textAlign;

@property (nonatomic, copy) RCTBubblingEventBlock onChange;

@end
