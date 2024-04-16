module Typhoeus
  class Request

    # This module handles the GET request memoization
    # on the request side. Memoization needs to be turned
    # on:
    #   Typhoeus.configure do |config|
    #     config.memoize = true
    #   end
    #
    # @api private
    module Memoizable

      # Override response setter and memoizes response
      # if the request is memoizable.
      #
      # @param [ Response ] response The response to set.
      #
      # @example Set response.
      #   request.response = response
      def response=(response)
        hydra.memory[self] = response if memoizable?
        super
      end

      # Return whether a request is memoizable.
      #
      # @example Is request memoizable?
      #   request.memoizable?
      #
      # @return [ Boolean ] Return true if memoizable, false else.
      def memoizable?
        Typhoeus::Config.memoize &&
          (options[:method].nil? || options[:method] == :get)
      end
    end
  end
end
