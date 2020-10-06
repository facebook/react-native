require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/microsoft/react-native-macos.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
  s.name                   = "React-TurboModuleCxx-WinRTShared"
  s.version                = version
  s.summary                = "C++ supporting for Turbo Module."
  s.homepage               = "https://github.com/microsoft/react-native-macos"
  s.license                = package["license"]
  s.author                 = "Microsoft Corporation"
  s.platforms              = { :ios => "10.0", :tvos => "10.0", :osx => "10.13" }
  s.source                 = source
  s.source_files           = "WinRTShared/*.{h,cpp,mm}"
  s.library                = "stdc++"
  s.pod_target_xcconfig    = { "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++17" }

  s.dependency "React-callinvoker", version
end
