module Typhoeus
  class Hydra

    # This module provides a way to hook into before
    # a request gets queued in hydra. This is very powerful
    # and you should be careful because when you accidently
    # return a falsy value the request won't be executed.
    #
    # @api private
    module Before

      # Overrride add in order to execute callbacks in
      # Typhoeus.before. Will break and return when a
      # callback returns nil, false or a response. Calls super
      # otherwise.
      #
      # @example Add the request.
      #   hydra.add(request)
      def add(request)
        Typhoeus.before.each do |callback|
          value = callback.call(request)
          if value.nil? || value == false || value.is_a?(Response)
            dequeue
            return value
          end
        end
        super
      end
    end
  end
end
