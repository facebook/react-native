source 'https://rubygems.org'

require File.join(File.dirname(__FILE__), 'lib/concurrent-ruby/concurrent/version')
require File.join(File.dirname(__FILE__ ), 'lib/concurrent-ruby-edge/concurrent/edge/version')

no_path = ENV['NO_PATH']
options = no_path ? {} : { path: '.' }

gem 'concurrent-ruby', Concurrent::VERSION, options
gem 'concurrent-ruby-edge', Concurrent::EDGE_VERSION, options
gem 'concurrent-ruby-ext', Concurrent::VERSION, options.merge(platform: :mri)

group :development do
  gem 'rake', '~> 13.0'
  gem 'rake-compiler', '~> 1.0', '>= 1.0.7', '!= 1.2.4'
  gem 'rake-compiler-dock', '~> 1.0'
  gem 'pry', '~> 0.11', platforms: :mri
end

group :documentation, optional: true do
  gem 'yard', '~> 0.9.0', require: false
  gem 'redcarpet', '~> 3.0', platforms: :mri # understands github markdown
  gem 'md-ruby-eval', '~> 0.6'
end

group :testing do
  gem 'rspec', '~> 3.7'
  gem 'timecop', '~> 0.9'
  gem 'sigdump', require: false
end

# made opt-in since it will not install on jruby 1.7
group :coverage, optional: !ENV['COVERAGE'] do
  gem 'simplecov', '~> 0.16.0', require: false
  gem 'coveralls', '~> 0.8.2', require: false
end
