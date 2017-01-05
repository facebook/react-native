/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@protocol ARTContainer <NSObject>

// This is used as a hook for child to mark it's parent as dirty.
// This bubbles up to the root which gets marked as dirty.
- (void)invalidate;

@end
