/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "ARTContainer.h"
#import "ARTNode.h"

@interface ARTGroup : ARTNode <ARTContainer>

@property (nonatomic, assign) CGRect clipping;

@end
