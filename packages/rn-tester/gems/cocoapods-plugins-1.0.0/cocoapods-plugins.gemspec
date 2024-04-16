# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'cocoapods_plugins.rb'

Gem::Specification.new do |spec|
  spec.name          = 'cocoapods-plugins'
  spec.version       = CocoapodsPlugins::VERSION
  spec.authors       = ['David Grandinetti', 'Olivier Halligon']
  spec.summary       = %q{CocoaPods plugin which shows info about available CocoaPods plugins.}
  spec.description   = <<-DESC
                         This CocoaPods plugin shows information about all available CocoaPods plugins
                         (yes, this is very meta!).
                         This CP plugin adds the "pod plugins" command to CocoaPods so that you can list
                         all plugins (registered in the reference JSON hosted at CocoaPods/cocoapods-plugins)
                       DESC
  spec.homepage      = 'https://github.com/cocoapods/cocoapods-plugins'
  spec.license       = 'MIT'

  spec.files         = `git ls-files`.split($/)
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ['lib']

  spec.add_runtime_dependency 'nap'

  spec.add_development_dependency 'bundler', '~> 1.3'
  spec.add_development_dependency 'rake'

  spec.required_ruby_version = '>= 2.0.0'
end
