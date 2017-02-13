// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <string>

#include <android/asset_manager.h>
#include <cxxreact/Executor.h>
#include <fb/fbjni.h>

namespace facebook {
namespace react {

struct JAssetManager : jni::JavaClass<JAssetManager> {
  static constexpr auto kJavaDescriptor = "Landroid/content/res/AssetManager;";
};

/**
 * Helper method for loading a JS script from Android assets without
 * a reference to an AssetManager.
 */
std::unique_ptr<const JSBigString> loadScriptFromAssets(const std::string& assetName);

/**
 * Helper method for loading JS script from android asset
 */
AAssetManager *extractAssetManager(jni::alias_ref<JAssetManager::javaobject> assetManager);

std::unique_ptr<const JSBigString> loadScriptFromAssets(AAssetManager *assetManager, const std::string& assetName);

/**
 * Helper method for loading JS script from a file
 */
std::string loadScriptFromFile(const std::string& fileName);

} }
