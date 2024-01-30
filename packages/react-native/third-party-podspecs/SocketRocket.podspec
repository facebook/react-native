# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# [visionOS] Local copy of SocketRocket.podspec with visionOS added as a platform

socket_rocket_version = '0.7.0'

Pod::Spec.new do |s|
  s.name               = 'SocketRocket'
  s.version            = socket_rocket_version
  s.summary            = 'A conforming WebSocket (RFC 6455) client library for iOS, macOS and tvOS.'
  s.homepage           = 'https://github.com/facebook/SocketRocket'
  s.authors            = { 'Nikita Lutsenko' => 'nlutsenko@me.com', 'Dan Federman' => 'federman@squareup.com', 'Mike Lewis' => 'mikelikespie@gmail.com' }
  s.license            = 'BSD'
  s.source             = { :git => 'https://github.com/facebook/SocketRocket.git', :tag => socket_rocket_version }
  s.requires_arc       = true

  s.source_files       = 'SocketRocket/**/*.{h,m}'
  s.public_header_files = 'SocketRocket/*.h'

  s.platforms = min_supported_versions

  s.ios.frameworks     = 'CFNetwork', 'Security'
  s.osx.frameworks     = 'CoreServices', 'Security'
  s.tvos.frameworks    = 'CFNetwork', 'Security'
  s.visionos.frameworks = 'CFNetwork', 'Security'
  s.libraries          = 'icucore'
end
