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

react_native_path = ".."

Pod::Spec.new do |s|

  header_search_path = [
    "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"",
    "\"$(PODS_ROOT)/Headers/Private/Yoga\"",
    "\"$(PODS_TARGET_SRCROOT)\"",
  ]

  if ENV['USE_FRAMEWORKS']
    header_search_path = header_search_path + [
      "\"$(PODS_TARGET_SRCROOT)/react/renderer/textlayoutmanager/platform/ios\"",
      "\"$(PODS_TARGET_SRCROOT)/react/renderer/components/textinput/platform/ios\"",
      "\"$(PODS_TARGET_SRCROOT)/react/renderer/components/view/platform/cxx\"",
    ]
  end

  s.name                   = "React-FabricComponents"
  s.version                = version
  s.summary                = "Fabric Components for React Native."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = "dummyFile.cpp"
  s.pod_target_xcconfig = { "USE_HEADERMAP" => "YES",
                            "CLANG_CXX_LANGUAGE_STANDARD" => rct_cxx_language_standard(),
                            "DEFINES_MODULE" => "YES",
                            "HEADER_SEARCH_PATHS" => header_search_path.join(" "),
                          }

  if ENV['USE_FRAMEWORKS']
    s.header_mappings_dir     = './'
    s.module_name             = 'React_FabricComponents'
  end

  s.dependency "React-jsiexecutor"
  s.dependency "RCTRequired"
  s.dependency "RCTTypeSafety"
  s.dependency "ReactCommon/turbomodule/core"
  s.dependency "React-jsi"
  s.dependency "React-logger"
  s.dependency "React-Core"
  s.dependency "React-debug"
  s.dependency "React-featureflags"
  s.dependency "React-utils"
  s.dependency "React-runtimescheduler"
  s.dependency "React-cxxreact"
  s.dependency "React-RCTFBReactNativeSpec"
  s.dependency "Yoga"

  add_dependency(s, "React-rendererdebug")
  add_dependency(s, "React-graphics", :additional_framework_paths => ["react/renderer/graphics/platform/ios"])
  add_dependency(s, "React-Fabric", :additional_framework_paths => [
    "react/renderer/components/view/platform/cxx",
    "react/renderer/imagemanager/platform/ios"
  ])

  depend_on_js_engine(s)
  add_rn_third_party_dependencies(s)

  s.subspec "components" do |ss|

    ss.subspec "inputaccessory" do |sss|
      sss.source_files         = "react/renderer/components/inputaccessory/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/inputaccessory/tests"
      sss.header_dir           = "react/renderer/components/inputaccessory"
    end

    ss.subspec "modal" do |sss|
      sss.source_files         = "react/renderer/components/modal/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/modal/tests"
      sss.header_dir           = "react/renderer/components/modal"
    end

    ss.subspec "rncore" do |sss|
      sss.source_files         = "react/renderer/components/rncore/**/*.{m,mm,cpp,h}"
      sss.header_dir           = "react/renderer/components/rncore"
    end

    ss.subspec "safeareaview" do |sss|
      sss.source_files         = "react/renderer/components/safeareaview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/safeareaview/tests"
      sss.header_dir           = "react/renderer/components/safeareaview"

    end

    ss.subspec "scrollview" do |sss|
      sss.source_files         = "react/renderer/components/scrollview/*.{m,mm,cpp,h}"
      sss.header_dir           = "react/renderer/components/scrollview"

    end

    ss.subspec "text" do |sss|
      sss.source_files         = "react/renderer/components/text/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/text/tests"
      sss.header_dir           = "react/renderer/components/text"

    end

    ss.subspec "iostextinput" do |sss|
      sss.source_files         = "react/renderer/components/textinput/*.{m,mm,cpp,h}",
                                 "react/renderer/components/textinput/platform/ios/**/*.{m,mm,cpp,h}"
      sss.header_dir           = "react/renderer/components/iostextinput"

    end

    ss.subspec "textinput" do |sss|
      sss.source_files         = "react/renderer/components/textinput/*.{m,mm,cpp,h}"
      sss.header_dir           = "react/renderer/components/textinput"

    end

    ss.subspec "unimplementedview" do |sss|
      sss.source_files         = "react/renderer/components/unimplementedview/**/*.{m,mm,cpp,h}"
      sss.exclude_files        = "react/renderer/components/unimplementedview/tests"
      sss.header_dir           = "react/renderer/components/unimplementedview"

    end
  end

  s.subspec "textlayoutmanager" do |ss|
    ss.dependency             "React-Fabric"
    ss.source_files         = "react/renderer/textlayoutmanager/platform/ios/**/*.{m,mm,cpp,h}",
                              "react/renderer/textlayoutmanager/*.{m,mm,cpp,h}"
    ss.exclude_files        = "react/renderer/textlayoutmanager/tests",
                              "react/renderer/textlayoutmanager/platform/android",
                              "react/renderer/textlayoutmanager/platform/cxx"
    ss.header_dir           = "react/renderer/textlayoutmanager"
  end
end
