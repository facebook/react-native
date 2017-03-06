/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#include <folly/dynamic.h>

namespace facebook {
namespace react {

folly::dynamic convertIdToFollyDynamic(id json);
id convertFollyDynamicToId(const folly::dynamic &dyn);

} }
