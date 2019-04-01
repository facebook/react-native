#ifndef V8_UTILS_H
#define V8_UTILS_H

#include "v8.h"
#include <string>

#include <android/log.h>
#include <cxxreact/JSBigString.h>
#include <cxxreact/Platform.h>
#include <folly/json.h>
#include <folly/Exception.h>
#include <folly/Memory.h>
#include <folly/String.h>
#include <folly/Conv.h>
#include <fcntl.h>

using namespace facebook::react;

#define LOGI(...) do { \
  LogForPriority(Logging::LoggingLevel::INFO, __VA_ARGS__);\
  } while(0)
#define LOGV(...) do { \
  LogForPriority(Logging::LoggingLevel::VERBOSE, __VA_ARGS__);\
  } while(0)

#define LOGW(...) do { \
  LogForPriority(Logging::LoggingLevel::WARNING, __VA_ARGS__);\
  } while(0)
namespace v8 {

  void LogForPriority(Logging::LoggingLevel loggingLevel, const char *fmt, ...);
  
  Local<String> toLocalString(Isolate *isolate, const char *string);

  Local<String> toLocalString(Isolate *isolate, const std::string &string);

  Local<String> toLocalString(Isolate *isolate, const facebook::react::JSBigString &bigString);

  std::string toStdString(const Local<String> &string);

  std::string toJsonStdString(Local<Context> context, const Local<Object> &object);

  Local<String> toJsonString(Local<Context> context, const Local<Object> &object);

  Local<Value> fromJsonString(Local<Context> context, const std::string &jsonStr);

  Local<Value> fromJsonString(Isolate *isolate, Local<Context> context, const char *jsonStr);

  Local<Value> fromJsonString(Isolate *isolate, Local<Context> context, const char *jsonStr, int length);

  Local<Value> fromJsonString(Isolate *isolate, Local<Context> context, const Local<String> &jsonStr);

  Local<Value> fromDynamic(Isolate *isolate, Local<v8::Context> context, const folly::dynamic &value);

  Local<Value> safeToLocal(const MaybeLocal<Value> &maybeLocal);

  std::pair<Local<Uint32>, Local<Uint32>> parseNativeRequireParameters(const v8::FunctionCallbackInfo<v8::Value> &args);

  void nativeLog(const FunctionCallbackInfo<Value> &args);
  void printType(Local<Value> value, const char *desc);
}

#endif //V8_UTILS_H
