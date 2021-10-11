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
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.06.28.00-v2'
folly_dep_name = 'RCT-Folly/Fabric'
boost_compiler_flags = '-Wno-documentation'
react_native_path = ".."

Pod::Spec.new do |s|
  s.name                   = "React-Fabric"
  s.version                = version
  s.summary                = "Fabric for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "11.0" }
  s.source                 = source
  s.source_files           = "dummyFile.cpp"
  s.pod_target_xcconfig = { "USE_HEADERMAP" => "YES",
                            "CLANG_CXX_LANGUAGE_STANDARD" => "c++17" }

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
    ss.exclude_files        = "react/renderer/animations/tests"
    ss.header_dir           = "react/renderer/animations"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "attributedstring" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/attributedstring/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/attributedstring/tests"
    ss.header_dir           = "react/renderer/attributedstring"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "better" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "better/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "better/tests"
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
    ss.exclude_files        = "react/renderer/core/tests"
    ss.header_dir           = "react/renderer/core"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\" \"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "componentregistry" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/componentregistry/**/*.{m,mm,cpp,h}"
    ss.header_dir           = "react/renderer/componentregistry"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "componentregistrynative" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/componentregistry/native/**/*.{m,mm,cpp,h}"
    ss.header_dir           = "react/renderer/componentregistry/native"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "components" do |ss|
    ss.subspec "activityindicator" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/activityindicator/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/activityindicator/tests"
      sss.header_dir           = "react/renderer/components/activityindicator"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "image" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/image/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/image/tests"
      sss.header_dir           = "react/renderer/components/image"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "inputaccessory" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/inputaccessory/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/inputaccessory/tests"
      sss.header_dir           = "react/renderer/components/inputaccessory"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "legacyviewmanagerinterop" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/legacyviewmanagerinterop/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/legacyviewmanagerinterop/tests"
      sss.header_dir           = "react/renderer/components/legacyviewmanagerinterop"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/Headers/Private/React-Core\"" }
    end

    ss.subspec "modal" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/modal/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/modal/tests"
      sss.header_dir           = "react/renderer/components/modal"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "rncore" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/rncore/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/rncore/tests"
      sss.header_dir           = "react/renderer/components/rncore"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "root" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/root/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/root/tests"
      sss.header_dir           = "react/renderer/components/root"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "safeareaview" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/safeareaview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/safeareaview/tests"
      sss.header_dir           = "react/renderer/components/safeareaview"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "scrollview" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/scrollview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/scrollview/tests"
      sss.header_dir           = "react/renderer/components/scrollview"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "slider" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/slider/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/slider/tests/**/*",
                                 "react/renderer/components/slider/platform/android"
      sss.header_dir           = "react/renderer/components/slider"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "text" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/text/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/text/tests"
      sss.header_dir           = "react/renderer/components/text"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "textinput" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/textinput/iostextinput/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/textinput/iostextinput/tests"
      sss.header_dir           = "react/renderer/components/iostextinput"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "unimplementedview" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/unimplementedview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/unimplementedview/tests"
      sss.header_dir           = "react/renderer/components/unimplementedview"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end

    ss.subspec "view" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.dependency             "Yoga"
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/view/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/view/tests"
      sss.header_dir           = "react/renderer/components/view"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
    end
  end

  s.subspec "debug_core" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/debug/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/debug/tests"
    ss.header_dir           = "react/debug"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "debug_renderer" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/debug/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/debug/tests"
    ss.header_dir           = "react/renderer/debug"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "imagemanager" do |ss|
    ss.dependency             "React-RCTImage", version
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/imagemanager/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/imagemanager/tests",
                              "react/renderer/imagemanager/platform/android",
                              "react/renderer/imagemanager/platform/cxx"
    ss.header_dir           = "react/renderer/imagemanager"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "mounting" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/mounting/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/mounting/tests"
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
    ss.exclude_files        = "react/renderer/templateprocessor/tests"
    ss.header_dir           = "react/renderer/templateprocessor"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "textlayoutmanager" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.dependency             "React-Fabric/uimanager"
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/textlayoutmanager/platform/ios/**/*.{m,mm,cpp,h}",
                              "react/renderer/textlayoutmanager/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/textlayoutmanager/tests",
                              "react/renderer/textlayoutmanager/platform/android",
                              "react/renderer/textlayoutmanager/platform/cxx"
    ss.header_dir           = "react/renderer/textlayoutmanager"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "uimanager" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/uimanager/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/uimanager/tests"
    ss.header_dir           = "react/renderer/uimanager"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "telemetry" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/telemetry/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/telemetry/tests"
    ss.header_dir           = "react/renderer/telemetry"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "leakchecker" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/leakchecker/**/*.{cpp,h}"
    ss.exclude_files        = "react/renderer/leakchecker/tests"
    ss.header_dir           = "react/renderer/leakchecker"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "runtimescheduler" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/runtimescheduler/**/*.{cpp,h}"
    ss.exclude_files        = "react/renderer/runtimescheduler/tests"
    ss.header_dir           = "react/renderer/runtimescheduler"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  s.subspec "utils" do |ss|
    ss.source_files         = "react/utils/*.{m,mm,cpp,h}"
    ss.header_dir           = "react/utils"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/RCT-Folly\"" }
  end

  use_react_native_codegen!(s, {
    :react_native_path => react_native_path,
    :js_srcs_dir => "#{react_native_path}/Libraries",
    :library_name => "rncore",
    :library_type => "components",
    :output_dir => "#{react_native_path}/ReactCommon",
  })
end
