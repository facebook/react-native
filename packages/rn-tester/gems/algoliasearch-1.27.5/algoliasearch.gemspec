# -*- encoding: utf-8 -*-

require 'date'
require File.join(File.dirname(__FILE__), 'lib', 'algolia', 'version')

Gem::Specification.new do |s|
  s.name        = "algoliasearch"
  s.version     = Algolia::VERSION
  s.authors     = ["Algolia"]
  s.email       = "contact@algolia.com"

  s.date        = Date.today
  s.licenses    = ["MIT"]
  s.summary     = "A simple Ruby client for the algolia.com REST API"
  s.description = "A simple Ruby client for the algolia.com REST API"
  s.homepage    = "https://github.com/algolia/algoliasearch-client-ruby"

  s.metadata = {
    "bug_tracker_uri"   => "https://github.com/algolia/algoliasearch-client-ruby/issues",
    "changelog_uri"     => "https://github.com/algolia/algoliasearch-client-ruby/blob/master/CHANGELOG.md",
    "documentation_uri" => "http://www.rubydoc.info/gems/algoliasearch",
    "homepage_uri"      => "https://www.algolia.com/doc/api-client/ruby/getting-started/",
    "source_code_uri"   => "https://github.com/algolia/algoliasearch-client-ruby"
  }

  s.post_install_message = "A new major version is available for Algolia! Please now use the https://rubygems.org/gems/algolia gem to get the latest features."

  s.require_paths = ["lib"]
  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=

  s.extra_rdoc_files = [
    "CHANGELOG.md",
    "LICENSE",
    "README.md"
  ]
  s.files = [
    ".rspec",
    ".travis.yml",
    "CHANGELOG.md",
    "Gemfile",
    "Gemfile.lock",
    "LICENSE",
    "README.md",
    "Rakefile",
    "algoliasearch.gemspec",
    "contacts.json",
    "lib/algolia/analytics.rb",
    "lib/algolia/account_client.rb",
    "lib/algolia/client.rb",
    "lib/algolia/error.rb",
    "lib/algolia/index.rb",
    "lib/algolia/insights.rb",
    "lib/algolia/protocol.rb",
    "lib/algolia/version.rb",
    "lib/algolia/webmock.rb",
    "lib/algoliasearch.rb",
    "resources/ca-bundle.crt",
    "spec/account_client_spec.rb",
    "spec/client_spec.rb",
    "spec/mock_spec.rb",
    "spec/spec_helper.rb",
    "spec/stub_spec.rb"
  ]

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      if defined?(RUBY_VERSION) && RUBY_VERSION < '2.0'
        s.add_runtime_dependency     'json',       '>= 1.5.1', '< 2.3'
      else
        s.add_runtime_dependency     'json',       '>= 1.5.1'
      end
      s.add_runtime_dependency     'httpclient', '~> 2.8', '>= 2.8.3'
      s.add_development_dependency 'travis',     '~> 0'
      s.add_development_dependency 'rake',       '~> 0'
      s.add_development_dependency 'rdoc',       '~> 0'
    else
      s.add_dependency             'httpclient', '~> 2.8', '>= 2.8.3'
      s.add_dependency             'json',       '>= 1.5.1', '< 2.3'
    end
  else
    s.add_dependency               'httpclient', '~> 2.8', '>= 2.8.3'
    s.add_dependency               'json',       '>= 1.5.1', '< 2.3'
  end
end
