/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#ifdef __cplusplus
#import <jsireact/JSIExecutor.h>
#import <memory>

using namespace facebook;
using namespace facebook::react;
#endif // __cplusplus

@interface NSBigStringBuffer : NSObject
#ifdef __cplusplus

{
  std::shared_ptr<const BigStringBuffer> _buffer;
}

- (instancetype)initWithSharedPtr:(const std::shared_ptr<const BigStringBuffer> &)buffer;
- (const std::shared_ptr<const BigStringBuffer> &)getBuffer;
#endif // __cplusplus

@end
