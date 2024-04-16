# frozen_string_literal: true
$LOAD_PATH.unshift(File.dirname(__FILE__))
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), "..", "lib"))

require 'bundler'
Bundler.setup
require "ethon"
require 'rspec'

if defined? require_relative
  require_relative 'support/localhost_server'
  require_relative 'support/server'
else
  require 'support/localhost_server'
  require 'support/server'
end

# Ethon.logger = Logger.new($stdout).tap do |log|
#   log.level = Logger::DEBUG
# end

RSpec.configure do |config|
  # config.order = :rand

  config.before(:suite) do
    LocalhostServer.new(TESTSERVER.new, 3001)
  end
end
