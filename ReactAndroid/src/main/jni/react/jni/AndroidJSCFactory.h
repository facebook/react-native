// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>

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
    const folly::dynamic& jscConfig, std::function<folly::dynamic(const std::string&)> nativeExtensionsProvider);

}
}
