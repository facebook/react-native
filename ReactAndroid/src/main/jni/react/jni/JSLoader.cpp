// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSLoader.h"

#include <android/asset_manager_jni.h>
#include <cxxreact/JSBigString.h>
#include <fb/fbjni.h>
#include <fb/log.h>
#include <folly/Conv.h>
#include <folly/Memory.h>
#include <fstream>
#include <sstream>
#include <streambuf>
#include <string>

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceSection;
#endif

using namespace facebook::jni;

namespace facebook {
namespace react {

__attribute__((visibility("default")))
AAssetManager *extractAssetManager(alias_ref<JAssetManager::javaobject> assetManager) {
  auto env = Environment::current();
  return AAssetManager_fromJava(env, assetManager.get());
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

  throw std::runtime_error(folly::to<std::string>("Unable to load script from assets '", assetName,
    "'. Make sure your bundle is packaged correctly or you're running a packager server."));
}

}}
