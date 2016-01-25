// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <android/asset_manager.h>
#include <string>
#include <jni.h>

namespace facebook {
namespace react {

/**
 * Helper method for loading a JS script from Android assets without
 * a reference to an AssetManager.
 */
std::string loadScriptFromAssets(std::string assetName);

/**
 * Helper method for loading JS script from android asset
 */
std::string loadScriptFromAssets(AAssetManager *assetManager, std::string assetName);

/**
 * Helper method for loading JS script from a file
 */
std::string loadScriptFromFile(std::string fileName);

void registerJSLoaderNatives();

} }
