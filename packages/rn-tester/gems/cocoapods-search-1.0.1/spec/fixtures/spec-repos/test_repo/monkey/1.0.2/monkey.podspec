Pod::Spec.new do |s|
  s.name             = "monkey"
  s.version          = "1.0.2"
  s.author           = { "Funky Monkey" => "funky@monkey.local" }
  s.summary          = "🙈🙉🙊"
  s.description      = "See no evil! Hear no evil! Speak no evil!"
  s.homepage         = "http://httpbin.org/html"
  s.source           = { :git => "http://monkey.local/monkey.git", :tag => s.version.to_s }
  s.license          = 'MIT'
  s.vendored_library = 'monkey.a'
end
