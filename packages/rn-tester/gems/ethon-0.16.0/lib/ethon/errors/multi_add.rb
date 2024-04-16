# frozen_string_literal: true
module Ethon
  module Errors

    # Raises when multi_add_handle failed.
    class MultiAdd < EthonError
      def initialize(code, easy)
        super("An error occured adding the easy handle: #{easy} to the multi: #{code}")
      end
    end
  end
end
