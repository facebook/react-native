require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))
version = package['version']

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.06.28.00-v2'

source = { :git => 'https://github.com/microsoft/react-native-macos.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
  s.name                   = "React-TurboModuleCxx-WinRTPort"
  s.version                = version
  s.summary                = "C++ supporting for Turbo Module."
  s.homepage               = "https://github.com/microsoft/react-native-macos"
  s.license                = package["license"]
  s.author                 = "Microsoft Corporation"
  s.platforms              = { :ios => "11.0", :osx => "10.15" }
  s.compiler_flags         = folly_compiler_flags
  s.source                 = source

  s.subspec 'Shared' do |ss|
    ss.source_files        = "Shared/*.{h,cpp,mm}"
    ss.library             = "stdc++"
    ss.pod_target_xcconfig = { "USE_HEADERMAP" => "YES",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++17" }
  end

  s.subspec 'WinRT' do |ss|
    ss.source_files        = "WinRT/*.{h,cpp,mm}"
    ss.library             = "stdc++"
    ss.pod_target_xcconfig = { "USE_HEADERMAP" => "YES",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++17" }
    ss.header_dir          = "winrt"

    ss.dependency "RCT-Folly", folly_version
    ss.dependency "React-callinvoker", version
    ss.dependency "React-TurboModuleCxx-WinRTPort/Shared", version
  end
end
