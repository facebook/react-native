# -*- encoding: utf-8 -*-
# stub: cocoapods-plugins 1.0.0 ruby lib

Gem::Specification.new do |s|
  s.name = "cocoapods-plugins".freeze
  s.version = "1.0.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["David Grandinetti".freeze, "Olivier Halligon".freeze]
  s.date = "2016-05-10"
  s.description = "                         This CocoaPods plugin shows information about all available CocoaPods plugins\n                         (yes, this is very meta!).\n                         This CP plugin adds the \"pod plugins\" command to CocoaPods so that you can list\n                         all plugins (registered in the reference JSON hosted at CocoaPods/cocoapods-plugins)\n".freeze
  s.homepage = "https://github.com/cocoapods/cocoapods-plugins".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.0.0".freeze)
  s.rubygems_version = "3.1.6".freeze
  s.summary = "CocoaPods plugin which shows info about available CocoaPods plugins.".freeze

  s.installed_by_version = "3.1.6" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4
  end

  if s.respond_to? :add_runtime_dependency then
    s.add_runtime_dependency(%q<nap>.freeze, [">= 0"])
    s.add_development_dependency(%q<bundler>.freeze, ["~> 1.3"])
    s.add_development_dependency(%q<rake>.freeze, [">= 0"])
  else
    s.add_dependency(%q<nap>.freeze, [">= 0"])
    s.add_dependency(%q<bundler>.freeze, ["~> 1.3"])
    s.add_dependency(%q<rake>.freeze, [">= 0"])
  end
end
