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
  int callId;

  MethodCall(int mod, int meth, folly::dynamic args, int cid)
    : moduleId(mod)
    , methodId(meth)
    , arguments(std::move(args))
    , callId(cid) {}
};

std::vector<MethodCall> parseMethodCalls(const std::string& json) throw(std::invalid_argument);

} }
