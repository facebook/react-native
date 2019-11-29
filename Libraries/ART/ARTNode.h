/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/UIView+React.h>

/**
 * ART nodes are implemented as empty UIViews but this is just an implementation detail to fit
 * into the existing view management. They should also be shadow views and painted on a background
 * thread.
 */

@interface ARTNode : UIView

@property (nonatomic, assign) CGFloat opacity;

- (void)invalidate;
- (void)renderTo:(CGContextRef)context;

/**
 * renderTo will take opacity into account and draw renderLayerTo off-screen if there is opacity
 * specified, then composite that onto the context. renderLayerTo always draws at opacity=1.
 * @abstract
 */
- (void)renderLayerTo:(CGContextRef)context;

@end
