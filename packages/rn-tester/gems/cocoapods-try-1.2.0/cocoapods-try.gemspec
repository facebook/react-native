# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'cocoapods_try.rb'

Gem::Specification.new do |spec|
  spec.name          = "cocoapods-try"
  spec.version       = CocoapodsTry::VERSION
  spec.authors       = ["Fabio Pelosin"]
  spec.summary       = %q{CocoaPods plugin which allows to quickly try the demo project of a Pod.}
  spec.homepage      = "https://github.com/cocoapods/cocoapods-try"
  spec.license       = "MIT"

  spec.files         = `git ls-files`.split($/)
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 1.3"
  spec.add_development_dependency "rake", '~> 10.0'
end
