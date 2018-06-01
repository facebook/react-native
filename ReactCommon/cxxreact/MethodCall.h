// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
