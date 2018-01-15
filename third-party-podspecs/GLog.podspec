Pod::Spec.new do |spec|
  spec.name = 'GLog'
  spec.version = '0.3.4'
  spec.license = { :type => 'Google', :file => 'COPYING' }
  spec.homepage = 'https://github.com/google/glog'
  spec.summary = 'Google logging module'
  spec.authors = 'Google'

  spec.prepare_command = <<-CMD
    echo '#!/bin/sh' > ./ios-cc.sh
    echo 'exec "$(xcrun -find -sdk iphoneos cc)" -arch armv7 -isysroot "$(xcrun -sdk iphoneos --show-sdk-path)" "$@"' >> ./ios-cc.sh
    chmod 755 ./ios-cc.sh
    CC="`pwd`"/ios-cc.sh CXX="`pwd`"/ios-cc.sh ./configure --host arm-apple-darwin
    CMD

  spec.source = { :git => 'https://github.com/google/glog.git',
                  :tag => "v#{spec.version}" }
  spec.module_name = 'glog'
  spec.source_files = 'src/**/*.h',
                      'src/demangle.cc',
                      'src/logging.cc',
                      'src/raw_logging.cc',
                      'src/signalhandler.cc',
                      'src/symbolize.cc',
                      'src/utilities.cc',
                      'src/vlog_is_on.cc'
  spec.public_header_files = 'src/glog/*.h'
  spec.pod_target_xcconfig = { "USE_HEADERMAP" => "NO",
                               "HEADER_SEARCH_PATHS" => "$(PODS_TARGET_SRCROOT)/src" }

  # Pinning to the same version as React.podspec.
  spec.platform = :ios, '8.0'

end
