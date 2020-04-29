/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@protocol ARTContainer <NSObject>

// This is used as a hook for child to mark it's parent as dirty.
// This bubbles up to the root which gets marked as dirty.
- (void)invalidate;

@end
