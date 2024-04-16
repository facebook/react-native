module Typhoeus
  class Hydra

    # This module handles the GET request memoization
    # on the hydra side. Memoization needs to be turned
    # on:
    #   Typhoeus.configure do |config|
    #     config.memoize = true
    #   end
    #
    # @api private
    module Memoizable

      # Return the memory.
      #
      # @example Return the memory.
      #   hydra.memory
      #
      # @return [ Hash ] The memory.
      def memory
        @memory ||= {}
      end

      # Overrides add in order to check before if request
      # is memoizable and already in memory. If thats the case,
      # super is not called, instead the response is set and
      # the on_complete callback called.
      #
      # @example Add the request.
      #   hydra.add(request)
      #
      # @param [ Request ] request The request to add.
      #
      # @return [ Request ] The added request.
      def add(request)
        if request.memoizable? && memory.has_key?(request)
          response = memory[request]
          request.finish(response, true)
          dequeue
        else
          super
        end
      end

      # Overrides run to make sure the memory is cleared after
      # each run.
      #
      # @example Run hydra.
      #   hydra.run
      def run
        super
        memory.clear
      end
    end
  end
end
