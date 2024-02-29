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

folly_config = get_folly_config()
folly_compiler_flags = folly_config[:compiler_flags]
folly_version = folly_config[:version]

folly_dep_name = 'RCT-Folly/Fabric'
boost_compiler_flags = '-Wno-documentation'
react_native_path = ".."

Pod::Spec.new do |s|
  s.name                   = "React-Fabric"
  s.version                = version
  s.summary                = "Fabric for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = "dummyFile.cpp"
  s.pod_target_xcconfig = { "USE_HEADERMAP" => "YES",
                            "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
                            "DEFINES_MODULE" => "YES" }

  if ENV['USE_FRAMEWORKS']
    s.header_mappings_dir     = './'
    s.module_name             = 'React_Fabric'
  end

  s.dependency folly_dep_name, folly_version

  s.dependency "React-jsiexecutor"
  s.dependency "RCTRequired"
  s.dependency "RCTTypeSafety"
  s.dependency "ReactCommon/turbomodule/core"
  s.dependency "React-jsi"
  s.dependency "React-logger"
  s.dependency "glog"
  s.dependency "DoubleConversion"
  s.dependency "fmt", "9.1.0"
  s.dependency "React-Core"
  s.dependency "React-debug"
  s.dependency "React-utils"
  s.dependency "React-runtimescheduler"
  s.dependency "React-cxxreact"

  add_dependency(s, "React-rendererdebug")
  add_dependency(s, "React-graphics", :additional_framework_paths => ["react/renderer/graphics/platform/ios"])

  if ENV["USE_HERMES"] == nil || ENV["USE_HERMES"] == "1"
    s.dependency "hermes-engine"
  else
    s.dependency "React-jsc"
  end

  s.subspec "animations" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/animations/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/animations/tests"
    ss.header_dir           = "react/renderer/animations"
  end

  s.subspec "attributedstring" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/attributedstring/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/attributedstring/tests"
    ss.header_dir           = "react/renderer/attributedstring"
  end

  s.subspec "core" do |ss|
    header_search_path = [
      "\"$(PODS_ROOT)/boost\"",
      "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"",
      "\"$(PODS_ROOT)/RCT-Folly\"",
      "\"$(PODS_ROOT)/Headers/Private/Yoga\"",
      "\"$(PODS_TARGET_SRCROOT)\"",
      "\"$(PODS_ROOT)/DoubleConversion\"",
      "\"$(PODS_ROOT)/fmt/include\"",
    ]

    if ENV['USE_FRAMEWORKS']
      header_search_path = header_search_path + [
        "\"$(PODS_TARGET_SRCROOT)/react/renderer/textlayoutmanager/platform/ios\"",
        "\"$(PODS_TARGET_SRCROOT)/react/renderer/components/textinput/platform/ios\"",
        "\"$(PODS_TARGET_SRCROOT)/react/renderer/components/view/platform/cxx\"",
      ]
    end

    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags + ' ' + boost_compiler_flags
    ss.source_files         = "react/renderer/core/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/core/tests"
    ss.header_dir           = "react/renderer/core"
    ss.pod_target_xcconfig  = {
      "HEADER_SEARCH_PATHS" => header_search_path.join(" ")
    }
  end

  s.subspec "componentregistry" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/componentregistry/*.{m,mm,cpp,h}"
    ss.header_dir           = "react/renderer/componentregistry"
  end

  s.subspec "componentregistrynative" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/componentregistry/native/**/*.{m,mm,cpp,h}"
    ss.header_dir           = "react/renderer/componentregistry/native"
  end

  s.subspec "components" do |ss|

    ss.subspec "inputaccessory" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/inputaccessory/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/inputaccessory/tests"
      sss.header_dir           = "react/renderer/components/inputaccessory"
    end

    ss.subspec "legacyviewmanagerinterop" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/legacyviewmanagerinterop/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/legacyviewmanagerinterop/tests"
      sss.header_dir           = "react/renderer/components/legacyviewmanagerinterop"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/Headers/Private/React-Core\"" }
    end

    ss.subspec "modal" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/modal/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/modal/tests"
      sss.header_dir           = "react/renderer/components/modal"
    end

    ss.subspec "rncore" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/rncore/**/*.{m,mm,cpp,h}"
      sss.header_dir           = "react/renderer/components/rncore"
    end

    ss.subspec "root" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/root/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/root/tests"
      sss.header_dir           = "react/renderer/components/root"
    end

    ss.subspec "safeareaview" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/safeareaview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/safeareaview/tests"
      sss.header_dir           = "react/renderer/components/safeareaview"

    end

    ss.subspec "scrollview" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/scrollview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/scrollview/tests"
      sss.header_dir           = "react/renderer/components/scrollview"

    end

    ss.subspec "text" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/text/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/text/tests"
      sss.header_dir           = "react/renderer/components/text"

    end

    ss.subspec "textinput" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/textinput/platform/ios/**/*.{m,mm,cpp,h}"
      sss.header_dir           = "react/renderer/components/iostextinput"

    end

    ss.subspec "unimplementedview" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/unimplementedview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/unimplementedview/tests"
      sss.header_dir           = "react/renderer/components/unimplementedview"

    end

    ss.subspec "view" do |sss|
      sss.dependency             folly_dep_name, folly_version
      sss.dependency             "Yoga"
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "react/renderer/components/view/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/view/tests", "react/renderer/components/view/platform/android"
      sss.header_dir           = "react/renderer/components/view"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/Headers/Private/Yoga\"" }
    end
  end

  s.subspec "imagemanager" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/imagemanager/*.{m,mm,cpp,h}"
    ss.header_dir           = "react/renderer/imagemanager"
  end

  s.subspec "mounting" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/mounting/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/mounting/tests"
    ss.header_dir           = "react/renderer/mounting"
  end

  s.subspec "scheduler" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/scheduler/**/*.{m,mm,cpp,h}"
    ss.header_dir           = "react/renderer/scheduler"
  end

  s.subspec "templateprocessor" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/templateprocessor/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/templateprocessor/tests"
    ss.header_dir           = "react/renderer/templateprocessor"
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
  end

  s.subspec "uimanager" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/uimanager/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/uimanager/tests"
    ss.header_dir           = "react/renderer/uimanager"
  end

  s.subspec "telemetry" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/telemetry/**/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/telemetry/tests"
    ss.header_dir           = "react/renderer/telemetry"

  end

  s.subspec "leakchecker" do |ss|
    ss.dependency             folly_dep_name, folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "react/renderer/leakchecker/**/*.{cpp,h}"
    ss.exclude_files        = "react/renderer/leakchecker/tests"
    ss.header_dir           = "react/renderer/leakchecker"
    ss.pod_target_xcconfig  = { "GCC_WARN_PEDANTIC" => "YES" }
  end

  s.script_phases = [
    {
      :name => '[RN]Check rncore',
      :execution_position => :before_compile,
      :script => <<-EOS
echo "Checking whether Codegen has run..."
rncorePath="$REACT_NATIVE_PATH/ReactCommon/react/renderer/components/rncore"

if [[ ! -d "$rncorePath" ]]; then
  echo 'error: Codegen did not run properly in your project. Please reinstall cocoapods with `bundle exec pod install`.'
  exit 1
fi
      EOS
    }
  ]
end
