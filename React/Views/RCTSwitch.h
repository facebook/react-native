/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

#import <React/RCTComponent.h>

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
@interface RCTSwitch : UISwitch
#else // [TODO(macOS ISS#2323203)
@interface RCTSwitch : NSButton
#endif // ]TODO(macOS ISS#2323203)

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
@property (nonatomic, assign) BOOL wasOn;
#else // [TODO(macOS ISS#2323203)
@property (nonatomic, assign) BOOL on;
#endif // ]TODO(macOS ISS#2323203)
@property (nonatomic, copy) RCTBubblingEventBlock onChange;

@end
