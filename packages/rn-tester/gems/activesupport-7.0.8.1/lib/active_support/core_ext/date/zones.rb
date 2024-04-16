# frozen_string_literal: true

require "date"
require "active_support/core_ext/date_and_time/zones"

class Date
  include DateAndTime::Zones
end
