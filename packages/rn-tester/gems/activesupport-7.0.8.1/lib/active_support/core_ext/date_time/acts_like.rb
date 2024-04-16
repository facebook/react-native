# frozen_string_literal: true

require "date"
require "active_support/core_ext/object/acts_like"

class DateTime
  # Duck-types as a Date-like class. See Object#acts_like?.
  def acts_like_date?
    true
  end

  # Duck-types as a Time-like class. See Object#acts_like?.
  def acts_like_time?
    true
  end
end
