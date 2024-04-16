# encoding: utf-8
lib = File.expand_path('../lib/', __FILE__)
$:.unshift lib unless $:.include?(lib)

require 'typhoeus/version'

Gem::Specification.new do |s|
  s.name         = "typhoeus"
  s.version      = Typhoeus::VERSION
  s.platform     = Gem::Platform::RUBY
  s.authors      = ["David Balatero", "Paul Dix", "Hans Hasselberg"]
  s.email        = ["hans.hasselberg@gmail.com"]
  s.homepage     = "https://github.com/typhoeus/typhoeus"
  s.summary      = "Parallel HTTP library on top of libcurl multi."
  s.description  = %q{Like a modern code version of the mythical beast with 100 serpent heads, Typhoeus runs HTTP requests in parallel while cleanly encapsulating handling logic.}

  s.required_rubygems_version = ">= 1.3.6"
  s.license = 'MIT'

  s.add_dependency('ethon', [">= 0.9.0"])

  s.files        = `git ls-files`.split("\n")
  s.test_files   = `git ls-files -- spec/*`.split("\n")
  s.require_path = 'lib'
end
