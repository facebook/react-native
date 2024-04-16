# -*- encoding: utf-8 -*-
# stub: fourflusher 2.3.1 ruby lib

Gem::Specification.new do |s|
  s.name = "fourflusher".freeze
  s.version = "2.3.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Boris Bu\u0308gling".freeze]
  s.bindir = "exe".freeze
  s.date = "2019-06-18"
  s.email = ["boris@icculus.org".freeze]
  s.homepage = "https://github.com/neonichu/fourflusher".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "3.1.6".freeze
  s.summary = "A library for interacting with Xcode simulators.".freeze

  s.installed_by_version = "3.1.6" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4
  end

  if s.respond_to? :add_runtime_dependency then
    s.add_development_dependency(%q<bundler>.freeze, ["~> 1.11"])
    s.add_development_dependency(%q<rake>.freeze, ["~> 10.0"])
    s.add_development_dependency(%q<rspec>.freeze, ["~> 2"])
    s.add_development_dependency(%q<rubocop>.freeze, ["~> 0.35.0"])
  else
    s.add_dependency(%q<bundler>.freeze, ["~> 1.11"])
    s.add_dependency(%q<rake>.freeze, ["~> 10.0"])
    s.add_dependency(%q<rspec>.freeze, ["~> 2"])
    s.add_dependency(%q<rubocop>.freeze, ["~> 0.35.0"])
  end
end
