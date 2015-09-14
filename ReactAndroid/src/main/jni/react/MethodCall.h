// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <string>
#include <vector>
#include <map>

#include <folly/dynamic.h>

namespace facebook {
namespace react {

struct MethodCall {
  int moduleId;
  int methodId;
  folly::dynamic arguments;

  MethodCall(int mod, int meth, folly::dynamic args)
    : moduleId(mod)
    , methodId(meth)
    , arguments(std::move(args)) {}
};

std::vector<MethodCall> parseMethodCalls(const std::string& json);

} }
