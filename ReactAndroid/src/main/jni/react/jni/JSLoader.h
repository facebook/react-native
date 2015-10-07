// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <string>
#include <jni.h>

namespace facebook {
namespace react {

/**
 * Helper method for loading JS script from android asset
 */
std::string loadScriptFromAssets(JNIEnv *env, jobject assetManager, std::string assetName);

/**
 * Helper method for loading JS script from a file
 */
std::string loadScriptFromFile(std::string fileName);

} }
