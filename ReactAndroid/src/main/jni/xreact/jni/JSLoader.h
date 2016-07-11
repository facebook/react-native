// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxreact/Executor.h>
#include <android/asset_manager.h>
#include <string>
#include <jni.h>

namespace facebook {
namespace react {

/**
 * Helper method for loading a JS script from Android assets without
 * a reference to an AssetManager.
 */
std::unique_ptr<const JSBigString> loadScriptFromAssets(const std::string& assetName);

/**
 * Helper method for loading JS script from android asset
 */
AAssetManager *extractAssetManager(jobject jassetManager);

std::unique_ptr<const JSBigString> loadScriptFromAssets(AAssetManager *assetManager, const std::string& assetName);

/**
 * Helper method for loading JS script from a file
 */
std::string loadScriptFromFile(const std::string& fileName);

void registerJSLoaderNatives();

} }
