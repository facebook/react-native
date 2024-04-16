# frozen_string_literal: true
module Ethon
  module Errors

    # Raises when option is invalid.
    class InvalidOption < EthonError
      def initialize(option)
        super("The option: #{option} is invalid.")
      end
    end
  end
end

