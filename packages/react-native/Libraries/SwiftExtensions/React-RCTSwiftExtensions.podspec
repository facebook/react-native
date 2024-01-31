require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
  s.name                   = "React-RCTSwiftExtensions"
  s.version                = version
  s.summary                = "A library for easier React Native integration with SwiftUI."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Callstack"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = "*.{swift,h,m}"
  s.frameworks = ["UIKit", "SwiftUI"]

  s.dependency "React-Core"
  s.dependency "React-RCTXR" 
end
