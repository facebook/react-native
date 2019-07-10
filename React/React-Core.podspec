# coding: utf-8
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
folly_version = '2018.10.22.00'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  s.name                   = "React-Core"
  s.version                = version
  s.summary                = "The core of React Native."
  s.homepage               = "http://facebook.github.io/react-native/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "9.0", :tvos => "9.2" }
  s.source                 = source
  s.source_files           = "**/*.{c,h,m,mm,S,cpp}"
  s.exclude_files          = "CoreModules/**/*",
                             "DevSupport/**/*",
                             "Fabric/**/*",
                             "Inspector/**/*"
  s.ios.exclude_files      = "**/RCTTV*.*"
  s.tvos.exclude_files     = "Modules/RCTClipboard*",
                             "Views/RCTDatePicker*",
                             "Views/RCTPicker*",
                             "Views/RCTRefreshControl*",
                             "Views/RCTSlider*",
                             "Views/RCTSwitch*",
  s.private_header_files   = "Cxx*/*.h"
  s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags
  s.header_dir             = "React"
  s.framework              = "JavaScriptCore"
  s.library                = "stdc++"
  s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/ReactCommon\" \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/Folly\"" }
  s.default_subspec         = "Default"

  s.subspec "Default" do |ss|
    # no-op
  end

  s.subspec "CxxBridge" do |ss|
    # Make the C++ headers visible if they are needed
    ss.public_header_files   = "**/*.{h}"
  end

  s.dependency "Folly", folly_version
  s.dependency "React-cxxreact", version
  s.dependency "React-jsi", version
  s.dependency "React-jsiexecutor", version
  s.dependency "yoga", "#{version}.React"
  s.dependency "glog"
end
