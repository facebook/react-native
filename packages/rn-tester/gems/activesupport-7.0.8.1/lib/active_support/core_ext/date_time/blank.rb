# frozen_string_literal: true

require "date"

class DateTime # :nodoc:
  # No DateTime is ever blank:
  #
  #   DateTime.now.blank? # => false
  #
  # @return [false]
  def blank?
    false
  end
end
