// Copyright 2004-present Facebook. All Rights Reserved.

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
