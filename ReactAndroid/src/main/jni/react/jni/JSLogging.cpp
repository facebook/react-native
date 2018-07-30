// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "JSLogging.h"

#include <fb/Environment.h>
#include <fb/log.h>

#include <jni/LocalReference.h>
#include <jni/LocalString.h>

using namespace facebook::jni;

namespace facebook {
namespace react {
namespace JSLogging {

static jclass gLoggerClass;
static jmethodID gVerboseLogMethod;
static jmethodID gDebugLogMethod;
static jmethodID gInfoLogMethod;
static jmethodID gWarnLogMethod;
static jmethodID gErrorLogMethod;

jmethodID priorityToMethodId(int logLevel) {
  jmethodID methodId;
  switch (logLevel) {
    case ANDROID_LOG_VERBOSE:
      methodId = gVerboseLogMethod;
      break;
    case ANDROID_LOG_DEBUG:
      methodId = gDebugLogMethod;
      break;
    case ANDROID_LOG_INFO:
      methodId = gInfoLogMethod;
      break;
    case ANDROID_LOG_WARN:
      methodId = gWarnLogMethod;
      break;
    case ANDROID_LOG_ERROR:
    case ANDROID_LOG_FATAL:
      methodId = gErrorLogMethod;
      break;
    default:
      methodId = gVerboseLogMethod;
  }
  return methodId;
}

void reactAndroidLoggingHook(
    const std::string& message,
    android_LogPriority logLevel) {
  FBLOG_PRI(logLevel, "ReactNativeJS", "%s", message.c_str());
}

void reactAndroidLoggingHook(
    const std::string& message,
    unsigned int logLevel) {
  reactAndroidLoggingHook(
      message, static_cast<android_LogPriority>(logLevel + ANDROID_LOG_DEBUG));
}

void androidLogHandler(int prio, const char* tag, const char* message) {
  ThreadScope threadScope;
  JNIEnv *env = Environment::current();
  LocalString tagString(tag);
  LocalString messageString(message);
  env->CallStaticVoidMethod(gLoggerClass, priorityToMethodId(prio), tagString.string(), messageString.string());
}

void registerNatives() {
  JNIEnv* env = Environment::current();
  jclass loggerClass = env->FindClass("com/facebook/common/logging/FLog");
  gLoggerClass = (jclass)env->NewGlobalRef(loggerClass);
  gVerboseLogMethod = env->GetStaticMethodID(loggerClass, "v", "(Ljava/lang/String;Ljava/lang/String;)V");
  gDebugLogMethod = env->GetStaticMethodID(loggerClass, "d", "(Ljava/lang/String;Ljava/lang/String;)V");
  gInfoLogMethod = env->GetStaticMethodID(loggerClass, "i", "(Ljava/lang/String;Ljava/lang/String;)V");
  gWarnLogMethod = env->GetStaticMethodID(loggerClass, "w", "(Ljava/lang/String;Ljava/lang/String;)V");
  gErrorLogMethod = env->GetStaticMethodID(loggerClass, "e", "(Ljava/lang/String;Ljava/lang/String;)V");
  setLogHandler(androidLogHandler);
}

} // namespace JSLogging
} // namespace react
} // namespace facebook
