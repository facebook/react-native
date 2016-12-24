/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef ARTGROUP_H
#define ARTGROUP_H

#import <Foundation/Foundation.h>

#import "ARTContainer.h"
#import "ARTNode.h"

@interface ARTGroup : ARTNode <ARTContainer>

@property (nonatomic, assign) CGRect clipping;

@end

#endif //ARTGROUP_H
