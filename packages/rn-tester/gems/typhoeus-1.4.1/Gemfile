source "https://rubygems.org"
gemspec

if Gem.ruby_version < Gem::Version.new("2.0.0")
  gem "rake", "< 11"
  gem "json", "< 2"
else
  gem "json"
  gem "rake"
end

group :development, :test do
  gem "rspec", "~> 3.0"

  gem "sinatra", "~> 1.3"

  if Gem.ruby_version >= Gem::Version.new("1.9.0")
    gem "faraday", ">= 0.9", "< 2.0"
    gem "dalli", "~> 2.0"
  end

  if Gem.ruby_version >= Gem::Version.new("3.0.0")
    gem 'webrick'
  end

  gem "redis", "~> 3.0"

  if RUBY_PLATFORM == "java"
    gem "spoon"
  end

  unless ENV["CI"]
    gem "guard-rspec", "~> 0.7"
    gem 'rb-fsevent', '~> 0.9.1'
  end
end
