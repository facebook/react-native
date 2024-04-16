# frozen_string_literal: true

require 'bundler/setup'
require 'rspec/its'

begin
  require 'coveralls'
  Coveralls.wear! do
    add_filter "spec/"
    add_filter "vendor/"
  end
rescue LoadError
  warn "warning: coveralls gem not found; skipping Coveralls"
  require 'simplecov'
  SimpleCov.start do
    add_filter "spec/"
    add_filter "vendor/"
  end
end if Gem.loaded_specs.key?("simplecov")

class TestHelper
  def self.native_supported?
    mri = RUBY_ENGINE == "ruby"
    windows = RUBY_PLATFORM.include?("mingw")

    mri && !windows
  end
end

RSpec.configure do |config|
  config.warnings = true
  config.filter_run_when_matching :focus
end
