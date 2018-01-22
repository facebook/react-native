Pod::Spec.new do |spec|
  spec.name = 'Folly'
  spec.version = '2016.09.26.00'
  spec.license = { :type => 'Apache License, Version 2.0' }
  spec.homepage = 'https://github.com/facebook/folly'
  spec.summary = 'An open-source C++ library developed and used at Facebook.'
  spec.authors = 'Facebook'
  spec.source = { :git => 'https://github.com/facebook/folly.git',
                  :tag => "v#{spec.version}" }
  spec.module_name = 'folly'
  spec.dependency 'boost-for-react-native'
  spec.dependency 'DoubleConversion'
  spec.dependency 'glog'
  spec.compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'
  spec.source_files = 'folly/Bits.{h,cpp}',
                      'folly/Conv.{h,cpp}',
                      'folly/Demangle.{h,cpp}',
                      'folly/StringBase.{h,cpp}',
                      'folly/Unicode.{h,cpp}',
                      'folly/dynamic.{h,cpp}',
                      'folly/json.{h,cpp}',
                      'folly/portability/BitsFunctexcept.{h,cpp}',
                      'folly/detail/MallocImpl.{h,cpp}'
  # workaround for https://github.com/facebook/react-native/issues/14326
  spec.preserve_paths = 'folly/*.h',
                        'folly/detail/*.h',
                        'folly/portability/*.h'
  spec.libraries           = "stdc++"
  spec.pod_target_xcconfig = { "USE_HEADERMAP" => "NO",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++14",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)\" \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/DoubleConversion\"" }

  # Pinning to the same version as React.podspec.
  spec.platforms = { :ios => "8.0", :tvos => "9.2" }
end
