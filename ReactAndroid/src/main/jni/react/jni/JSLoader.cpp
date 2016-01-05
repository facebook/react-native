// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSLoader.h"

#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>
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

std::string loadScriptFromAssets(
    JNIEnv *env,
    jobject assetManager,
    std::string assetName) {
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "reactbridge_jni_loadScriptFromAssets",
    "assetName", assetName);
  #endif

  auto manager = AAssetManager_fromJava(env, assetManager);
  if (manager) {
    auto asset = AAssetManager_open(
      manager,
      assetName.c_str(),
      AASSET_MODE_STREAMING); // Optimized for sequential read: see AssetManager.java for docs
    if (asset) {
      std::stringbuf buf;
      char BUF[0x800];
      int readbytes;
      while ((readbytes = AAsset_read(asset, BUF, sizeof(BUF))) > 0) {
        buf.sputn(BUF, readbytes);
      }
      AAsset_close(asset);
      if (readbytes == 0) { // EOF!
        return buf.str();
      }
    }
  }
  FBLOGE("Unable to load script from assets: %s", assetName.c_str());
  return "";
}

std::string loadScriptFromFile(std::string fileName) {
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

} }