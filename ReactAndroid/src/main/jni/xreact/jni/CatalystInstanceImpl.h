// Copyright 2004-present Facebook. All Rights Reserved.

#include <string>

#include <fb/fbjni.h>
#include <folly/Memory.h>

#include "CxxModuleWrapper.h"
#include "JExecutorToken.h"
#include "JMessageQueueThread.h"
#include "JSLoader.h"
#include "JavaModuleWrapper.h"

namespace facebook {
namespace react {

class Instance;
class JavaScriptExecutorHolder;
class NativeArray;

struct ReactCallback : public jni::JavaClass<ReactCallback> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/cxxbridge/ReactCallback;";
};

class CatalystInstanceImpl : public jni::HybridClass<CatalystInstanceImpl> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/cxxbridge/CatalystInstanceImpl;";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);

  static void registerNatives();

  std::shared_ptr<Instance> getInstance() {
    return instance_;
  }

 private:
  friend HybridBase;

  CatalystInstanceImpl();

  static bool isIndexedRAMBundle(const char *sourcePath);

  void initializeBridge(
      jni::alias_ref<ReactCallback::javaobject> callback,
      // This executor is actually a factory holder.
      JavaScriptExecutorHolder* jseh,
      jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue,
      jni::alias_ref<JavaMessageQueueThread::javaobject> moduleQueue,
      jni::alias_ref<jni::JCollection<JavaModuleWrapper::javaobject>::javaobject> javaModules,
      jni::alias_ref<jni::JCollection<CxxModuleWrapper::javaobject>::javaobject> cxxModules);

  /**
   * Sets the source URL of the underlying bridge without loading any JS code.
   */
  void jniSetSourceURL(const std::string& sourceURL);

  void jniLoadScriptFromAssets(jni::alias_ref<JAssetManager::javaobject> assetManager, const std::string& assetURL);
  void jniLoadScriptFromFile(const std::string& fileName, const std::string& sourceURL);
  void jniCallJSFunction(JExecutorToken* token, std::string module, std::string method, NativeArray* arguments);
  void jniCallJSCallback(JExecutorToken* token, jint callbackId, NativeArray* arguments);
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
