# frozen_string_literal: true
module Ethon
  module Errors

    # Raised when select failed.
    class Select < EthonError
      def initialize(errno)
        super("An error occured on select: #{errno}")
      end
    end
  end
end

