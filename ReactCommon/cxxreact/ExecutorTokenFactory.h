// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxreact/Executor.h>
#include <cxxreact/ExecutorToken.h>

namespace facebook {
namespace react {

/**
 * Class that knows how to create the platform-specific implementation
 * of ExecutorToken.
 */
class ExecutorTokenFactory {
public:
  virtual ~ExecutorTokenFactory() {}

  /**
   * Creates a new ExecutorToken.
   */
  virtual ExecutorToken createExecutorToken() const = 0;
};

} }
