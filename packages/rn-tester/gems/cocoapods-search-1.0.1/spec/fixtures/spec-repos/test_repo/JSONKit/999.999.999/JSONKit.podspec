Pod::Spec.new do |s|
  s.name     = 'JSONKit'
  s.version  = '999.999.999'
  s.license  = 'BSD / Apache License, Version 2.0'
  s.summary  = 'A Very High Performance Objective-C JSON Library.'
  s.homepage = 'https://github.com/johnezang/JSONKit'
  s.author   = 'John Engelhart'
  s.source   = { :git => 'https://github.com/johnezang/JSONKit.git', :commit => '0aff3deb5e1bb2bbc88a83fd71c8ad5550185cce' }

  s.source_files   = 'JSONKit.*'
  s.compiler_flags = '-Wno-deprecated-objc-isa-usage', '-Wno-format'
end
