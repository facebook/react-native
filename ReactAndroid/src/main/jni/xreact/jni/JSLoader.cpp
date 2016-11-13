// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSLoader.h"

#include <folly/Memory.h>
#include <android/asset_manager_jni.h>
#include <fb/Environment.h>
#include <fstream>
#include <sstream>
#include <streambuf>
#include <string>
#include <fb/log.h>
#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceSection;
#endif

namespace facebook {
namespace react {

static jclass gApplicationHolderClass;
static jmethodID gGetApplicationMethod;
static jmethodID gGetAssetManagerMethod;

std::unique_ptr<const JSBigString> loadScriptFromAssets(const std::string& assetName) {
  JNIEnv *env = jni::Environment::current();
  jobject application = env->CallStaticObjectMethod(
    gApplicationHolderClass,
    gGetApplicationMethod);
  jobject assetManager = env->CallObjectMethod(application, gGetAssetManagerMethod);
  return loadScriptFromAssets(AAssetManager_fromJava(env, assetManager), assetName);
}

__attribute__((visibility("default")))
AAssetManager *extractAssetManager(jobject jassetManager) {
  auto env = jni::Environment::current();
  return AAssetManager_fromJava(env, jassetManager);
}

__attribute__((visibility("default")))
std::unique_ptr<const JSBigString> loadScriptFromAssets(
    AAssetManager *manager,
    const std::string& assetName) {
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "reactbridge_jni_loadScriptFromAssets",
    "assetName", assetName);
  #endif
  if (manager) {
    auto asset = AAssetManager_open(
      manager,
      assetName.c_str(),
      AASSET_MODE_STREAMING); // Optimized for sequential read: see AssetManager.java for docs
    if (asset) {
      auto buf = folly::make_unique<JSBigBufferString>(AAsset_getLength(asset));
      size_t offset = 0;
      int readbytes;
      while ((readbytes = AAsset_read(asset, buf->data() + offset, buf->size() - offset)) > 0) {
        offset += readbytes;
      }
      AAsset_close(asset);
      if (offset == buf->size()) {
        return std::move(buf);
      }
    }
  }
  FBLOGE("Unable to load script from assets: %s", assetName.c_str());
  return folly::make_unique<JSBigStdString>("");
}

std::string loadScriptFromFile(const std::string& fileName) {
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "reactbridge_jni_loadScriptFromFile",
    "fileName", fileName);
  #endif
  std::ifstream jsfile(fileName);
  if (jsfile) {
    std::string output;
    jsfile.seekg(0, std::ios::end);
    output.reserve(jsfile.tellg());
    jsfile.seekg(0, std::ios::beg);
    output.assign(
      (std::istreambuf_iterator<char>(jsfile)),
      std::istreambuf_iterator<char>());
    return output;
  }

  FBLOGE("Unable to load script from file: %s", fileName.c_str());
  return "";
}

void registerJSLoaderNatives() {
  JNIEnv *env = jni::Environment::current();
  jclass applicationHolderClass = env->FindClass("com/facebook/react/common/ApplicationHolder");
  gApplicationHolderClass = (jclass)env->NewGlobalRef(applicationHolderClass);
  gGetApplicationMethod = env->GetStaticMethodID(applicationHolderClass, "getApplication", "()Landroid/app/Application;");

  jclass appClass = env->FindClass("android/app/Application");
  gGetAssetManagerMethod = env->GetMethodID(appClass, "getAssets", "()Landroid/content/res/AssetManager;");
}

} }
