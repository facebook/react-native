Pod::Spec.new do |s|
  s.name                = "React"
  s.version             = "0.8.0"
  s.summary             = "Build high quality mobile apps using React."
  s.description         = <<-DESC
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
  s.homepage            = "http://facebook.github.io/react-native/"
  s.license             = "BSD"
  s.author              = "Facebook"
  s.source              = { :git => "https://github.com/facebook/react-native.git", :tag => "v#{s.version}" }
  s.default_subspec     = 'Core'
  s.requires_arc        = true
  s.platform            = :ios, "7.0"
  s.prepare_command     = 'npm install --production'
  s.preserve_paths      = "cli.js", "Libraries/**/*.js", "lint", "linter.js", "node_modules", "package.json", "packager", "PATENTS", "react-native-cli"
  s.header_mappings_dir = "."

  s.subspec 'Core' do |ss|
    ss.source_files     = "React/**/*.{c,h,m}"
    ss.exclude_files    = "**/__tests__/*", "IntegrationTests/*"
    ss.frameworks       = "JavaScriptCore"
  end

  s.subspec 'ART' do |ss|
    ss.dependency         'React/Core'
    ss.source_files     = "Libraries/ART/**/*.{h,m}"
    ss.preserve_paths   = "Libraries/ART/**/*.js"
  end

  s.subspec 'RCTActionSheet' do |ss|
    ss.dependency         'React/Core'
    ss.source_files     = "Libraries/ActionSheetIOS/*.{h,m}"
    ss.preserve_paths   = "Libraries/ActionSheetIOS/*.js"
  end

  s.subspec 'RCTAdSupport' do |ss|
    ss.dependency         'React/Core'
    ss.source_files     = "Libraries/AdSupport/*.{h,m}"
    ss.preserve_paths   = "Libraries/AdSupport/*.js"
  end

  s.subspec 'RCTAnimationExperimental' do |ss|
    ss.dependency         'React/Core'
    ss.source_files     = "Libraries/Animation/RCTAnimationExperimental*.{h,m}"
    ss.preserve_paths   = "Libraries/Animation/*.js"
  end

  s.subspec 'RCTGeolocation' do |ss|
    ss.dependency         'React/Core'
    ss.source_files     = "Libraries/Geolocation/*.{h,m}"
    ss.preserve_paths   = "Libraries/Geolocation/*.js"
  end

  s.subspec 'RCTImage' do |ss|
    ss.dependency         'React/Core'
    ss.source_files     = "Libraries/Image/*.{h,m}"
    ss.preserve_paths   = "Libraries/Image/*.js"
  end

  s.subspec 'RCTNetwork' do |ss|
    ss.dependency         'React/Core'
    ss.source_files     = "Libraries/Network/*.{h,m}"
    ss.preserve_paths   = "Libraries/Network/*.js"
  end

  s.subspec 'RCTPushNotification' do |ss|
    ss.dependency         'React/Core'
    ss.source_files     = "Libraries/PushNotificationIOS/*.{h,m}"
    ss.preserve_paths   = "Libraries/PushNotificationIOS/*.js"
  end

  s.subspec 'RCTSettings' do |ss|
    ss.dependency         'React/Core'
    ss.source_files     = "Libraries/Settings/*.{h,m}"
    ss.preserve_paths   = "Libraries/Settings/*.js"
  end

  s.subspec 'RCTText' do |ss|
    ss.dependency         'React/Core'
    ss.source_files     = "Libraries/Text/*.{h,m}"
    ss.preserve_paths   = "Libraries/Text/*.js"
  end

  s.subspec 'RCTVibration' do |ss|
    ss.dependency         'React/Core'
    ss.source_files     = "Libraries/Vibration/*.{h,m}"
    ss.preserve_paths   = "Libraries/Vibration/*.js"
  end

  s.subspec 'RCTWebSocket' do |ss|
    ss.dependency         'React/Core'
    ss.source_files     = "Libraries/WebSocket/*.{h,m}"
    ss.preserve_paths   = "Libraries/WebSocket/*.js"
  end

  s.subspec 'RCTLinkingIOS' do |ss|
    ss.dependency         'React/Core'
    ss.source_files     = "Libraries/LinkingIOS/*.{h,m}"
    ss.preserve_paths   = "Libraries/LinkingIOS/*.js"
  end
end
