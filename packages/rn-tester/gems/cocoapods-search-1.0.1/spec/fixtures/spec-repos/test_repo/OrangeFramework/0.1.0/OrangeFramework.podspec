Pod::Spec.new do |s|
  s.name             = "OrangeFramework"
  s.version          = "0.1.0"
  s.author           = { "Swiftest Orang-Utan" => "swiftest@orang.utan.local" }
  s.summary          = "Fresh juice!"
  s.description      = "Blends fresh orange juice."
  s.homepage         = "http://httpbin.org/html"
  s.source           = { :git => "http://utan.local/orange-framework.git", :tag => s.version.to_s }
  s.license          = 'MIT'

  s.platform     = :ios, '8.0'

  s.source_files = 'Source/Juicer.swift'

  s.frameworks = 'UIKit'
end
