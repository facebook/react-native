# frozen_string_literal: true
#### SETUP
require 'bundler'
Bundler.setup
require 'rspec'

require 'support/localhost_server'
require 'support/server'
require_relative 'support/memory_test_helpers'

require 'logger'

if ENV['VERBOSE']
  Ethon.logger = Logger.new($stdout)
  Ethon.logger.level = Logger::DEBUG
end

RSpec.configure do |config|
  config.before(:suite) do
    LocalhostServer.new(TESTSERVER.new, 3001)
  end
  config.include(MemoryTestHelpers)
  config.extend(MemoryTestHelpers::TestMethods)
end

MemoryTestHelpers.setup
MemoryTestHelpers.logger = Logger.new($stdout)
MemoryTestHelpers.logger.level = Logger::INFO
MemoryTestHelpers.logger.formatter = proc do |severity, datetime, progname, msg|
  "\t\t#{msg}\n"
end

if ENV['VERBOSE']
  MemoryTestHelpers.logger.level = Logger::DEBUG
end

MemoryTestHelpers.iterations = ENV.fetch("ITERATIONS", 10_000).to_i
