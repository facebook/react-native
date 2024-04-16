module Typhoeus
  class Hydra

    # This module handles the blocked connection request mode on
    # the hydra side, where only stubbed requests
    # are allowed.
    # Connection blocking needs to be turned on:
    #   Typhoeus.configure do |config|
    #     config.block_connection = true
    #   end
    #
    # When trying to do real requests a NoStub error
    # is raised.
    #
    # @api private
    module BlockConnection

      # Overrides add in order to check before if block connection
      # is turned on. If thats the case a NoStub error is
      # raised.
      #
      # @example Add the request.
      #   hydra.add(request)
      #
      # @param [ Request ] request The request to enqueue.
      def add(request)
        if request.blocked?
          raise Typhoeus::Errors::NoStub.new(request)
        else
          super
        end
      end
    end
  end
end
