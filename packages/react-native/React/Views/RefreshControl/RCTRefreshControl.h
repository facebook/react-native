/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

#import <React/RCTComponent.h>
#import <React/RCTScrollableProtocol.h>

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTRefreshControl : UIRefreshControl<RCTCustomRefreshControlProtocol>

@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) RCTDirectEventBlock onRefresh;
@property (nonatomic, weak) UIScrollView *scrollView;

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
