/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if !TARGET_OS_OSX // [macOS]
#import <UIKit/UIKit.h>

#import <React/RCTComponent.h>
#import <React/RCTScrollableProtocol.h>

@interface RCTRefreshControl : UIRefreshControl <RCTCustomRefreshControlProtocol>

@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) RCTDirectEventBlock onRefresh;
@property (nonatomic, weak) RCTUIScrollView *scrollView; // [macOS]

@end
#endif // [macOS]
