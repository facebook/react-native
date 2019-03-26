/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Props.h"

#include <fabric/core/propsConversions.h>
#include <folly/dynamic.h>

namespace facebook {
namespace react {

Props::Props(const Props &sourceProps, const RawProps &rawProps):
  nativeId(convertRawProp(rawProps, "nativeID", sourceProps.nativeId)) {};

} // namespace react
} // namespace facebook
