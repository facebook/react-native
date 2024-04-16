Pod::Spec.new do |s|
  s.name         = 'BananaLib'
  s.version      = '1.0'
  s.authors      = 'Banana Corp', { 'Monkey Boy' => 'monkey@banana-corp.local' }
  s.homepage     = 'http://banana-corp.local/banana-lib.html'
  s.summary      = 'Chunky bananas!'
  s.description  = 'Full of chunky bananas.'
  s.platform     = :ios

  s.source       = { :git => 'http://banana-corp.local/banana-lib.git', :tag => 'v1.0' }
  s.source_files = 'Classes/*.{h,m}', 'Vendor'
  s.xcconfig     = { 'OTHER_LDFLAGS' => '-framework SystemConfiguration' }
  s.prefix_header_file = 'Classes/BananaLib.pch'
  s.resources    = "Resources/*.png"
  s.dependency   'monkey', '~> 1.0.1', '< 1.0.9'
  s.license      = {
    :type => 'MIT',
    :file => 'LICENSE',
    :text => 'Permission is hereby granted ...'
  }
end
