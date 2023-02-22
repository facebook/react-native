/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef __cplusplus

#include <memory>

#import <Foundation/Foundation.h>

/**
 * Type erased wrapper over any cxx value that can be passed as an argument
 * to native method.
 */

@interface RCTManagedPointer : NSObject

@property (nonatomic, readonly) void *voidPointer;

- (instancetype)initWithPointer:(std::shared_ptr<void>)pointer;

@end

namespace facebook {
namespace react {

template <typename T, typename P>
RCTManagedPointer *managedPointer(P initializer)
{
  auto ptr = std::shared_ptr<void>(new T(initializer));
  return [[RCTManagedPointer alloc] initWithPointer:std::move(ptr)];
}

}
}

#endif
