require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))
version = package['version']

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2021.06.28.00-v2'

Pod::Spec.new do |s|
  s.name                   = "React-TurboModuleCxx-RNW"
  s.version                = version
  s.summary                = "C++ supporting for Turbo Module."
  s.homepage               = "https://github.com/microsoft/react-native-windows"
  s.license                = package["license"]
  s.author                 = "Microsoft Corporation"
  s.platforms              = { :ios => "11.0", :osx => "10.15" }
  s.compiler_flags         = folly_compiler_flags
  s.source                 = { :git => 'https://github.com/microsoft/react-native-windows.git',
                               :commit => "d9077991441889ddaa18a8af6a2cc8514ca7714d" }
  s.source_files           = "vnext/Shared/TurboModuleRegistry.h",
                             "vnext/Microsoft.ReactNative/JsiReader.{h,cpp}",
                             "vnext/Microsoft.ReactNative/JsiWriter.{h,cpp}",
                             "vnext/Microsoft.ReactNative/TurboModulesProvider.{h,cpp}",
                             "vnext/Microsoft.ReactNative.Cxx/JSValue*.{h,cpp}",
                             "vnext/Microsoft.ReactNative.Cxx/Module*.{h,cpp}",
                             "vnext/Microsoft.ReactNative.Cxx/React*.{h,cpp}",
                             "vnext/Microsoft.ReactNative.Cxx/StructInfo.h",
                             "vnext/Microsoft.ReactNative.Cxx/NativeModules.h"
  s.library                = "stdc++"
  s.pod_target_xcconfig    = { "USE_HEADERMAP" => "YES",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++17" }

  s.dependency "RCT-Folly", folly_version
  s.dependency "React-callinvoker", version
  s.dependency "ReactCommon/turbomodule/core", version
  s.dependency "React-TurboModuleCxx-WinRTPort", version
end
