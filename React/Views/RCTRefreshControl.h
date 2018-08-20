/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponent.h>
#import <React/RCTScrollableProtocol.h>

@interface RCTRefreshControl : UIRefreshControl <RCTCustomRefreshContolProtocol>

@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) RCTDirectEventBlock onRefresh;

@end
