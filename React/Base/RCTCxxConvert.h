/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

/**
 * This class provides a collection of conversion functions for mapping
 * JSON objects to cxx types. Extensible via categories.
 * Convert methods are expected to return cxx objects wraped in RCTManagedPointer.
 */

@interface RCTCxxConvert : NSObject

@end
