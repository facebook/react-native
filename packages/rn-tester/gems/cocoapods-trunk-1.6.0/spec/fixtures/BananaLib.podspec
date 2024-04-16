Pod::Spec.new do |s|
  s.name         = 'BananaLib'
  s.version      = '1.0'
  s.authors      = 'Banana Corp', { 'Monkey Boy' => 'monkey@banana-corp.local' }
  s.homepage     = 'http://banana-corp.local/banana-lib.html'
  s.summary      = 'Chunky bananas!'
  s.description  = 'Full of chunky bananas.'
  s.source       = { :git => 'http://banana-corp.local/banana-lib.git', :tag => 'v1.0' }
  s.license      = {
    :type => 'MIT',
    :file => 'LICENSE',
    :text => 'Permission is hereby granted ...'
  }
  s.source_files        = 'Classes/*.{h,m,d}', 'Vendor'
  s.resources           = "Resources/*"
  s.vendored_framework  = 'Bananalib.framework'
  s.vendored_library    = 'libBananalib.a'
  s.preserve_paths      = 'preserve_me.txt'
  s.public_header_files = 'Classes/Banana.h'

  s.prefix_header_file = 'Classes/BananaLib.pch'
  s.xcconfig     = { 'OTHER_LDFLAGS' => '-framework SystemConfiguration' }
  s.dependency   'monkey', '~> 1.0.1', '< 1.0.9'

end
