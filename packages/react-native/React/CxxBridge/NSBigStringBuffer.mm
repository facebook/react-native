/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "NSBigStringBuffer.h"

@implementation NSBigStringBuffer

- (instancetype)initWithSharedPtr:(const std::shared_ptr<const BigStringBuffer>&)buffer {
    if (self = [super init]) {
        _buffer = buffer;
    }
    return self;
}

- (const std::shared_ptr<const BigStringBuffer>&)getBuffer {
    return _buffer;
}

@end
