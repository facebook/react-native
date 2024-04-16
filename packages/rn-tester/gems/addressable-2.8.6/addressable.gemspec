# -*- encoding: utf-8 -*-
# stub: addressable 2.8.6 ruby lib

Gem::Specification.new do |s|
  s.name = "addressable".freeze
  s.version = "2.8.6".freeze

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.metadata = { "changelog_uri" => "https://github.com/sporkmonger/addressable/blob/main/CHANGELOG.md#v2.8.6" } if s.respond_to? :metadata=
  s.require_paths = ["lib".freeze]
  s.authors = ["Bob Aman".freeze]
  s.date = "2023-12-09"
  s.description = "Addressable is an alternative implementation to the URI implementation that is\npart of Ruby's standard library. It is flexible, offers heuristic parsing, and\nadditionally provides extensive support for IRIs and URI templates.\n".freeze
  s.email = "bob@sporkmonger.com".freeze
  s.extra_rdoc_files = ["README.md".freeze]
  s.files = ["CHANGELOG.md".freeze, "Gemfile".freeze, "LICENSE.txt".freeze, "README.md".freeze, "Rakefile".freeze, "addressable.gemspec".freeze, "data/unicode.data".freeze, "lib/addressable.rb".freeze, "lib/addressable/idna.rb".freeze, "lib/addressable/idna/native.rb".freeze, "lib/addressable/idna/pure.rb".freeze, "lib/addressable/template.rb".freeze, "lib/addressable/uri.rb".freeze, "lib/addressable/version.rb".freeze, "spec/addressable/idna_spec.rb".freeze, "spec/addressable/net_http_compat_spec.rb".freeze, "spec/addressable/security_spec.rb".freeze, "spec/addressable/template_spec.rb".freeze, "spec/addressable/uri_spec.rb".freeze, "spec/spec_helper.rb".freeze, "tasks/clobber.rake".freeze, "tasks/gem.rake".freeze, "tasks/git.rake".freeze, "tasks/metrics.rake".freeze, "tasks/profile.rake".freeze, "tasks/rspec.rake".freeze, "tasks/yard.rake".freeze]
  s.homepage = "https://github.com/sporkmonger/addressable".freeze
  s.licenses = ["Apache-2.0".freeze]
  s.rdoc_options = ["--main".freeze, "README.md".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.2".freeze)
  s.rubygems_version = "3.4.22".freeze
  s.summary = "URI Implementation".freeze

  s.specification_version = 4

  s.add_runtime_dependency(%q<public_suffix>.freeze, [">= 2.0.2".freeze, "< 6.0".freeze])
  s.add_development_dependency(%q<bundler>.freeze, [">= 1.0".freeze, "< 3.0".freeze])
end
