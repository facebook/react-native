# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip
else
  source[:tag] = "v#{version}"
end

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2020.01.13.00'
folly_dep_name = 'RCT-Folly/Fabric'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  s.name                   = "React-Fabric"
  s.version                = version
  s.summary                = "Fabric for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "10.0" }
  s.source                 = source
  s.prepare_command        = "node #{File.join(__dir__, "..", "scripts", "generate-rncore.js")}"
  s.source_files           = "dummyFile.cpp"
  s.library                = "stdc++"
  s.pod_target_xcconfig = { "USE_HEADERMAP" => "YES",
                            "CLANG_CXX_LANGUAGE_STANDARD" => "c++14" }

  s.dependency folly_dep_name, folly_version
  s.dependency "React-graphics", version
  s.dependency "React-jsiexecutor", version
  s.dependency "RCTRequired", version
  s.dependency "RCTTypeSafety", version
  s.dependency "ReactCommon/turbomodule/core", version
  s.dependency "React-jsi", version

  s.subspec "animations" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/animations/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "**/tests/*"
    ss.header_dir           = "react/renderer/animations"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "attributedstring" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/attributedstring/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "**/tests/*"
    ss.header_dir           = "react/renderer/attributedstring"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "better" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "better/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "**/tests/*"
    ss.header_dir           = "better"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "config" do |ss|
    ss.source_files         = "react/config/*.{m,mm,cpp,h}"
    ss.header_dir           = "react/config"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"" }
  end

  s.subspec "core" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags + ' ' + boost_compiler_flags
    ss.source_files         = "react/renderer/core/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "**/tests/**/*"
    ss.header_dir           = "react/renderer/core"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "componentregistry" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/componentregistry/**/*.{m,mm,cpp,h}"
    ss.header_dir           = "react/renderer/componentregistry"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "components" do |ss|
    ss.subspec "activityindicator" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/activityindicator/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "react/renderer/components/activityindicator"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "image" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/image/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "react/renderer/components/image"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "inputaccessory" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/inputaccessory/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "react/renderer/components/inputaccessory"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "legacyviewmanagerinterop" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/legacyviewmanagerinterop/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "react/renderer/components/legacyviewmanagerinterop"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/Headers/Private/React-Core\"" }
    end

    ss.subspec "modal" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/modal/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "react/renderer/components/modal"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "rncore" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/rncore/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*", "react/renderer/components/rncore/*Tests.{h,cpp}",
                                 # TODO: These should be re-enabled later when Codegen Native Module support is needed.
                                 "react/renderer/components/rncore/rncore-generated.mm", "react/renderer/components/rncore/NativeModules.{h,cpp}"
      sss.header_dir           = "react/renderer/components/rncore"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "root" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/root/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "react/renderer/components/root"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "safeareaview" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/safeareaview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "react/renderer/components/safeareaview"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "scrollview" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/scrollview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "react/renderer/components/scrollview"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "slider" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/slider/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*",
                                 "**/android/*"
      sss.header_dir           = "react/renderer/components/slider"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "text" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/text/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "react/renderer/components/text"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "textinput" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/textinput/iostextinput/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "react/renderer/components/iostextinput"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "unimplementedview" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/unimplementedview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "react/renderer/components/unimplementedview"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "view" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.dependency             "Yoga"
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/view/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "react/renderer/components/view"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end
  end

  s.subspec "debug" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/debug/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "**/tests/*"
    ss.header_dir           = "react/renderer/debug"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "imagemanager" do |ss|
    ss.dependency             "React-RCTImage", version
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/imagemanager/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "**/tests/*",
                              "**/android/*",
                              "**/cxx/*"
    ss.header_dir           = "react/renderer/imagemanager"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "mounting" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/mounting/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "**/tests/*"
    ss.header_dir           = "react/renderer/mounting"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "scheduler" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/scheduler/**/*.{m,mm,cpp,h}"
    ss.header_dir           = "react/renderer/scheduler"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "templateprocessor" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/templateprocessor/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "**/tests/*"
    ss.header_dir           = "react/renderer/templateprocessor"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "textlayoutmanager" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.dependency             "React-Fabric/uimanager"
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/textlayoutmanager/platform/{ios,cxx}/**/*.{m,mm,cpp,h}",
                              "react/renderer/textlayoutmanager/*.{m,mm,cpp,h}"
    ss.exclude_files        = "**/tests/*",
                              "**/android/*",
                              "**/cxx/*"
    ss.header_dir           = "react/renderer/textlayoutmanager"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "uimanager" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/uimanager/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "**/tests/*"
    ss.header_dir           = "react/renderer/uimanager"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "utils" do |ss|
    ss.source_files         = "react/utils/*.{m,mm,cpp,h}"
    ss.header_dir           = "react/utils"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end
end
