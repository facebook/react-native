/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef ARTTEXT_H
#define ARTTEXT_H

#import <Foundation/Foundation.h>

#import "ARTRenderable.h"
#import "ARTTextFrame.h"

@interface ARTText : ARTRenderable

@property (nonatomic, assign) CTTextAlignment alignment;
@property (nonatomic, assign) ARTTextFrame textFrame;

@end

#endif //ARTTEXT_H
