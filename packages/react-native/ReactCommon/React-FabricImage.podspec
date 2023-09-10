# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32 -Wno-gnu-zero-variadic-macro-arguments'
folly_version = '2021.07.22.00'
folly_dep_name = 'RCT-Folly/Fabric'
boost_compiler_flags = '-Wno-documentation'
react_native_path = ".."

header_search_path = [
  "\"$(PODS_ROOT)/boost\"",
  "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"",
  "\"$(PODS_ROOT)/RCT-Folly\"",
  "\"$(PODS_ROOT)/Headers/Private/Yoga\"",
]

if ENV['USE_FRAMEWORKS']
  header_search_path = header_search_path + [
    "\"$(PODS_TARGET_SRCROOT)\"",
    "\"$(PODS_ROOT)/DoubleConversion\"",
    "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-Codegen/React_Codegen.framework/Headers\"",
    "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios\"",
    "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/imagemanager/platform/ios\"",
    "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/components/view/platform/cxx\"",
    "\"$(PODS_TARGET_SRCROOT)/react/renderer/textlayoutmanager/platform/ios\"",
    "\"$(PODS_TARGET_SRCROOT)/react/renderer/components/textinput/iostextinput\"",
    "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\"",
    "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-rendererdebug/React_rendererdebug.framework/Headers/\""
  ]
end

Pod::Spec.new do |s|
  s.name                   = "React-FabricImage"
  s.version                = version
  s.summary                = "Image Component for Fabric for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files         = "react/renderer/components/image/**/*.{m,mm,cpp,h}"
  s.exclude_files        = "react/renderer/components/image/tests"
  s.header_dir           = "react/renderer/components/image"
  s.compiler_flags       = folly_compiler_flags
  s.pod_target_xcconfig = { "USE_HEADERMAP" => "YES",
                            "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
                            "HEADER_SEARCH_PATHS" => header_search_path.join(" ")
                          }

  if ENV['USE_FRAMEWORKS']
    s.header_mappings_dir     = './'
    s.module_name             = 'React_FabricImage'
  end

  s.dependency folly_dep_name, folly_version
  s.dependency "React-graphics", version
  s.dependency "React-jsiexecutor", version
  s.dependency "RCTRequired", version
  s.dependency "RCTTypeSafety", version
  s.dependency "ReactCommon/turbomodule/core", version
  s.dependency "React-jsi", version
  s.dependency "React-logger"
  s.dependency "glog"
  s.dependency "DoubleConversion"
  s.dependency "React-ImageManager"
  s.dependency "React-Fabric"
  s.dependency "React-utils"
  s.dependency "React-rendererdebug"
  s.dependency "Yoga"

  if ENV["USE_HERMES"] == nil || ENV["USE_HERMES"] == "1"
    s.dependency "hermes-engine"
  else
    s.dependency "React-jsi"
  end
end
