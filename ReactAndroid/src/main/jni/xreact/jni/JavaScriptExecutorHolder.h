// Copyright 2004-present Facebook. All Rights Reserved.

#include <memory>

#include <fb/fbjni.h>

#include <cxxreact/Executor.h>

namespace facebook {
namespace react {

class JavaScriptExecutorHolder : public jni::HybridClass<JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor =
    "Lcom/facebook/react/bridge/JavaScriptExecutor;";

  std::shared_ptr<JSExecutorFactory> getExecutorFactory() {
    return mExecutorFactory;
  }

 protected:
  JavaScriptExecutorHolder(std::shared_ptr<JSExecutorFactory> factory)
      : mExecutorFactory(factory) {}

 private:
  std::shared_ptr<JSExecutorFactory> mExecutorFactory;
};

}}
