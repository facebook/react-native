# frozen_string_literal: true
module Ethon
  class Easy

    # This module contains class methods for feature checks
    module Features
      # Returns true if this curl version supports zlib.
      #
      # @example Return wether zlib is supported.
      #   Ethon::Easy.supports_zlib?
      #
      # @return [ Boolean ] True if supported, else false.
      def supports_zlib?
        !!(Curl.version_info[:features] & Curl::VERSION_LIBZ)
      end

      # Returns true if this curl version supports AsynchDNS.
      #
      # @example
      #   Ethon::Easy.supports_asynch_dns?
      #
      # @return [ Boolean ] True if supported, else false.
      def supports_asynch_dns?
        !!(Curl.version_info[:features] & Curl::VERSION_ASYNCHDNS)
      end

      alias :supports_timeout_ms? :supports_asynch_dns?

    end
  end
end
