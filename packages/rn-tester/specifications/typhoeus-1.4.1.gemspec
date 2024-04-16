# -*- encoding: utf-8 -*-
# stub: typhoeus 1.4.1 ruby lib

Gem::Specification.new do |s|
  s.name = "typhoeus".freeze
  s.version = "1.4.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 1.3.6".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["David Balatero".freeze, "Paul Dix".freeze, "Hans Hasselberg".freeze]
  s.date = "2023-11-17"
  s.description = "Like a modern code version of the mythical beast with 100 serpent heads, Typhoeus runs HTTP requests in parallel while cleanly encapsulating handling logic.".freeze
  s.email = ["hans.hasselberg@gmail.com".freeze]
  s.homepage = "https://github.com/typhoeus/typhoeus".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "3.1.6".freeze
  s.summary = "Parallel HTTP library on top of libcurl multi.".freeze

  s.installed_by_version = "3.1.6" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4
  end

  if s.respond_to? :add_runtime_dependency then
    s.add_runtime_dependency(%q<ethon>.freeze, [">= 0.9.0"])
  else
    s.add_dependency(%q<ethon>.freeze, [">= 0.9.0"])
  end
end
