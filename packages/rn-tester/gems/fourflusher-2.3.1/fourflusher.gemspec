# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'fourflusher/version'

Gem::Specification.new do |spec|
  spec.name          = 'fourflusher'
  spec.version       = Fourflusher::VERSION
  spec.authors       = ['Boris Bügling']
  spec.email         = ['boris@icculus.org']

  spec.summary       = 'A library for interacting with Xcode simulators.'
  spec.homepage      = 'https://github.com/neonichu/fourflusher'
  spec.license       = 'MIT'

  spec.files         = `git ls-files -z`.split("\x0").reject { |f|
    f.match(%r{^(test|spec|features)/})
  }
  spec.bindir        = 'exe'
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ['lib']

  spec.add_development_dependency 'bundler', '~> 1.11'
  spec.add_development_dependency 'rake', '~> 10.0'
  spec.add_development_dependency 'rspec', '~> 2'
  spec.add_development_dependency 'rubocop', '~> 0.35.0'
end
