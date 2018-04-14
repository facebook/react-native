platform :ios, '8.0'

target 'RNTester' do
  # Uncomment for Swift
  # use_frameworks!

  project 'RNTesterPods.xcodeproj'

  pod 'React', :path => '../', :subspecs => [
    'ART',
    'Core',
    'CxxBridge',
    'DevSupport',
    'RCTActionSheet',
    'RCTAnimation',
    'RCTBlob',
    'RCTCameraRoll',
    'RCTFabric',
    'RCTGeolocation',
    'RCTImage',
    'RCTLinkingIOS',
    'RCTNetwork',
    'RCTPushNotification',
    'RCTSettings',
    'RCTText',
    'RCTVibration',
    'RCTWebSocket',
  ]

  pod 'yoga', :path => '../ReactCommon/yoga'

  # Third party deps podspec link
  pod 'DoubleConversion', :podspec => '../third-party-podspecs/DoubleConversion.podspec'
  pod 'glog', :podspec => '../third-party-podspecs/glog.podspec'
  pod 'Folly', :podspec => '../third-party-podspecs/Folly.podspec'

end
