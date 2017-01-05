/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

@interface ARTBrush : NSObject

/* @abstract */
- (instancetype)initWithArray:(NSArray *)data NS_DESIGNATED_INITIALIZER;

/**
 * For certain brushes we can fast path a combined fill and stroke.
 * For those brushes we override applyFillColor which sets the fill
 * color to be used by those batch paints. Those return YES.
 * We can't batch gradient painting in CoreGraphics, so those will
 * return NO and paint gets called instead.
 * @abstract
 */
- (BOOL)applyFillColor:(CGContextRef)context;

/**
 * paint fills the context with a brush. The context is assumed to
 * be clipped.
 * @abstract
 */
- (void)paint:(CGContextRef)context;

@end
