// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <fb/fbjni.h>
#include <react/ExecutorTokenFactory.h>

#include "JExecutorToken.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

class JExecutorTokenFactory : public ExecutorTokenFactory {
public:
  virtual ExecutorToken createExecutorToken() const override {
    auto jExecutorToken = JExecutorToken::newObjectCxxArgs();
    auto jExecutorTokenNativePart = cthis(jExecutorToken);
    return jExecutorTokenNativePart->getExecutorToken(jExecutorToken);
  }
};

} }
