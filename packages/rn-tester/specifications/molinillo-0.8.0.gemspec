# -*- encoding: utf-8 -*-
# stub: molinillo 0.8.0 ruby lib

Gem::Specification.new do |s|
  s.name = "molinillo".freeze
  s.version = "0.8.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Samuel E. Giddins".freeze]
  s.date = "2021-08-09"
  s.email = ["segiddins@segiddins.me".freeze]
  s.homepage = "https://github.com/CocoaPods/Molinillo".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.3.0".freeze)
  s.rubygems_version = "3.1.6".freeze
  s.summary = "Provides support for dependency resolution".freeze

  s.installed_by_version = "3.1.6" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4
  end

  if s.respond_to? :add_runtime_dependency then
    s.add_development_dependency(%q<rake>.freeze, [">= 0"])
  else
    s.add_dependency(%q<rake>.freeze, [">= 0"])
  end
end
