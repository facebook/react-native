/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@protocol RCTMountingTransactionObserving
@end

@protocol RCTVirtualViewContainerProtocol
@end

@class RCTViewComponentView;

/**
 * Test case for multi-line Objective-C interface declarations.
 *
 * Doxygen misparses interface declarations that span multiple lines,
 * creating __pad0__ members and losing inheritance information.
 *
 * This interface is SKIPPED in the parser output due to malformed Doxygen XML.
 * See SKIP_INTERFACES in builders.py.
 */
@interface RCTScrollViewComponentView
    : RCTViewComponentView <RCTMountingTransactionObserving, RCTVirtualViewContainerProtocol>

+ (nullable RCTScrollViewComponentView *)findScrollViewComponentViewForView:(UIView *)view;

@end
