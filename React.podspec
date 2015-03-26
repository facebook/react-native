Pod::Spec.new do |s|
  s.name         = "React"
  s.version      = "0.1.0"
  s.summary      = "Build high quality mobile apps using React."
  s.description= <<-DESC
                   React Native apps are built using the React JS framework,
                   and render directly to native UIKit elements using a fully
                   asynchronous architecture. There is no browser and no HTML.
                   We have picked what we think is the best set of features from
                   these and other technologies to build what we hope to become
                   the best product development framework available, with an
                   emphasis on iteration speed, developer delight, continuity
                   of technology, and absolutely beautiful and fast products
                   with no compromises in quality or capability.
                   DESC
  s.homepage     = "http://facebook.github.io/react-native/"
  s.license      = "BSD"
  s.author       = "Facebook"
  s.platform     = :ios, "7.0"
  s.source       = { :git => "https://github.com/facebook/react-native.git", :tag => "v#{s.version}" }
  s.source_files  = "React/**/*.{c,h,m}"
  s.resources = "Resources/*.png"
  s.preserve_paths = "cli.js", "Libraries/**/*.js", "lint", "linter.js", "node_modules", "package.json", "packager", "PATENTS", "react-native-cli"
  s.exclude_files = "**/__tests__/*", "IntegrationTests/*"
  s.frameworks = "JavaScriptCore"
  s.requires_arc = true
  s.prepare_command = 'npm install'
  s.libraries = 'libicucore'
  s.xcconfig = { 'OTHER_LDFLAGS' => '-lObjC' }

  s.subspec 'RCTActionSheet' do |ss|
    ss.source_files = "Libraries/ActionSheetIOS/*.{h,m}"
    ss.preserve_paths = "Libraries/ActionSheetIOS/*.js"
  end

  s.subspec 'RCTAdSupport' do |ss|
    ss.source_files = "Libraries/RCTAdSupport/*.{h,m}"
    ss.preserve_paths = "Libraries/RCTAdSupport/*.js"
  end

  s.subspec 'RCTAnimation' do |ss|
    ss.source_files = "Libraries/Animation/*.{h,m}"
    ss.preserve_paths = "Libraries/Animation/*.js"
  end

  s.subspec 'RCTGeolocation' do |ss|
    ss.source_files = "Libraries/Geolocation/*.{h,m}"
    ss.preserve_paths = "Libraries/Geolocation/*.js"
  end

  s.subspec 'RCTImage' do |ss|
    ss.source_files = "Libraries/Image/*.{h,m}"
    ss.preserve_paths = "Libraries/Image/*.js"
  end

  s.subspec 'RCTNetwork' do |ss|
    ss.source_files = "Libraries/Network/*.{h,m}"
    ss.preserve_paths = "Libraries/Network/*.js"
  end

  s.subspec 'RCTPushNotification' do |ss|
    ss.source_files = "Libraries/PushNotificationIOS/*.{h,m}"
    ss.preserve_paths = "Libraries/PushNotificationIOS/*.js"
  end

  s.subspec 'RCTWebSocketDebugger' do |ss|
    ss.source_files = "Libraries/RCTWebSocketDebugger/*.{h,m}"
  end

  s.subspec 'RCTText' do |ss|
    ss.source_files = "Libraries/Text/*.{h,m}"
    ss.preserve_paths = "Libraries/Text/*.js"
  end

  s.subspec 'RCTVibration' do |ss|
    ss.source_files = "Libraries/Vibration/*.{h,m}"
    ss.preserve_paths = "Libraries/Vibration/*.js"
  end
end
