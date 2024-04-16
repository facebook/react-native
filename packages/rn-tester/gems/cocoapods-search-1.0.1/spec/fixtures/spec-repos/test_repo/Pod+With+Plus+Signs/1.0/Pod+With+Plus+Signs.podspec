Pod::Spec.new do |s|
  s.name         = 'Pod+With+Plus+Signs'
  s.version      = '1.0'
  s.authors      = 'Evil Corp'
  s.homepage     = 'http://evil-corp.local/pod_with_plus_signs.html'
  s.summary      = 'Messing with special chars'
  s.description  = 'I love messing up with special chars in my pod name! Mouahahahahaa (evil laugh)'
  s.platform     = :ios

  s.source       = { :git => 'http://evil-corp.local/pod_with_plus_signs.git', :tag => '1.0' }
  s.source_files = 'Classes/*.{h,m}'
  s.license      = {
    :type => 'MIT',
    :file => 'LICENSE',
    :text => 'Permission is hereby granted ...'
  }
end
