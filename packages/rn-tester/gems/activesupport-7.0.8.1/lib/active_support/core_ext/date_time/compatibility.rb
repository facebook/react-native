# frozen_string_literal: true

require "active_support/core_ext/date_and_time/compatibility"
require "active_support/core_ext/module/redefine_method"

class DateTime
  include DateAndTime::Compatibility

  silence_redefinition_of_method :to_time

  # Either return an instance of +Time+ with the same UTC offset
  # as +self+ or an instance of +Time+ representing the same time
  # in the local system timezone depending on the setting of
  # on the setting of +ActiveSupport.to_time_preserves_timezone+.
  def to_time
    preserve_timezone ? getlocal(utc_offset) : getlocal
  end
end
