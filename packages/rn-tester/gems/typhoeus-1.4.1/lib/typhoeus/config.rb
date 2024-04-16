module Typhoeus

  # The Typhoeus configuration used to set global
  # options.
  # @example Set the configuration options within a block.
  #   Typhoeus.configure do |config|
  #     config.verbose = true
  #   end
  #
  # @example Set the configuration directly.
  #   Typhoeus::Config.verbose = true
  module Config
    extend self

    # Defines whether the connection is blocked.
    # Defaults to false. When set to true, only
    # stubbed requests are allowed. A
    # {Typhoeus::Errors::NoStub} error is raised,
    # when trying to do a real request. It's possible
    # to work around inside
    # {Typhoeus.with_connection}.
    #
    # @return [ Boolean ]
    #
    # @see Typhoeus::Request::BlockConnection
    # @see Typhoeus::Hydra::BlockConnection
    # @see Typhoeus#with_connection
    # @see Typhoeus::Errors::NoStub
    attr_accessor :block_connection

    # Defines whether GET requests are memoized when using the {Typhoeus::Hydra}.
    #
    # @return [ Boolean ]
    #
    # @see Typhoeus::Hydra
    # @see Typhoeus::Hydra::Memoizable
    attr_accessor :memoize

    # Defines whether curls debug output is shown.
    # Unfortunately it prints to stderr.
    #
    # @return [ Boolean ]
    #
    # @see http://curl.haxx.se/libcurl/c/curl_easy_setopt.html#CURLOPTVERBOSE
    attr_accessor :verbose

    # Defines the default HTTP timeout for the entire request in seconds
    # See README for more details about timeouts
    #
    # @return [ Integer, Float ]
    #
    # @see https://curl.haxx.se/libcurl/c/curl_easy_setopt#CURLOPTTIMEOUT
    attr_accessor :timeout

    # Defines the default HTTP timeout for the connection phase in seconds
    # See README for more details about timeouts
    #
    # @return [ Integer, Float ]
    #
    # @see https://curl.haxx.se/libcurl/c/curl_easy_setopt.html#CURLOPTCONNECTTIMEOUT
    attr_accessor :connecttimeout

    # Defines whether requests are cached.
    #
    # @return [ Object ]
    #
    # @see Typhoeus::Hydra::Cacheable
    # @see Typhoeus::Request::Cacheable
    attr_accessor :cache

    # Defines whether to use a default user agent.
    #
    # @return [ String ]
    #
    # @see Typhoeus::Request#set_defaults
    attr_accessor :user_agent

    # Defines wether to use a proxy server for every request.
    #
    # @return [ String ]
    #
    # @see Typhoeus::Request#set_defaults
    attr_accessor :proxy
  end
end
