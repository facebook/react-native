// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <folly/dynamic.h>
#include <memory>

namespace facebook {
namespace react {

class ShadowNode {
public:
  int reactTag_;
  std::string viewName_;
  int rootTag_;
  folly::dynamic props_;
  void *instanceHandle_;

  ShadowNode(int reactTag, std::string viewName, int rootTag, folly::dynamic props, void *instanceHandle);
};

}}
