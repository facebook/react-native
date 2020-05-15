/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeModulePerfLogger.h"

namespace facebook {
namespace react {

std::shared_ptr<NativeModulePerfLogger> NativeModulePerfLogger::s_perfLogger =
    nullptr;

NativeModulePerfLogger &NativeModulePerfLogger::getInstance() {
  static std::shared_ptr<NativeModulePerfLogger> defaultPerfLogger =
      std::make_shared<NativeModulePerfLogger>();
  return s_perfLogger ? *s_perfLogger : *defaultPerfLogger;
}
void NativeModulePerfLogger::setInstance(
    std::shared_ptr<NativeModulePerfLogger> newPerfLogger) {
  s_perfLogger = newPerfLogger;
}

NativeModulePerfLogger::~NativeModulePerfLogger() {}

void NativeModulePerfLogger::moduleDataCreateStart(
    const char *moduleName,
    int32_t id) {}
void NativeModulePerfLogger::moduleDataCreateEnd(
    const char *moduleName,
    int32_t id) {}

void NativeModulePerfLogger::moduleCreateStart(
    const char *moduleName,
    int32_t id) {}
void NativeModulePerfLogger::moduleCreateCacheHit(
    const char *moduleName,
    int32_t id) {}
void NativeModulePerfLogger::moduleCreateConstructStart(
    const char *moduleName,
    int32_t id) {}
void NativeModulePerfLogger::moduleCreateConstructEnd(
    const char *moduleName,
    int32_t id) {}
void NativeModulePerfLogger::moduleCreateSetUpStart(
    const char *moduleName,
    int32_t id) {}
void NativeModulePerfLogger::moduleCreateSetUpEnd(
    const char *moduleName,
    int32_t id) {}
void NativeModulePerfLogger::moduleCreateEnd(
    const char *moduleName,
    int32_t id) {}
void NativeModulePerfLogger::moduleCreateFail(
    const char *moduleName,
    int32_t id) {}

void NativeModulePerfLogger::moduleJSRequireBeginningStart(
    const char *moduleName) {}
void NativeModulePerfLogger::moduleJSRequireBeginningCacheHit(
    const char *moduleName) {}
void NativeModulePerfLogger::moduleJSRequireBeginningEnd(
    const char *moduleName) {}
void NativeModulePerfLogger::moduleJSRequireBeginningFail(
    const char *moduleName) {}

void NativeModulePerfLogger::moduleJSRequireEndingStart(
    const char *moduleName) {}
void NativeModulePerfLogger::moduleJSRequireEndingEnd(const char *moduleName) {}
void NativeModulePerfLogger::moduleJSRequireEndingFail(const char *moduleName) {
}

void NativeModulePerfLogger::syncMethodCallStart(
    const char *moduleName,
    const char *methodName) {}
void NativeModulePerfLogger::syncMethodCallArgConversionStart(
    const char *moduleName,
    const char *methodName) {}
void NativeModulePerfLogger::syncMethodCallArgConversionEnd(
    const char *moduleName,
    const char *methodName) {}
void NativeModulePerfLogger::syncMethodCallExecutionStart(
    const char *moduleName,
    const char *methodName) {}
void NativeModulePerfLogger::syncMethodCallExecutionEnd(
    const char *moduleName,
    const char *methodName) {}
void NativeModulePerfLogger::syncMethodCallReturnConversionStart(
    const char *moduleName,
    const char *methodName) {}
void NativeModulePerfLogger::syncMethodCallReturnConversionEnd(
    const char *moduleName,
    const char *methodName) {}
void NativeModulePerfLogger::syncMethodCallEnd(
    const char *moduleName,
    const char *methodName) {}
void NativeModulePerfLogger::syncMethodCallFail(
    const char *moduleName,
    const char *methodName) {}

void NativeModulePerfLogger::asyncMethodCallStart(
    const char *moduleName,
    const char *methodName) {}
void NativeModulePerfLogger::asyncMethodCallArgConversionStart(
    const char *moduleName,
    const char *methodName) {}
void NativeModulePerfLogger::asyncMethodCallArgConversionEnd(
    const char *moduleName,
    const char *methodName) {}
void NativeModulePerfLogger::asyncMethodCallDispatch(
    const char *moduleName,
    const char *methodName) {}
void NativeModulePerfLogger::asyncMethodCallEnd(
    const char *moduleName,
    const char *methodName) {}

void NativeModulePerfLogger::asyncMethodCallBatchPreprocessStart() {}
void NativeModulePerfLogger::asyncMethodCallBatchPreprocessEnd(int batchSize) {}

void NativeModulePerfLogger::asyncMethodCallExecutionStart(
    const char *moduleName,
    const char *methodName,
    int32_t id) {}
void NativeModulePerfLogger::asyncMethodCallExecutionArgConversionStart(
    const char *moduleName,
    const char *methodName,
    int32_t id) {}
void NativeModulePerfLogger::asyncMethodCallExecutionArgConversionEnd(
    const char *moduleName,
    const char *methodName,
    int32_t id) {}
void NativeModulePerfLogger::asyncMethodCallExecutionEnd(
    const char *moduleName,
    const char *methodName,
    int32_t id) {}
void NativeModulePerfLogger::asyncMethodCallExecutionFail(
    const char *moduleName,
    const char *methodName,
    int32_t id) {}

} // namespace react
} // namespace facebook
