# frozen_string_literal: true

require "active_support/core_ext/module/attribute_accessors"

module DateAndTime
  module Compatibility
    # If true, +to_time+ preserves the timezone offset of receiver.
    #
    # NOTE: With Ruby 2.4+ the default for +to_time+ changed from
    # converting to the local system time, to preserving the offset
    # of the receiver. For backwards compatibility we're overriding
    # this behavior, but new apps will have an initializer that sets
    # this to true, because the new behavior is preferred.
    mattr_accessor :preserve_timezone, instance_writer: false, default: false

    # Change the output of <tt>ActiveSupport::TimeZone.utc_to_local</tt>.
    #
    # When +true+, it returns local times with a UTC offset, with +false+ local
    # times are returned as UTC.
    #
    #   # Given this zone:
    #   zone = ActiveSupport::TimeZone["Eastern Time (US & Canada)"]
    #
    #   # With `utc_to_local_returns_utc_offset_times = false`, local time is converted to UTC:
    #   zone.utc_to_local(Time.utc(2000, 1)) # => 1999-12-31 19:00:00 UTC
    #
    #   # With `utc_to_local_returns_utc_offset_times = true`, local time is returned with UTC offset:
    #   zone.utc_to_local(Time.utc(2000, 1)) # => 1999-12-31 19:00:00 -0500
    mattr_accessor :utc_to_local_returns_utc_offset_times, instance_writer: false, default: false
  end
end
