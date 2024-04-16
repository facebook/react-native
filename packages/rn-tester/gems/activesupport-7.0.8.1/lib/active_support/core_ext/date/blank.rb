# frozen_string_literal: true

require "date"

class Date # :nodoc:
  # No Date is blank:
  #
  #   Date.today.blank? # => false
  #
  # @return [false]
  def blank?
    false
  end
end
