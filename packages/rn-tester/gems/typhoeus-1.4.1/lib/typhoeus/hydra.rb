require 'typhoeus/hydra/addable'
require 'typhoeus/hydra/before'
require 'typhoeus/hydra/cacheable'
require 'typhoeus/hydra/block_connection'
require 'typhoeus/hydra/memoizable'
require 'typhoeus/hydra/queueable'
require 'typhoeus/hydra/runnable'
require 'typhoeus/hydra/stubbable'

module Typhoeus

  # Hydra manages making parallel HTTP requests. This
  # is achieved by using libcurls multi interface:
  # http://curl.haxx.se/libcurl/c/libcurl-multi.html
  # The benefits are that you don't have to worry running
  # the requests by yourself.
  #
  # Hydra will also handle how many requests you can
  # make in parallel. Things will get flakey if you
  # try to make too many requests at the same time.
  # The built in limit is 200. When more requests than
  # that are queued up, hydra will save them for later
  # and start the requests as others are finished. You
  # can raise or lower the concurrency limit through
  # the Hydra constructor.
  #
  # Regarding the asynchronous behavior of the hydra,
  # it is important to know that this is completely hidden
  # from the developer and you are free to apply
  # whatever technique you want to your code. That should not
  # conflict with libcurls internal concurrency mechanism.
  #
  # @example Use the hydra to do multiple requests.
  #   hydra = Typhoeus::Hydra.new
  #   requests = (0..9).map{ Typhoeus::Request.new("www.example.com") }
  #   requests.each{ |request| hydra.queue(request) }
  #   hydra.run
  #
  # @note Callbacks are going to delay the request
  #   execution.
  class Hydra
    include Hydra::Addable
    include Hydra::Runnable
    include Hydra::Memoizable
    include Hydra::Cacheable
    include Hydra::BlockConnection
    include Hydra::Stubbable
    include Hydra::Before
    include Hydra::Queueable

    # @example Set max_concurrency.
    #   Typhoeus::Hydra.new(max_concurrency: 20)
    attr_accessor :max_concurrency

    # @api private
    attr_reader :multi

    class << self

      # Returns a memoized hydra instance.
      #
      # @example Get a hydra.
      #   Typhoeus::Hydra.hydra
      #
      # @return [Typhoeus::Hydra] A new hydra.
      def hydra
        Thread.current[:typhoeus_hydra] ||= new
      end
    end

    # Create a new hydra. All
    # {http://rubydoc.info/github/typhoeus/ethon/Ethon/Multi#initialize-instance_method Ethon::Multi#initialize}
    # options are also available.
    #
    # @example Create a hydra.
    #   Typhoeus::Hydra.new
    #
    # @example Create a hydra with max_concurrency.
    #   Typhoeus::Hydra.new(max_concurrency: 20)
    #
    # @param [ Hash ] options The options hash.
    #
    # @option options :max_concurrency [ Integer ] Number
    #  of max concurrent connections to create. Default is
    #  200.
    #
    # @see http://rubydoc.info/github/typhoeus/ethon/Ethon/Multi#initialize-instance_method
    #   Ethon::Multi#initialize
    def initialize(options = {})
      @options = options
      @max_concurrency = Integer(@options.fetch(:max_concurrency, 200))
      @multi = Ethon::Multi.new(options.reject{|k,_| k==:max_concurrency})
    end
  end
end
