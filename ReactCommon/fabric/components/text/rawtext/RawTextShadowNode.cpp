/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawTextShadowNode.h"

#include <fabric/debug/DebugStringConvertibleItem.h>

namespace facebook {
namespace react {

ComponentName RawTextShadowNode::getComponentName() const {
  return ComponentName("RawText");
}

} // namespace react
} // namespace facebook
