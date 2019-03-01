#pragma once
#include <string>

#include <android/asset_manager_jni.h>
#include <cxxreact/CxxNativeModule.h>
#include <cxxreact/Instance.h>
#include <fb/fbjni.h>
#include <folly/Memory.h>

namespace facebook { namespace react {

std::shared_ptr<Instance> CreateReactInstance(
	AAssetManager* assetManager,
	std::string&& jsBundleFile,
	std::vector<std::tuple<std::string, facebook::xplat::module::CxxModule::Provider, std::shared_ptr<MessageQueueThread>>>&& cxxModules,
	std::shared_ptr<MessageQueueThread>&& jsQueue,
	std::shared_ptr<MessageQueueThread>&& nativeQueue) noexcept;

}} //namespace facebook::react
