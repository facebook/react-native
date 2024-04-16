module Concurrent

  # @!macro monotonic_get_time
  #
  #   Returns the current time as tracked by the application monotonic clock.
  #
  #   @param [Symbol] unit the time unit to be returned, can be either
  #     :float_second, :float_millisecond, :float_microsecond, :second,
  #     :millisecond, :microsecond, or :nanosecond default to :float_second.
  #
  #   @return [Float] The current monotonic time since some unspecified
  #     starting point
  #
  #   @!macro monotonic_clock_warning
  def monotonic_time(unit = :float_second)
    Process.clock_gettime(Process::CLOCK_MONOTONIC, unit)
  end
  module_function :monotonic_time
end
