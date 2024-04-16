# -*- encoding: utf-8 -*-
# stub: addressable 2.8.6 ruby lib

Gem::Specification.new do |s|
  s.name = "addressable".freeze
  s.version = "2.8.6"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.metadata = { "changelog_uri" => "https://github.com/sporkmonger/addressable/blob/main/CHANGELOG.md#v2.8.6" } if s.respond_to? :metadata=
  s.require_paths = ["lib".freeze]
  s.authors = ["Bob Aman".freeze]
  s.date = "2023-12-09"
  s.description = "Addressable is an alternative implementation to the URI implementation that is\npart of Ruby's standard library. It is flexible, offers heuristic parsing, and\nadditionally provides extensive support for IRIs and URI templates.\n".freeze
  s.email = "bob@sporkmonger.com".freeze
  s.extra_rdoc_files = ["README.md".freeze]
  s.files = ["README.md".freeze]
  s.homepage = "https://github.com/sporkmonger/addressable".freeze
  s.licenses = ["Apache-2.0".freeze]
  s.rdoc_options = ["--main".freeze, "README.md".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.2".freeze)
  s.rubygems_version = "3.1.6".freeze
  s.summary = "URI Implementation".freeze

  s.installed_by_version = "3.1.6" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4
  end

  if s.respond_to? :add_runtime_dependency then
    s.add_runtime_dependency(%q<public_suffix>.freeze, [">= 2.0.2", "< 6.0"])
    s.add_development_dependency(%q<bundler>.freeze, [">= 1.0", "< 3.0"])
  else
    s.add_dependency(%q<public_suffix>.freeze, [">= 2.0.2", "< 6.0"])
    s.add_dependency(%q<bundler>.freeze, [">= 1.0", "< 3.0"])
  end
end
