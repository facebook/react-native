# frozen_string_literal: true
module Ethon
  module Errors

    # Raises when multi_remove_handle failed.
    class MultiRemove < EthonError
      def initialize(code, easy)
        super("An error occured removing the easy handle: #{easy} from the multi: #{code}")
      end
    end
  end
end
