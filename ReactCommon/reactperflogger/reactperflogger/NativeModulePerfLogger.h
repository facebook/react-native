/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <memory>

namespace facebook {
namespace react {

/**
 * A platform-agnostic interface to do performance logging on NativeModules and
 * TuboModules.
 */
class NativeModulePerfLogger {
 private:
  static std::shared_ptr<NativeModulePerfLogger> s_perfLogger;

 public:
  static NativeModulePerfLogger &getInstance();
  static void setInstance(std::shared_ptr<NativeModulePerfLogger> perfLogger);

  virtual ~NativeModulePerfLogger();

  /**
   * NativeModule Initialization.
   *
   * The initialization of two NativeModules can interleave. Therefore,
   * performance markers should use the moduleName as a unique key.
   */

  /**
   * On iOS:
   *   - NativeModule initialization is split into two phases, which sometimes
   *     have a pause in the middle.
   *   - TurboModule initialization happens all at once.
   *
   * On Android:
   *   - NativeModule and TurboModule initialization happens all at once.
   *
   * These markers are meant for iOS NativeModules:
   *  - moduleDataCreateStart: very beginning of first phase.
   *  - moduleDataCreateEnd: after RCTModuleData has been created.
   */
  virtual void moduleDataCreateStart(const char *moduleName, int32_t id);
  virtual void moduleDataCreateEnd(const char *moduleName, int32_t id);

  /**
   * How long does it take to create the platform NativeModule object?
   *   - moduleCreateStart: start creating platform NativeModule
   *   - moduleCreateEnd: stop creating platform NativeModule
   */
  virtual void moduleCreateStart(const char *moduleName, int32_t id);
  virtual void moduleCreateCacheHit(const char *moduleName, int32_t id);
  virtual void moduleCreateConstructStart(const char *moduleName, int32_t id);
  virtual void moduleCreateConstructEnd(const char *moduleName, int32_t id);
  virtual void moduleCreateSetUpStart(const char *moduleName, int32_t id);
  virtual void moduleCreateSetUpEnd(const char *moduleName, int32_t id);
  virtual void moduleCreateEnd(const char *moduleName, int32_t id);
  virtual void moduleCreateFail(const char *moduleName, int32_t id);

  /**
   * How long, after starting JS require, does it take to start creating the
   * platform NativeModule?
   *   - moduleJSRequireBeginningStart: start of JS require
   *   - moduleJSRequireBeginningEnd: start creating platform NativeModule
   */
  virtual void moduleJSRequireBeginningStart(const char *moduleName);
  virtual void moduleJSRequireBeginningCacheHit(const char *moduleName);
  virtual void moduleJSRequireBeginningEnd(const char *moduleName);
  virtual void moduleJSRequireBeginningFail(const char *moduleName);

  /**
   * How long does it take to return from the JS require after the platform
   * NativeModule is created?
   *   - moduleJSRequireEndingStart: end creating platform NativeModule
   *   - moduleJSRequireEndingEnd: end of JS require
   */
  virtual void moduleJSRequireEndingStart(const char *moduleName);
  virtual void moduleJSRequireEndingEnd(const char *moduleName);
  virtual void moduleJSRequireEndingFail(const char *moduleName);

  // Sync method calls
  virtual void syncMethodCallStart(
      const char *moduleName,
      const char *methodName);
  virtual void syncMethodCallArgConversionStart(
      const char *moduleName,
      const char *methodName);
  virtual void syncMethodCallArgConversionEnd(
      const char *moduleName,
      const char *methodName);
  virtual void syncMethodCallExecutionStart(
      const char *moduleName,
      const char *methodName);
  virtual void syncMethodCallExecutionEnd(
      const char *moduleName,
      const char *methodName);
  virtual void syncMethodCallReturnConversionStart(
      const char *moduleName,
      const char *methodName);
  virtual void syncMethodCallReturnConversionEnd(
      const char *moduleName,
      const char *methodName);
  virtual void syncMethodCallEnd(
      const char *moduleName,
      const char *methodName);
  virtual void syncMethodCallFail(
      const char *moduleName,
      const char *methodName);

  // Async method calls
  virtual void asyncMethodCallStart(
      const char *moduleName,
      const char *methodName);
  virtual void asyncMethodCallArgConversionStart(
      const char *moduleName,
      const char *methodName);
  virtual void asyncMethodCallArgConversionEnd(
      const char *moduleName,
      const char *methodName);
  virtual void asyncMethodCallDispatch(
      const char *moduleName,
      const char *methodName);
  virtual void asyncMethodCallEnd(
      const char *moduleName,
      const char *methodName);

  /**
   * In the NativeModule system, we batch async NativeModule method calls.
   * When we execute a batch of NativeModule method calls, we convert the batch
   * from a jsi::Value to folly::dynamic to std::vector<MethodCall>. This marker
   * documents that work.
   */
  virtual void asyncMethodCallBatchPreprocessStart();
  virtual void asyncMethodCallBatchPreprocessEnd(int batchSize);

  // Async method call execution
  virtual void asyncMethodCallExecutionStart(
      const char *moduleName,
      const char *methodName,
      int32_t id);
  virtual void asyncMethodCallExecutionArgConversionStart(
      const char *moduleName,
      const char *methodName,
      int32_t id);
  virtual void asyncMethodCallExecutionArgConversionEnd(
      const char *moduleName,
      const char *methodName,
      int32_t id);
  virtual void asyncMethodCallExecutionEnd(
      const char *moduleName,
      const char *methodName,
      int32_t id);
  virtual void asyncMethodCallExecutionFail(
      const char *moduleName,
      const char *methodName,
      int32_t id);
};

} // namespace react
} // namespace facebook
