// Copyright 2004-present Facebook. All Rights Reserved.

#include <string>

#include <folly/Memory.h>

#include <fb/fbjni.h>

#include "JMessageQueueThread.h"
#include "JExecutorToken.h"

namespace facebook {
namespace react {

class Instance;
class JavaScriptExecutorHolder;
class ModuleRegistryHolder;
class NativeArray;

struct ReactCallback : public jni::JavaClass<ReactCallback> {
  static constexpr auto kJavaDescriptor =
    "Lcom/facebook/react/cxxbridge/ReactCallback;";
};

class CatalystInstanceImpl : public jni::HybridClass<CatalystInstanceImpl> {
 public:
  static constexpr auto kJavaDescriptor =
    "Lcom/facebook/react/cxxbridge/CatalystInstanceImpl;";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);

  static void registerNatives();

  std::shared_ptr<Instance> getInstance() {
    return instance_;
  }

 private:
  friend HybridBase;

  CatalystInstanceImpl();

  void initializeBridge(
      jni::alias_ref<ReactCallback::javaobject> callback,
      // This executor is actually a factory holder.
      JavaScriptExecutorHolder* jseh,
      jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue,
      jni::alias_ref<JavaMessageQueueThread::javaobject> moduleQueue,
      ModuleRegistryHolder* mrh);
  void loadScriptFromAssets(jobject assetManager, const std::string& assetURL);
  void loadScriptFromFile(jni::alias_ref<jstring> fileName, const std::string& sourceURL);
  void loadScriptFromOptimizedBundle(const std::string& bundlePath, const std::string& sourceURL, jint flags);
  void callJSFunction(JExecutorToken* token, std::string module, std::string method, NativeArray* arguments);
  void callJSCallback(JExecutorToken* token, jint callbackId, NativeArray* arguments);
  local_ref<JExecutorToken::JavaPart> getMainExecutorToken();
  void setGlobalVariable(std::string propName,
                         std::string&& jsonValue);
  jlong getJavaScriptContext();
  void handleMemoryPressureUiHidden();
  void handleMemoryPressureModerate();
  void handleMemoryPressureCritical();
  jboolean supportsProfiling();
  void startProfiler(const std::string& title);
  void stopProfiler(const std::string& title, const std::string& filename);

  // This should be the only long-lived strong reference, but every C++ class
  // will have a weak reference.
  std::shared_ptr<Instance> instance_;
};

}}
