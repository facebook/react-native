source 'https://rubygems.org'

git_source(:github) { |repo_name| "https://github.com/#{repo_name}" }

# Load algoliasearch.gemspec dependencies
gemspec

# See https://github.com/algolia/algoliasearch-client-ruby/pull/257/files/36bcd0b1c4d05776dcbdb362c15a609c81f41cde
if Gem::Version.new(RUBY_VERSION) <= Gem::Version.new('1.9.3')
  gem 'hashdiff', '< 0.3.6' # Hashdiff 0.3.6 no longer supports Ruby 1.8
  gem 'highline', '< 1.7.0'
  gem 'mime-types', '< 2.0'
  gem 'rubysl', '~> 2.0', :platform => :rbx
else
  gem 'rubysl', '~> 2.2', :platform => :rbx
end

group :development do
  gem 'rake'
  gem 'rdoc'
  gem 'travis'
end

group :test do
  gem 'rspec', '>= 2.5.0'
  gem 'webmock'
  gem 'simplecov'
end
