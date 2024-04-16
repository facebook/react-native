module Typhoeus
  module Errors

    # Raises when block connection is turned on
    # and making a real request.
    class NoStub < TyphoeusError
      def initialize(request)
        super("The connection is blocked and no stub defined: #{request.url}")
      end
    end
  end
end
