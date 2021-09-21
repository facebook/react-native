/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)
#import "RCTLogBoxView.h"

@interface RCTLogBox : NSObject

#if RCT_DEV_MENU

- (void)setRCTLogBoxWindow:(RCTLogBoxWindow *)window; // TODO(macOS GH#774) Renamed from _view to _window

#endif

@end
