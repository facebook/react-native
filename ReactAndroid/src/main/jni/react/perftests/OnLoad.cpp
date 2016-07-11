// Copyright 2004-present Facebook. All Rights Reserved.

#include <fb/log.h>
#include <fb/Environment.h>
#include <jni/LocalString.h>
#include <jni/Registration.h>

namespace facebook {
namespace react {

namespace logwatcher {

static std::string gMessageToLookFor;
static int gMessagePriorityToLookFor;
static bool gHasSeenMessage = false;

/**
 * NB: Don't put JNI logic (or anything else that could trigger a log) here!
 */
static void stubLogHandler(int pri, const char *tag, const char *msg) {
  if (gMessageToLookFor.empty()) {
    return;
  }

  bool priorityMatches = pri == gMessagePriorityToLookFor;
  bool substringFound = strstr(msg, gMessageToLookFor.c_str()) != NULL;
  gHasSeenMessage |= priorityMatches && substringFound;
}

static jboolean hasSeenExpectedLogMessage() {
  return gHasSeenMessage ? JNI_TRUE : JNI_FALSE;
}

static void stopWatchingLogMessages(JNIEnv* env, jclass loggerClass) {
  gMessageToLookFor = "";
  gHasSeenMessage = false;
  setLogHandler(NULL);
}

static void startWatchingForLogMessage(JNIEnv* env, jclass loggerClass, jstring jmsg, jint priority) {
  stopWatchingLogMessages(env, loggerClass);
  gMessageToLookFor = jni::fromJString(env, jmsg);
  gMessagePriorityToLookFor = priority;
  setLogHandler(&stubLogHandler);
}

} // namespace logwatcher

extern "C" jint JNI_OnLoad(JavaVM* vm, void* reserved) {
  // get the current env
  JNIEnv* env;
  if (vm->GetEnv(reinterpret_cast<void**>(&env), JNI_VERSION_1_4) != JNI_OK) {
    return -1;
  }

  jni::registerNatives(env, "com/facebook/catalyst/testing/LogWatcher", {
    { "startWatchingForLogMessage", "(Ljava/lang/String;I)V", (void*) logwatcher::startWatchingForLogMessage},
    { "stopWatchingLogMessages", "()V", (void*) logwatcher::stopWatchingLogMessages },
    { "hasSeenExpectedLogMessage", "()Z", (void*) logwatcher::hasSeenExpectedLogMessage },
  });

  return JNI_VERSION_1_4;
}

} }
