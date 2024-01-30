/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cxxreact/JSExecutor.h>
#include <cxxreact/RAMBundleRegistry.h>
#include <fbjni/fbjni.h>
#include <jni.h>

namespace facebook::react {

/**
 * This executor factory can only create a single executor instance because it
 * moves executorInstance global reference to the executor instance it creates.
 */
class ProxyExecutorOneTimeFactory : public JSExecutorFactory {
 public:
  ProxyExecutorOneTimeFactory(jni::global_ref<jobject>&& executorInstance)
      : m_executor(std::move(executorInstance)) {}
  virtual std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> queue) override;

 private:
  jni::global_ref<jobject> m_executor;
};

class ProxyExecutor : public JSExecutor {
 public:
  ProxyExecutor(
      jni::global_ref<jobject>&& executorInstance,
      std::shared_ptr<ExecutorDelegate> delegate);
  virtual ~ProxyExecutor() override;
  virtual void initializeRuntime() override;
  virtual void loadBundle(
      std::unique_ptr<const JSBigString> script,
      std::string sourceURL) override;
  virtual void setBundleRegistry(
      std::unique_ptr<RAMBundleRegistry> bundle) override;
  virtual void registerBundle(uint32_t bundleId, const std::string& bundlePath)
      override;
  virtual void callFunction(
      const std::string& moduleId,
      const std::string& methodId,
      const folly::dynamic& arguments) override;
  virtual void invokeCallback(
      const double callbackId,
      const folly::dynamic& arguments) override;
  virtual void setGlobalVariable(
      std::string propName,
      std::unique_ptr<const JSBigString> jsonValue) override;
  virtual std::string getDescription() override;

 private:
  jni::global_ref<jobject> m_executor;
  std::shared_ptr<ExecutorDelegate> m_delegate;
};

} // namespace facebook::react
