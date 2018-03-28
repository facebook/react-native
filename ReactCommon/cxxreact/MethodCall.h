// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <map>
#include <string>
#include <vector>

#include <folly/dynamic.h>

namespace facebook {
namespace react {

struct MethodCall {
  int moduleId;
  int methodId;
  folly::dynamic arguments;
  int callId;

  MethodCall(int mod, int meth, folly::dynamic&& args, int cid)
    : moduleId(mod)
    , methodId(meth)
    , arguments(std::move(args))
    , callId(cid) {}
};

std::vector<MethodCall> parseMethodCalls(folly::dynamic&& calls) throw(std::invalid_argument);

} }
