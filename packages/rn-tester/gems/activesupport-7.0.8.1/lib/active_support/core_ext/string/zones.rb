# frozen_string_literal: true

require "active_support/core_ext/string/conversions"
require "active_support/core_ext/time/zones"

class String
  # Converts String to a TimeWithZone in the current zone if Time.zone or Time.zone_default
  # is set, otherwise converts String to a Time via String#to_time
  def in_time_zone(zone = ::Time.zone)
    if zone
      ::Time.find_zone!(zone).parse(self)
    else
      to_time
    end
  end
end
