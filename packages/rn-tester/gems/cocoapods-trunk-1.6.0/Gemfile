source 'https://rubygems.org'

gemspec

# This is the version that ships with OS X 10.10, so be sure we test against it.
# At the same time, the 1.7.7 version won't install cleanly on Ruby > 2.2,
# so we use a fork that makes a trivial change to a macro invocation.
gem 'json', :git => 'https://github.com/segiddins/json.git', :branch => 'seg-1.7.7-ruby-2.2'

group :development do
  gem 'cocoapods',      :git => "https://github.com/CocoaPods/CocoaPods.git", :branch => 'master'
  gem 'cocoapods-core', :git => "https://github.com/CocoaPods/Core.git", :branch => 'master'
  gem 'claide',         :git => 'https://github.com/CocoaPods/CLAide.git', :branch => 'master'

  gem 'bacon'
  gem 'kicker'
  gem 'mocha'
  gem 'mocha-on-bacon'
  gem 'prettybacon'
  gem 'webmock'

  gem 'codeclimate-test-reporter', :require => nil
  gem 'rubocop'
end

