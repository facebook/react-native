// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxreact/Executor.h>

namespace facebook {
namespace react {

/**
 * This class exists so that we have a type for the shared_ptr on ExecutorToken
 * that implements a virtual destructor.
 */
class PlatformExecutorToken {
public:
  virtual ~PlatformExecutorToken() {}
};

/**
 * Class corresponding to a JS VM that can call into native modules. This is
 * passed to native modules to allow their JS module calls/callbacks to be
 * routed back to the proper JS VM on the proper thread.
 */
class ExecutorToken {
public:
  /**
   * This should only be used by the implementation of the platform ExecutorToken.
   * Do not use as a client of ExecutorToken.
   */
  explicit ExecutorToken(std::shared_ptr<PlatformExecutorToken> platformToken) :
      platformToken_(platformToken) {}

  std::shared_ptr<PlatformExecutorToken> getPlatformExecutorToken() const {
    return platformToken_;
  }

  bool operator==(const ExecutorToken& other) const {
    return platformToken_.get() == other.platformToken_.get();
  }

private:
  std::shared_ptr<PlatformExecutorToken> platformToken_;
};

} }

namespace std {
  template<>
  struct hash<facebook::react::ExecutorToken> {
    const size_t operator()(const facebook::react::ExecutorToken& token) const {
      return (size_t) token.getPlatformExecutorToken().get();
    }
  };
}
