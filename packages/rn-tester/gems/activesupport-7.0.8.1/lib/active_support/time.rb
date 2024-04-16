# frozen_string_literal: true

module ActiveSupport
  autoload :Duration, "active_support/duration"
  autoload :TimeWithZone, "active_support/time_with_zone"
  autoload :TimeZone, "active_support/values/time_zone"
end

require "date"
require "time"

require "active_support/core_ext/time"
require "active_support/core_ext/date"
require "active_support/core_ext/date_time"

require "active_support/core_ext/integer/time"
require "active_support/core_ext/numeric/time"

require "active_support/core_ext/string/conversions"
require "active_support/core_ext/string/zones"
