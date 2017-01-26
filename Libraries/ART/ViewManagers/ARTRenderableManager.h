/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef ARTRENDERABLEMANAGER_H
#define ARTRENDERABLEMANAGER_H

#import "ARTNodeManager.h"
#import "ARTRenderable.h"

@interface ARTRenderableManager : ARTNodeManager

- (ARTRenderable *)node;

@end

#endif //ARTRENDERABLEMANAGER_H
