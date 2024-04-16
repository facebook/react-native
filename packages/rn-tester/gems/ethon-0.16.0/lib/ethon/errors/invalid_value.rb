# frozen_string_literal: true
module Ethon
  module Errors

    # Raises when option is invalid.
    class InvalidValue < EthonError
      def initialize(option, value)
        super("The value: #{value} is invalid for option: #{option}.")
      end
    end
  end
end

