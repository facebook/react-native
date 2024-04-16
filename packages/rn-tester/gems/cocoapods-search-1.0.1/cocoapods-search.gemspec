# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'cocoapods-search/gem_version.rb'

Gem::Specification.new do |spec|
  spec.name          = 'cocoapods-search'
  spec.version       = CocoapodsSearch::VERSION
  spec.authors       = ['Eloy Durán', 'Fabio Pelosin', 'Emma Koszinowski']
  spec.email         = ['eloy.de.enige@gmail.com', 'fabiopelosin@gmail.com', 'emkosz@gmail.com']
  spec.description   = %q{Search for pods.}
  spec.summary       = %q{Searches for pods, ignoring case, whose name matches `QUERY`. If the
                      `--full` option is specified, this will also search in the summary and
                      description of the pods.}
  spec.homepage      = 'https://github.com/CocoaPods/cocoapods-search'
  spec.license       = 'MIT'

  spec.files         = `git ls-files`.split($/)
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ['lib']

  spec.add_development_dependency 'bundler', '~> 1.3'
  spec.add_development_dependency 'rake'
end
