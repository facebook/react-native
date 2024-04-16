require 'zlib'
require 'digest/sha1'
require 'typhoeus/request/actions'
require 'typhoeus/request/before'
require 'typhoeus/request/block_connection'
require 'typhoeus/request/cacheable'
require 'typhoeus/request/callbacks'
require 'typhoeus/request/marshal'
require 'typhoeus/request/memoizable'
require 'typhoeus/request/operations'
require 'typhoeus/request/responseable'
require 'typhoeus/request/streamable'
require 'typhoeus/request/stubbable'

module Typhoeus

  # This class represents a request.
  #
  # @example (see #initialize)
  #
  # @example Make a request with the shortcut.
  #   response = Typhoeus.get("www.example.com")
  #
  # @see (see #initialize)
  class Request
    extend  Request::Actions
    include Request::Callbacks::Types
    include Request::Callbacks
    include Request::Streamable
    include Request::Marshal
    include Request::Operations
    include Request::Responseable
    include Request::Memoizable
    include Request::Cacheable
    include Request::BlockConnection
    include Request::Stubbable
    include Request::Before

    # Returns the provided base url.
    #
    # @return [ String ]
    attr_accessor :base_url

    # Returns options, which includes default parameters.
    #
    # @return [ Hash ]
    attr_accessor :options

    # Returns the hydra in which the request ran, if any.
    #
    # @return [ Typhoeus::Hydra ]
    #
    # @api private
    attr_accessor :hydra

    # Returns the original options provided.
    #
    # @return [ Hash ]
    #
    # @api private
    attr_accessor :original_options

    # @return [ Boolean ]
    #
    # @api private
    attr_accessor :block_connection

    # Creates a new request.
    #
    # @example Simplest request.
    #   response = Typhoeus::Request.new("www.example.com").run
    #
    # @example Request with url parameters.
    #   response = Typhoeus::Request.new(
    #     "www.example.com",
    #     params: {a: 1}
    #   ).run
    #
    # @example Request with a body.
    #   response = Typhoeus::Request.new(
    #     "www.example.com",
    #     body: {b: 2}
    #   ).run
    #
    # @example Request with parameters and body.
    #   response = Typhoeus::Request.new(
    #     "www.example.com",
    #     params: {a: 1},
    #     body: {b: 2}
    #   ).run
    #
    # @example Create a request and allow follow redirections.
    #   response = Typhoeus::Request.new(
    #     "www.example.com",
    #     followlocation: true
    #   ).run
    #
    # @param [ String ] base_url The url to request.
    # @param [ options ] options The options.
    #
    # @option options [ Hash ] :params Translated
    #   into url parameters.
    # @option options [ Hash ] :body Translated
    #   into HTTP POST request body.
    #
    # @return [ Typhoeus::Request ] The request.
    #
    # @note See {http://rubydoc.info/github/typhoeus/ethon/Ethon/Easy/Options Ethon::Easy::Options} for more options.
    #
    # @see Typhoeus::Hydra
    # @see Typhoeus::Response
    # @see Typhoeus::Request::Actions
    def initialize(base_url, options = {})
      @base_url = base_url
      @original_options = options
      @options = options.dup

      set_defaults
    end

    # Return the url.
    # In contrast to base_url which returns the value you specified, url returns
    # the full url including the parameters.
    #
    # @example Get the url.
    #   request.url
    #
    # @since 0.5.5
    def url
      easy = EasyFactory.new(self).get
      url = easy.url
      Typhoeus::Pool.release(easy)
      url
    end

    # Returns whether other is equal to self.
    #
    # @example Are request equal?
    #   request.eql?(other_request)
    #
    # @param [ Object ] other The object to check.
    #
    # @return [ Boolean ] Returns true if equal, else false.
    #
    # @api private
    def eql?(other)
      self.class == other.class &&
        self.base_url == other.base_url &&
        fuzzy_hash_eql?(self.options, other.options)
    end

    # Overrides Object#hash.
    #
    # @return [ Integer ] The integer representing the request.
    #
    # @api private
    def hash
      Zlib.crc32 cache_key
    end

    # Returns a cache key for use with caching methods that required a string
    # for a key. Will get used by ActiveSupport::Cache stores automatically.
    #
    # @return [ String ] The cache key.
    def cache_key
      Digest::SHA1.hexdigest "#{self.class.name}#{base_url}#{hashable_string_for(options)}"
    end

    # Mimics libcurls POST body generation. This is not accurate, but good
    # enough for VCR.
    #
    # @return [ String ] The encoded body.
    #   otherwise.
    #
    # @api private
    def encoded_body
      Ethon::Easy::Form.new(nil, options[:body]).to_s
    end

    private

    # Checks if two hashes are equal or not, discarding
    # first-level hash order.
    #
    # @param [ Hash ] left
    # @param [ Hash ] right hash to check for equality
    #
    # @return [ Boolean ] Returns true if hashes have
    #   same values for same keys and same length,
    #   even if the keys are given in a different order.
    def fuzzy_hash_eql?(left, right)
      return true if (left == right)

      (left.count == right.count) && left.inject(true) do |res, kvp|
        res && (kvp[1] == right[kvp[0]])
      end
    end

    def hashable_string_for(obj)
      case obj
      when Hash
        hashable_string_for(obj.sort_by {|sub_obj| sub_obj.first.to_s})
      when Array
        obj.map {|sub_obj| hashable_string_for(sub_obj)}.to_s
      else
        obj.to_s
      end
    end

    # Sets default header and verbose when turned on.
    def set_defaults
      default_user_agent = Config.user_agent || Typhoeus::USER_AGENT

      options[:headers] = {'User-Agent' => default_user_agent}.merge(options[:headers] || {})
      options[:headers]['Expect'] ||= ''
      options[:verbose] = Typhoeus::Config.verbose if options[:verbose].nil? && !Typhoeus::Config.verbose.nil?
      options[:timeout] = Typhoeus::Config.timeout if options[:timeout].nil? && !Typhoeus::Config.timeout.nil?
      options[:connecttimeout] = Typhoeus::Config.connecttimeout if options[:connecttimeout].nil? && !Typhoeus::Config.connecttimeout.nil?
      options[:maxredirs] ||= 50
      options[:proxy] = Typhoeus::Config.proxy unless options.has_key?(:proxy) || Typhoeus::Config.proxy.nil?
    end
  end
end
