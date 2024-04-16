require 'digest/sha2'
require 'ethon'

require 'typhoeus/config'
require 'typhoeus/easy_factory'
require 'typhoeus/errors'
require 'typhoeus/expectation'
require 'typhoeus/hydra'
require 'typhoeus/pool'
require 'typhoeus/request'
require 'typhoeus/response'
require 'typhoeus/version'

# If we are using any Rack-based application, then we need the Typhoeus rack
# middleware to ensure our app is running properly.
if defined?(Rack)
  require "rack/typhoeus"
end

# If the Redis gem is available, load the redis cache adapter
if defined?(Redis)
  require "typhoeus/cache/redis"
end

# If the Dalli gem is available, load the Dalli cache adapter
if defined?(Dalli)
  require "typhoeus/cache/dalli"
end

# If we are using Rails, load the Rails cache adapter
if defined?(Rails)
  require "typhoeus/cache/rails"
end

# If we are using Rails, then we will include the Typhoeus railtie.
# if defined?(Rails)
#   require "typhoeus/railtie"
# end

# Typhoeus is a HTTP client library based on Ethon which
# wraps libcurl. Sitting on top of libcurl makes Typhoeus
# very reliable and fast.
#
# There are some gems using Typhoeus like
# {https://github.com/myronmarston/vcr VCR},
# {https://github.com/bblimke/webmock WebMock} or
# {https://github.com/technoweenie/faraday Faraday}. VCR
# and WebMock provide their own adapter whereas
# Faraday relies on {Faraday::Adapter::Typhoeus}
# since Typhoeus version 0.5.
#
# @example (see Typhoeus::Request)
# @example (see Typhoeus::Hydra)
#
# @see Typhoeus::Request
# @see Typhoeus::Hydra
# @see Faraday::Adapter::Typhoeus
#
# @since 0.5.0
module Typhoeus
  extend Request::Actions
  extend Request::Callbacks::Types

  # The default Typhoeus user agent.
  USER_AGENT = "Typhoeus - https://github.com/typhoeus/typhoeus"

  # Set the Typhoeus configuration options by passing a block.
  #
  # @example (see Typhoeus::Config)
  #
  # @yield [ Typhoeus::Config ]
  #
  # @return [ Typhoeus::Config ] The configuration.
  #
  # @see Typhoeus::Config
  def self.configure
    yield Config
  end

  # Stub out a specific request.
  #
  # @example (see Typhoeus::Expectation)
  #
  # @param [ String ] base_url The url to stub out.
  # @param [ Hash ] options The options to stub out.
  #
  # @return [ Typhoeus::Expectation ] The expecatation.
  #
  # @see Typhoeus::Expectation
  def self.stub(base_url, options = {}, &block)
    expectation = Expectation.all.find{ |e| e.base_url == base_url && e.options == options }
    if expectation.nil?
      expectation = Expectation.new(base_url, options)
      Expectation.all << expectation
    end

    expectation.and_return(&block) unless block.nil?
    expectation
  end

  # Add before callbacks.
  #
  # @example Add before callback.
  #   Typhoeus.before { |request| p request.base_url }
  #
  # @param [ Block ] block The callback.
  #
  # @yield [ Typhoeus::Request ]
  #
  # @return [ Array<Block> ] All before blocks.
  def self.before(&block)
    @before ||= []
    @before << block if block_given?
    @before
  end

  # Execute given block as if block connection is turned off.
  # The old block connection state is restored afterwards.
  #
  # @example Make a real request, no matter if it's blocked.
  #   Typhoeus::Config.block_connection = true
  #   Typhoeus.get("www.example.com").code
  #   #=> raise Typhoeus::Errors::NoStub
  #
  #   Typhoeus.with_connection do
  #     Typhoeus.get("www.example.com").code
  #     #=> :ok
  #   end
  #
  # @yield Yields control to the block after disabling block_connection.
  #        Afterwards, the block_connection is set to its original
  #        value.
  # @return [ Object ] Returns the return value of the block.
  #
  # @see Typhoeus::Config.block_connection
  def self.with_connection
    old = Config.block_connection
    Config.block_connection = false
    result = yield if block_given?
    Config.block_connection = old
    result
  end
end
