# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

def use_react_native! (options={})
  # The prefix to the react-native
  prefix = options[:path] ||= "../node_modules/react-native"

  # Include Fabric dependencies
  fabric_enabled = options[:fabric_enabled] ||= false

  # Include DevSupport dependency
  production = options[:production] ||= false

  # The Pods which should be included in all projects
  pod 'FBLazyVector', :path => "#{prefix}/Libraries/FBLazyVector"
  pod 'FBReactNativeSpec', :path => "#{prefix}/Libraries/FBReactNativeSpec"
  pod 'RCTRequired', :path => "#{prefix}/Libraries/RCTRequired"
  pod 'RCTTypeSafety', :path => "#{prefix}/Libraries/TypeSafety"
  pod 'React', :path => "#{prefix}/"
  pod 'React-Core', :path => "#{prefix}/"
  pod 'React-CoreModules', :path => "#{prefix}/React/CoreModules"
  pod 'React-RCTActionSheet', :path => "#{prefix}/Libraries/ActionSheetIOS"
  pod 'React-RCTAnimation', :path => "#{prefix}/Libraries/NativeAnimation"
  pod 'React-RCTBlob', :path => "#{prefix}/Libraries/Blob"
  pod 'React-RCTImage', :path => "#{prefix}/Libraries/Image"
  pod 'React-RCTLinking', :path => "#{prefix}/Libraries/LinkingIOS"
  pod 'React-RCTNetwork', :path => "#{prefix}/Libraries/Network"
  pod 'React-RCTSettings', :path => "#{prefix}/Libraries/Settings"
  pod 'React-RCTText', :path => "#{prefix}/Libraries/Text"
  pod 'React-RCTVibration', :path => "#{prefix}/Libraries/Vibration"
  pod 'React-Core/RCTWebSocket', :path => "#{prefix}/"

  unless production
    pod 'React-Core/DevSupport', :path => "#{prefix}/"
  end

  pod 'React-cxxreact', :path => "#{prefix}/ReactCommon/cxxreact"
  pod 'React-jsi', :path => "#{prefix}/ReactCommon/jsi"
  pod 'React-jsiexecutor', :path => "#{prefix}/ReactCommon/jsiexecutor"
  pod 'React-jsinspector', :path => "#{prefix}/ReactCommon/jsinspector"
  pod 'React-callinvoker', :path => "#{prefix}/ReactCommon/callinvoker"
  pod 'ReactCommon/turbomodule/core', :path => "#{prefix}/ReactCommon"
  pod 'Yoga', :path => "#{prefix}/ReactCommon/yoga", :modular_headers => true

  pod 'DoubleConversion', :podspec => "#{prefix}/third-party-podspecs/DoubleConversion.podspec"
  pod 'glog', :podspec => "#{prefix}/third-party-podspecs/glog.podspec"
  pod 'Folly', :podspec => "#{prefix}/third-party-podspecs/Folly.podspec"

  if fabric_enabled
    pod 'React-Fabric', :path => "#{prefix}/ReactCommon"
    pod 'React-graphics', :path => "#{prefix}/ReactCommon/fabric/graphics"
    pod 'React-jsi/Fabric', :path => "#{prefix}/ReactCommon/jsi"
    pod 'React-RCTFabric', :path => "#{prefix}/React"
    pod 'Folly/Fabric', :podspec => "#{prefix}/third-party-podspecs/Folly.podspec"
  end
end

def use_flipper!(version = '~> 0.33.1')
  pod 'FlipperKit', version, :configuration => 'Debug'
  pod 'FlipperKit/FlipperKitLayoutPlugin', version, :configuration => 'Debug'
  pod 'FlipperKit/SKIOSNetworkPlugin', version, :configuration => 'Debug'
  pod 'FlipperKit/FlipperKitUserDefaultsPlugin', version, :configuration => 'Debug'
  pod 'FlipperKit/FlipperKitReactPlugin', version, :configuration => 'Debug'

  # List all transitive dependencies for FlipperKit pods
  # to avoid them being linked in Release builds
  pod 'Flipper', version, :configuration => 'Debug'
  pod 'Flipper-DoubleConversion', '1.1.7', :configuration => 'Debug'
  pod 'Flipper-Folly', '~> 2.1', :configuration => 'Debug'
  pod 'Flipper-Glog', '0.3.6', :configuration => 'Debug'
  pod 'Flipper-PeerTalk', '~> 0.0.4', :configuration => 'Debug'
  pod 'Flipper-RSocket', '~> 1.0', :configuration => 'Debug'
  pod 'FlipperKit/Core', version, :configuration => 'Debug'
  pod 'FlipperKit/CppBridge', version, :configuration => 'Debug'
  pod 'FlipperKit/FBCxxFollyDynamicConvert', version, :configuration => 'Debug'
  pod 'FlipperKit/FBDefines', version, :configuration => 'Debug'
  pod 'FlipperKit/FKPortForwarding', version, :configuration => 'Debug'
  pod 'FlipperKit/FlipperKitHighlightOverlay', version, :configuration => 'Debug'
  pod 'FlipperKit/FlipperKitLayoutTextSearchable', version, :configuration => 'Debug'
  pod 'FlipperKit/FlipperKitNetworkPlugin', version, :configuration => 'Debug'
end

# Post Install processing for Flipper
def flipper_post_install(installer)
  installer.pods_project.targets.each do |target|
    if target.name == 'YogaKit'
      target.build_configurations.each do |config|
        config.build_settings['SWIFT_VERSION'] = '4.1'
      end
    end
  end
end
