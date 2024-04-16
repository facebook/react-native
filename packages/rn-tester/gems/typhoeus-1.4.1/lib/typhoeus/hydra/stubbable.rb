module Typhoeus
  class Hydra

    # This module handles stubbing on the hydra side.
    # It plays well with the block_connection configuration,
    # which raises when you make a request which is not stubbed.
    #
    # @api private
    module Stubbable

      # Override add in order to check for matching expecations.
      # When an expecation is found, super is not called. Instead a
      # canned response is assigned to the request.
      #
      # @example Add the request.
      #   hydra.add(request)
      def add(request)
        if response = Expectation.response_for(request)
          request.execute_headers_callbacks(response)
          request.on_body.each{ |callback| callback.call(response.body, response) }
          request.finish(response)
        else
          super
        end
      end
    end
  end
end
