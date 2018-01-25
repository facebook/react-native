// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <string>

#include <android/asset_manager.h>
#include <cxxreact/JSExecutor.h>
#include <fb/fbjni.h>

namespace facebook {
namespace react {

struct JAssetManager : jni::JavaClass<JAssetManager> {
  static constexpr auto kJavaDescriptor = "Landroid/content/res/AssetManager;";
};

/**
 * Helper method for loading JS script from android asset
 */
AAssetManager *extractAssetManager(jni::alias_ref<JAssetManager::javaobject> assetManager);

std::unique_ptr<const JSBigString> loadScriptFromAssets(AAssetManager *assetManager, const std::string& assetName);

} }
