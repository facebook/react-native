# coding: utf-8
# frozen_string_literal: true

lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'nanaimo/version'

Gem::Specification.new do |spec|
  spec.name          = 'nanaimo'
  spec.version       = Nanaimo::VERSION
  spec.authors       = ['Danielle Tomlinson', 'Samuel Giddins']
  spec.email         = ['dan@tomlinson.io', 'segiddins@segiddins.me']

  spec.summary       = 'A library for (de)serialization of ASCII Plists.'
  spec.homepage      = 'https://github.com/CocoaPods/Nanaimo'
  spec.license       = 'MIT'

  spec.files         = `git ls-files -z`.split("\x0").reject { |f| f.match(%r{^(test|spec|features)/}) }
  spec.bindir        = 'exe'
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ['lib']

  spec.add_development_dependency 'bundler', '~> 1.12'
  spec.add_development_dependency 'rake', '~> 12.3'
  spec.add_development_dependency 'rspec', '~> 3.0'
end
