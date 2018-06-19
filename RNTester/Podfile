platform :ios, '9.0'

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
    'RCTGeolocation',
    'RCTImage',
    'RCTLinkingIOS',
    'RCTNetwork',
    'RCTPushNotification',
    'RCTSettings',
    'RCTText',
    'RCTVibration',
    'RCTWebSocket',

    # Below this line is Fabric (experimental) specific.
    # Currently they are disabled due to missing pre-reqs, e.g. upgrading Folly.
    # 'RCTFabric',
    # 'RCTFabricSample', # This is RNTesterPods specific sample.
  ]

  pod 'yoga', :path => '../ReactCommon/yoga'

  # Third party deps podspec link
  pod 'DoubleConversion', :podspec => '../third-party-podspecs/DoubleConversion.podspec'
  pod 'glog', :podspec => '../third-party-podspecs/glog.podspec'
  pod 'Folly', :podspec => '../third-party-podspecs/Folly.podspec'

end
