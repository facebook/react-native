/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef ARTSHAPE_H
#define ARTSHAPE_H

#import <Foundation/Foundation.h>

#import "ARTRenderable.h"

@interface ARTShape : ARTRenderable

@property (nonatomic, assign) CGPathRef d;

@end

#endif //ARTSHAPE_H
