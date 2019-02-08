
require 'json'

package = JSON.parse(File.read(File.join(__dir__, '../../package.json')))

version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
  s.name                = "RCTPushNotification"
  s.version             = version
  s.summary             = "A react native library for iOS push notifications"
  s.homepage            = "http://facebook.github.io/react-native/"
  s.license             = package['license']
  s.author              = "Facebook"
  s.source              = source
  s.requires_arc        = true
  s.platform            = :ios, "8.0"
  s.source_files        = "./*.{h,m}"
  s.dependency            "React/Core"
end
