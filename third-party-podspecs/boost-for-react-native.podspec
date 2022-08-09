# TODO(macOS GH#214)
Pod::Spec.new do |spec|
  spec.name = 'boost-for-react-native'
  spec.version = '1.63.0'
  spec.license = { :type => 'Boost Software License', :file => "LICENSE_1_0.txt" }
  spec.homepage = 'http://www.boost.org'
  spec.summary = 'Boost provides free peer-reviewed portable C++ source libraries.'
  spec.authors = 'Rene Rivera'
  spec.source = { :git => 'https://github.com/react-native-community/boost-for-react-native.git',
                  :tag => 'v1.63.0-0' }

  # Pinning to the same version as React.podspec.
  # TODO: Move this osx addition back upstream to https://github.com/react-native-community/boost-for-react-native
  spec.platforms = { :ios => '8.0', :osx => "10.15" }
  spec.requires_arc = false

  spec.module_name = 'boost'
  spec.header_dir = 'boost'
  spec.preserve_path = 'boost'
end
