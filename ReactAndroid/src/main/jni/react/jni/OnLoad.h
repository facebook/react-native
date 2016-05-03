// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <jni.h>
#include <jni/Countable.h>
#include <react/Executor.h>

namespace facebook {
namespace react {

jmethodID getLogMarkerMethod();

struct CountableJSExecutorFactory : JSExecutorFactory, Countable {
  using JSExecutorFactory::JSExecutorFactory;
};

} // namespace react
} // namespace facebook
