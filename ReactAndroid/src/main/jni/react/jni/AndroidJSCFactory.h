// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>
#include <cxxreact/JSExecutor.h>

namespace folly {

class dynamic;

}

namespace facebook {
namespace react {

class JSExecutorFactory;

namespace detail {

// This is only exposed so instrumentation tests can call it.
void injectJSCExecutorAndroidPlatform();

}

std::unique_ptr<JSExecutorFactory> makeAndroidJSCExecutorFactory(
    const folly::dynamic& jscConfig);

}
}
