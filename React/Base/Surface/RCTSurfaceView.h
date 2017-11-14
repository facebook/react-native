/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTSurface;

typedef UIView *(^RCTSurfaceActivityIndicatorViewFactory)();

/**
 * UIView instance which represents the Surface
 */
@interface RCTSurfaceView : UIView

- (instancetype)initWithSurface:(RCTSurface *)surface NS_DESIGNATED_INITIALIZER;

@property (nonatomic, copy, nullable) RCTSurfaceActivityIndicatorViewFactory activityIndicatorViewFactory;
@property (nonatomic, weak, readonly, nullable) RCTSurface *surface;

@end

NS_ASSUME_NONNULL_END
