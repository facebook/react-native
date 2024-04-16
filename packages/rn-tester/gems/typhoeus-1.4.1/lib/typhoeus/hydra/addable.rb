module Typhoeus
  class Hydra

    # This module handles the request adding on
    # hydra.
    #
    # @api private
    module Addable

      # Adds request to multi.
      #
      # @example Add request.
      #   hydra.add(request)
      #
      # @param [ Typhoeus::Request ] request to add.
      #
      # @return [ void ]
      def add(request)
        multi.add(EasyFactory.new(request, self).get)
      end
    end
  end
end
