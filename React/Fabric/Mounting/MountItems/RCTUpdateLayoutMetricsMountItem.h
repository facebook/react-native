/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTMountItemProtocol.h>
#import <React/RCTPrimitives.h>
#import <fabric/core/LayoutMetrics.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Updates layout metrics of a component view.
 */
@interface RCTUpdateLayoutMetricsMountItem : NSObject <RCTMountItemProtocol>

- (instancetype)initWithTag:(ReactTag)tag
           oldLayoutMetrics:(facebook::react::LayoutMetrics)oldLayoutMetrics
           newLayoutMetrics:(facebook::react::LayoutMetrics)newLayoutMetrics;

@end

NS_ASSUME_NONNULL_END
