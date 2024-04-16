module Typhoeus
  class Request

    # This module handles stubbing on the request side.
    # It plays well with the block_connection configuration,
    # which raises when you make a request which is not stubbed.
    #
    # @api private
    module Stubbable

      # Override run in order to check for matching expectations.
      # When an expectation is found, super is not called. Instead a
      # canned response is assigned to the request.
      #
      # @example Run the request.
      #   request.run
      #
      # @return [ Response ] The response.
      def run
        if response = Expectation.response_for(self)
          execute_headers_callbacks(response)
          self.on_body.each{ |callback| callback.call(response.body, response) }
          finish(response)
        else
          super
        end
      end
    end
  end
end
