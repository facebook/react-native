# frozen_string_literal: true

require "bigdecimal"
require "bigdecimal/util"

module ActiveSupport
  module BigDecimalWithDefaultFormat # :nodoc:
    def to_s(format = "F")
      super(format)
    end
  end
end

BigDecimal.prepend(ActiveSupport::BigDecimalWithDefaultFormat)
