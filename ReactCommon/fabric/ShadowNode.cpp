/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNode.h"

namespace facebook {
namespace react {

ShadowNode::ShadowNode(int reactTag, std::string viewName, int rootTag, folly::dynamic props, void *instanceHandle) :
  reactTag_(reactTag),
  viewName_(viewName),
  rootTag_(rootTag),
  props_(props),
  instanceHandle_(instanceHandle) {}

}}
