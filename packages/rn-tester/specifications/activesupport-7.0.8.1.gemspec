# -*- encoding: utf-8 -*-
# stub: activesupport 7.0.8.1 ruby lib

Gem::Specification.new do |s|
  s.name = "activesupport".freeze
  s.version = "7.0.8.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.metadata = { "bug_tracker_uri" => "https://github.com/rails/rails/issues", "changelog_uri" => "https://github.com/rails/rails/blob/v7.0.8.1/activesupport/CHANGELOG.md", "documentation_uri" => "https://api.rubyonrails.org/v7.0.8.1/", "mailing_list_uri" => "https://discuss.rubyonrails.org/c/rubyonrails-talk", "rubygems_mfa_required" => "true", "source_code_uri" => "https://github.com/rails/rails/tree/v7.0.8.1/activesupport" } if s.respond_to? :metadata=
  s.require_paths = ["lib".freeze]
  s.authors = ["David Heinemeier Hansson".freeze]
  s.date = "2024-02-21"
  s.description = "A toolkit of support libraries and Ruby core extensions extracted from the Rails framework. Rich support for multibyte strings, internationalization, time zones, and testing.".freeze
  s.email = "david@loudthinking.com".freeze
  s.homepage = "https://rubyonrails.org".freeze
  s.licenses = ["MIT".freeze]
  s.rdoc_options = ["--encoding".freeze, "UTF-8".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.7.0".freeze)
  s.rubygems_version = "3.1.6".freeze
  s.summary = "A toolkit of support libraries and Ruby core extensions extracted from the Rails framework.".freeze

  s.installed_by_version = "3.1.6" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4
  end

  if s.respond_to? :add_runtime_dependency then
    s.add_runtime_dependency(%q<i18n>.freeze, [">= 1.6", "< 2"])
    s.add_runtime_dependency(%q<tzinfo>.freeze, ["~> 2.0"])
    s.add_runtime_dependency(%q<concurrent-ruby>.freeze, ["~> 1.0", ">= 1.0.2"])
    s.add_runtime_dependency(%q<minitest>.freeze, [">= 5.1"])
  else
    s.add_dependency(%q<i18n>.freeze, [">= 1.6", "< 2"])
    s.add_dependency(%q<tzinfo>.freeze, ["~> 2.0"])
    s.add_dependency(%q<concurrent-ruby>.freeze, ["~> 1.0", ">= 1.0.2"])
    s.add_dependency(%q<minitest>.freeze, [">= 5.1"])
  end
end
