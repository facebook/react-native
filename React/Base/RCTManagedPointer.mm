/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTManagedPointer.h"

@implementation RCTManagedPointer {
  std::shared_ptr<void> _pointer;
}

- (instancetype)initWithPointer:(std::shared_ptr<void>)pointer {
  if (self = [super init]) {
    _pointer = std::move(pointer);
  }
  return self;
}

- (void *)voidPointer {
  return _pointer.get();
}

@end
