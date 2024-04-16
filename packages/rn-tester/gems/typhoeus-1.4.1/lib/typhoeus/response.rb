require 'typhoeus/response/header'
require 'typhoeus/response/informations'
require 'typhoeus/response/status'
require 'typhoeus/response/cacheable'

module Typhoeus

  # This class represents the response.
  class Response
    include Response::Informations
    include Response::Status
    include Response::Cacheable

    # Remembers the corresponding request.
    #
    # @example Get request.
    #   request = Typhoeus::Request.new("www.example.com")
    #   response = request.run
    #   request == response.request
    #   #=> true
    #
    # @return [ Typhoeus::Request ]
    attr_accessor :request

    # The provided options, which contain all the
    # informations about the request.
    #
    # @return [ Hash ]
    attr_accessor :options

    # Set the handled response.
    attr_writer :handled_response

    # @api private
    attr_writer :mock

    # Create a new response.
    #
    # @example Create a response.
    #  Response.new
    #
    # @param [ Hash ] options The options hash.
    #
    # @return [ Response ] The new response.
    def initialize(options = {})
      @options = options
      @headers = Header.new(options[:headers]) if options[:headers]
    end

    # Returns whether this request is mocked
    # or not.
    #
    # @api private
    def mock
      defined?(@mock) ? @mock : options[:mock]
    end
    alias :mock? :mock

    # Returns the handled_response if it has
    # been defined; otherwise, returns the response
    #
    # @return [ Object ] The result of callbacks
    #   done on the response or the original response.
    def handled_response
      @handled_response || self
    end
  end
end
