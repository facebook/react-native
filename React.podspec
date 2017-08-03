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
  s.platforms               = { :ios => "8.0", :tvos => "9.2" }
  s.pod_target_xcconfig     = { "CLANG_CXX_LANGUAGE_STANDARD" => "c++14" }
  s.preserve_paths          = "package.json", "LICENSE", "LICENSE-docs", "PATENTS"
  s.cocoapods_version       = ">= 1.2.0"

  s.subspec "Core" do |ss|
    ss.dependency             "Yoga", "#{package["version"]}.React"
    ss.source_files         = "React/**/*.{c,h,m,mm,S}"
    ss.exclude_files        = "**/__tests__/*",
                              "IntegrationTests/*",
                              "React/DevSupport/*",
                              "React/Inspector/*",
                              "ReactCommon/yoga/*",
                              "React/Cxx*/*",
                              "React/Base/RCTBatchedBridge.mm",
                              "React/Executors/*"
    ss.ios.exclude_files    = "React/**/RCTTVView.*"
    ss.tvos.exclude_files   = "React/Modules/RCTClipboard*",
                              "React/Views/RCTDatePicker*",
                              "React/Views/RCTPicker*",
                              "React/Views/RCTRefreshControl*",
                              "React/Views/RCTSlider*",
                              "React/Views/RCTSwitch*",
                              "React/Views/RCTWebView*"
    ss.header_dir           = "React"
    ss.framework            = "JavaScriptCore"
    ss.libraries            = "stdc++"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"" }
  end

  s.subspec "BatchedBridge" do |ss|
    ss.dependency             "React/Core"
    ss.dependency             "React/cxxreact_legacy"
    ss.source_files         = "React/Base/RCTBatchedBridge.mm", "React/Executors/*"
  end

  s.subspec "CxxBridge" do |ss|
    ss.dependency             "Folly", "2016.09.26.00"
    ss.dependency             "React/Core"
    ss.dependency             "React/cxxreact"
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

  s.subspec "tvOS" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "React/**/RCTTVView.{h, m}"
  end

  s.subspec "jschelpers_legacy" do |ss|
    ss.source_files         = "ReactCommon/jschelpers/{JavaScriptCore,JSCWrapper,InspectorInterfaces}.{cpp,h}", "ReactCommon/jschelpers/systemJSCWrapper.cpp"
    ss.private_header_files = "ReactCommon/jschelpers/{JavaScriptCore,JSCWrapper,InspectorInterfaces}.h"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"" }
    ss.framework            = "JavaScriptCore"
  end

  s.subspec "cxxreact_legacy" do |ss|
    ss.dependency             "React/jschelpers_legacy"
    ss.source_files         = "ReactCommon/cxxreact/{JSBundleType,oss-compat-util}.{cpp,h}"
    ss.private_header_files = "ReactCommon/cxxreact/{JSBundleType,oss-compat-util}.h"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"" }
  end

  s.subspec "jschelpers" do |ss|
    ss.dependency             "Folly", "2016.09.26.00"
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "ReactCommon/jschelpers/*.{cpp,h}"
    ss.private_header_files = "ReactCommon/jschelpers/*.h"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\"" }
    ss.framework            = "JavaScriptCore"
  end

  s.subspec "cxxreact" do |ss|
    ss.dependency             "React/jschelpers"
    ss.dependency             "boost"
    ss.dependency             "Folly", "2016.09.26.00"
    ss.compiler_flags       = folly_compiler_flags
    ss.source_files         = "ReactCommon/cxxreact/*.{cpp,h}"
    ss.exclude_files        = "ReactCommon/cxxreact/SampleCxxModule.*"
    ss.private_header_files = "ReactCommon/cxxreact/*.h"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/Folly\"" }
  end

  s.subspec "ART" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/ART/**/*.{h,m}"
  end

  s.subspec "RCTActionSheet" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/ActionSheetIOS/*.{h,m}"
  end

  s.subspec "RCTAdSupport" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/AdSupport/*.{h,m}"
  end

  s.subspec "RCTAnimation" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/NativeAnimation/{Drivers/*,Nodes/*,*}.{h,m}"
    ss.header_dir           = "RCTAnimation"
  end

  s.subspec "RCTBlob" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/Blob/*.{h,m}"
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
    ss.source_files         = "Libraries/Text/*.{h,m}"
  end

  s.subspec "RCTVibration" do |ss|
    ss.dependency             "React/Core"
    ss.source_files         = "Libraries/Vibration/*.{h,m}"
  end

  s.subspec "RCTWebSocket" do |ss|
    ss.dependency             "React/Core"
    ss.dependency             "React/RCTBlob"
    ss.source_files         = "Libraries/WebSocket/*.{h,m}"
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
