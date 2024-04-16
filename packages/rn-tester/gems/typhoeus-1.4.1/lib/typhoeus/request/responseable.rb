module Typhoeus
  class Request

    # This module contains logic for having a reponse
    # getter and setter.
    module Responseable

      # Set the response.
      #
      # @example Set response.
      #  request.response = response
      #
      # @param [ Response ] value The response to set.
      def response=(value)
        @response = value
      end

      # Return the response.
      #
      # @example Return response.
      #   request.response
      #
      # @return [ Response ] The response.
      def response
        @response ||= nil
      end
    end
  end
end
