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

def use_flipper!(versions = {}, configurations: ['Debug'])
  versions['Flipper'] ||= '~> 0.54.0'
  versions['Flipper-DoubleConversion'] ||= '1.1.7'
  versions['Flipper-Folly'] ||= '~> 2.2'
  versions['Flipper-Glog'] ||= '0.3.6'
  versions['Flipper-PeerTalk'] ||= '~> 0.0.4'
  versions['Flipper-RSocket'] ||= '~> 1.1'
  pod 'FlipperKit', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitLayoutPlugin', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/SKIOSNetworkPlugin', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitUserDefaultsPlugin', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitReactPlugin', versions['Flipper'], :configurations => configurations
  # List all transitive dependencies for FlipperKit pods
  # to avoid them being linked in Release builds
  pod 'Flipper', versions['Flipper'], :configurations => configurations
  pod 'Flipper-DoubleConversion', versions['Flipper-DoubleConversion'], :configurations => configurations
  pod 'Flipper-Folly', versions['Flipper-Folly'], :configurations => configurations
  pod 'Flipper-Glog', versions['Flipper-Glog'], :configurations => configurations
  pod 'Flipper-PeerTalk', versions['Flipper-PeerTalk'], :configurations => configurations
  pod 'Flipper-RSocket', versions['Flipper-RSocket'], :configurations => configurations
  pod 'FlipperKit/Core', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/CppBridge', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FBCxxFollyDynamicConvert', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FBDefines', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FKPortForwarding', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitHighlightOverlay', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitLayoutTextSearchable', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitNetworkPlugin', versions['Flipper'], :configurations => configurations
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
