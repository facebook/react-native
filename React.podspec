# coding: utf-8
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip
else
  source[:tag] = "v#{version}"
end

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'
folly_version = '2018.10.22.00'

Pod::Spec.new do |s|
  s.name                    = "React"
  s.version                 = version
  s.summary                 = package["description"]
  s.description             = <<-DESC
                                React Native apps are built using the React JS
                                framework, and render directly to native UIKit
                                elements using a fully asynchronous architecture.
                                There is no browser and no HTML. We have picked what
                                we think is the best set of features from these and
                                other technologies to build what we hope to become
                                the best product development framework available,
                                with an emphasis on iteration speed, developer
                                delight, continuity of technology, and absolutely
                                beautiful and fast products with no compromises in
                                quality or capability.
                             DESC
  s.homepage                = "http://facebook.github.io/react-native/"
  s.license                 = package["license"]
  s.author                  = "Facebook"
  s.source                  = source
  s.default_subspec         = "Core"
  s.requires_arc            = true
  s.platforms               = { :ios => "9.0", :tvos => "9.2" }
  s.pod_target_xcconfig     = { "CLANG_CXX_LANGUAGE_STANDARD" => "c++14" }
  s.preserve_paths          = "package.json", "LICENSE", "LICENSE-docs"
  s.cocoapods_version       = ">= 1.2.0"

  s.subspec "Core" do |ss|
    ss.dependency             "yoga", "#{package["version"]}.React"
    ss.source_files         = "React/**/*.{c,h,m,mm,S,cpp}"
    ss.exclude_files        = "**/__tests__/*",
                              "IntegrationTests/*",
                              "React/DevSupport/*",
                              "React/Inspector/*",
                              "ReactCommon/yoga/*",
                              "React/Cxx*/*",
                              "React/Fabric/**/*"
    ss.ios.exclude_files    = "React/**/RCTTV*.*"
    ss.tvos.exclude_files   = "React/Modules/RCTClipboard*",
                              "React/Views/RCTDatePicker*",
                              "React/Views/RCTPicker*",
                              "React/Views/RCTRefreshControl*",
                              "React/Views/RCTSlider*",
                              "React/Views/RCTSwitch*",
                              "React/Views/RCTWebView*"
    ss.compiler_flags       = folly_compiler_flags
    ss.header_dir           = "React"
    ss.framework            = "JavaScriptCore"
    ss.libraries            = "stdc++"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"" }
  end

  s.subspec "CxxBridge" do |ss|
    ss.dependency             "Folly", folly_version
    ss.dependency             "React/Core"
    ss.dependency             "React/cxxreact"
    ss.dependency             "React/jsiexecutor"
    ss.compiler_flags       = folly_compiler_flags
    ss.private_header_files = "React/Cxx*/*.h"
    ss.source_files         = "React/Cxx*/*.{h,m,mm}"
  end

  s.subspec "DevSupport" do |ss|
    ss.dependency             "React/Core"
    ss.dependency             "React/RCTWebSocket"
    ss.source_files         = "React/DevSupport/*",
                              "React/Inspector/*"
  end

  s.subspec "RCTFabric" do |ss|
    ss.dependency             "Folly", folly_version
    ss.dependency             "React/Core"
    ss.dependency             "React/fabric"
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "React/Fabric/**/*.{c,h,m,mm,S,cpp}"
    ss.exclude_files        = "**/tests/*"
    ss.header_dir           = "React"
    ss.framework            = "JavaScriptCore"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"" }
  end

  s.subspec "tvOS" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "React/**/RCTTV*.{h,m}"
  end

  s.subspec "jsinspector" do |ss|
    ss.source_files         = "ReactCommon/jsinspector/*.{cpp,h}"
    ss.private_header_files = "ReactCommon/jsinspector/*.h"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"" }
  end

  s.subspec "jsiexecutor" do |ss|
    ss.dependency             "React/cxxreact"
    ss.dependency             "React/jsi"
    ss.dependency             "Folly", folly_version
    ss.dependency             "DoubleConversion"
    ss.dependency             "glog"
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "ReactCommon/jsiexecutor/jsireact/*.{cpp,h}"
    ss.private_header_files = "ReactCommon/jsiexecutor/jsireact/*.h"
    ss.header_dir           = "jsireact"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\", \"$(PODS_TARGET_SRCROOT)/ReactCommon/jsiexecutor\"" }
  end

  s.subspec "jsi" do |ss|
    ss.dependency             "Folly", folly_version
    ss.dependency             "DoubleConversion"
    ss.dependency             "glog"
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "ReactCommon/jsi/*.{cpp,h}"
    ss.private_header_files = "ReactCommon/jsi/*.h"
    ss.framework            = "JavaScriptCore"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"" }
  end

  s.subspec "PrivateDatabase" do |ss|
    ss.source_files         = "ReactCommon/privatedata/*.{cpp,h}"
    ss.private_header_files = "ReactCommon/privatedata/*.h"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"" }
  end

  s.subspec "cxxreact" do |ss|
    ss.dependency             "React/jsinspector"
    ss.dependency             "boost-for-react-native", "1.63.0"
    ss.dependency             "Folly", folly_version
    ss.dependency             "DoubleConversion"
    ss.dependency             "glog"
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "ReactCommon/cxxreact/*.{cpp,h}"
    ss.exclude_files        = "ReactCommon/cxxreact/SampleCxxModule.*"
    ss.private_header_files = "ReactCommon/cxxreact/*.h"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/Folly\"" }
  end

  s.subspec "fabric" do |ss|
    ss.subspec "activityindicator" do |sss|
      sss.dependency             "Folly", folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "ReactCommon/fabric/activityindicator/**/*.{cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "fabric/activityindicator"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/Folly\"" }
    end

    ss.subspec "attributedstring" do |sss|
      sss.dependency             "Folly", folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "ReactCommon/fabric/attributedstring/**/*.{cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "fabric/attributedstring"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/Folly\"" }
    end

    ss.subspec "core" do |sss|
      sss.dependency             "Folly", folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "ReactCommon/fabric/core/**/*.{cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "fabric/core"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/Folly\"" }
    end

    ss.subspec "debug" do |sss|
      sss.dependency             "Folly", folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "ReactCommon/fabric/debug/**/*.{cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "fabric/debug"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/Folly\"" }
    end

    ss.subspec "graphics" do |sss|
      sss.dependency             "Folly", folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "ReactCommon/fabric/graphics/**/*.{cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "fabric/graphics"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/Folly\"" }
    end

    ss.subspec "scrollview" do |sss|
      sss.dependency             "Folly", folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "ReactCommon/fabric/scrollview/**/*.{cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "fabric/scrollview"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/Folly\"" }
    end

    ss.subspec "text" do |sss|
      sss.dependency             "Folly", folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "ReactCommon/fabric/text/**/*.{cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "fabric/text"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/Folly\"" }
    end

    ss.subspec "textlayoutmanager" do |sss|
      sss.dependency             "Folly", folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "ReactCommon/fabric/textlayoutmanager/**/*.{cpp,h,mm}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "fabric/textlayoutmanager"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/Folly\"" }
    end

    ss.subspec "uimanager" do |sss|
      sss.dependency             "Folly", folly_version
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "ReactCommon/fabric/uimanager/**/*.{cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "fabric/uimanager"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/Folly\"" }
    end

    ss.subspec "view" do |sss|
      sss.dependency             "Folly", folly_version
      sss.dependency             "yoga"
      sss.compiler_flags       = folly_compiler_flags
      sss.source_files         = "ReactCommon/fabric/view/**/*.{cpp,h}"
      sss.exclude_files        = "**/tests/*"
      sss.header_dir           = "fabric/view"
      sss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/Folly\"" }
    end
  end

  # Fabric sample target for sample app purpose.
  s.subspec "RCTFabricSample" do |ss|
    ss.dependency             "Folly", folly_version
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "ReactCommon/fabric/sample/**/*.{cpp,h}"
    ss.exclude_files        = "**/tests/*"
    ss.header_dir           = "fabric/sample"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/Folly\"" }
  end

  s.subspec "ART" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/ART/**/*.{h,m}"
  end

  s.subspec "RCTActionSheet" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/ActionSheetIOS/*.{h,m}"
  end

  s.subspec "RCTAnimation" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/NativeAnimation/{Drivers/*,Nodes/*,*}.{h,m}"
    ss.header_dir           = "RCTAnimation"
  end

  s.subspec "RCTBlob" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/Blob/*.{h,m,mm}"
    ss.preserve_paths       = "Libraries/Blob/*.js"
  end

  s.subspec "RCTCameraRoll" do |ss|
    ss.dependency             "React/Core"
    ss.dependency             'React/RCTImage'
    ss.source_files         = "Libraries/CameraRoll/*.{h,m}"
  end

  s.subspec "RCTGeolocation" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/Geolocation/*.{h,m}"
  end

  s.subspec "RCTImage" do |ss|
    ss.dependency             "React/Core"
    ss.dependency             "React/RCTNetwork"
    ss.source_files         = "Libraries/Image/*.{h,m}"
  end

  s.subspec "RCTNetwork" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/Network/*.{h,m,mm}"
  end

  s.subspec "RCTPushNotification" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/PushNotificationIOS/*.{h,m}"
  end

  s.subspec "RCTSettings" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/Settings/*.{h,m}"
  end

  s.subspec "RCTText" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/Text/**/*.{h,m}"
  end

  s.subspec "RCTVibration" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/Vibration/*.{h,m}"
  end

  s.subspec "RCTWebSocket" do |ss|
    ss.dependency             "React/Core"
    ss.dependency             "React/RCTBlob"
    ss.dependency             "React/fishhook"
    ss.source_files         = "Libraries/WebSocket/*.{h,m}"
  end

  s.subspec "fishhook" do |ss|
    ss.header_dir           = "fishhook"
    ss.source_files         = "Libraries/fishhook/*.{h,c}"
  end

  s.subspec "RCTLinkingIOS" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/LinkingIOS/*.{h,m}"
  end

  s.subspec "RCTTest" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/RCTTest/**/*.{h,m}"
    ss.frameworks           = "XCTest"
  end

  s.subspec "_ignore_me_subspec_for_linting_" do |ss|
    ss.dependency             "React/Core"
    ss.dependency             "React/CxxBridge"
  end
end
