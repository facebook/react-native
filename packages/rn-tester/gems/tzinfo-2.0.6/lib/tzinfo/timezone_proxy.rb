# encoding: UTF-8

module TZInfo

  # A proxy class standing in for a {Timezone} with a given identifier.
  # {TimezoneProxy} inherits from {Timezone} and can be treated identically to
  # {Timezone} instances loaded with {Timezone.get}.
  #
  # {TimezoneProxy} instances are used to avoid the performance overhead of
  # loading time zone data into memory, for example, by {Timezone.all}.
  #
  # The first time an attempt is made to access the data for the time zone, the
  # real {Timezone} will be loaded is loaded. If the proxy's identifier was not
  # valid, then an exception will be raised at this point.
  class TimezoneProxy < Timezone
    # Initializes a new {TimezoneProxy}.
    #
    # The `identifier` parameter is not checked when initializing the proxy. It
    # will be validated when the real {Timezone} instance is loaded.
    #
    # @param identifier [String] an IANA Time Zone Database time zone
    #   identifier.
    def initialize(identifier)
      super()
      @identifier = identifier
      @real_timezone = nil
    end

    # (see Timezone#identifier)
    def identifier
      @real_timezone ? @real_timezone.identifier : @identifier
    end

    # (see Timezone#period_for)
    def period_for(time)
      real_timezone.period_for_utc(time)
    end

    # (see Timezone#periods_for_local)
    def periods_for_local(local_time)
      real_timezone.periods_for_local(local_time)
    end

    # (see Timezone#transitions_up_to)
    def transitions_up_to(to, from = nil)
      real_timezone.transitions_up_to(to, from)
    end

    # (see Timezone#canonical_zone)
    def canonical_zone
      real_timezone.canonical_zone
    end

    # Returns a serialized representation of this {TimezoneProxy}. This method
    # is called when using `Marshal.dump` with an instance of {TimezoneProxy}.
    #
    # @param limit [Integer] the maximum depth to dump - ignored. @return
    #   [String] a serialized representation of this {TimezoneProxy}.
    # @return [String] a serialized representation of this {TimezoneProxy}.
    def _dump(limit)
      identifier
    end

    # Loads a {TimezoneProxy} from the serialized representation returned by
    # {_dump}. This is method is called when using `Marshal.load` or
    # `Marshal.restore` to restore a serialized {Timezone}.
    #
    # @param data [String] a serialized representation of a {TimezoneProxy}.
    # @return [TimezoneProxy] the result of converting `data` back into a
    #   {TimezoneProxy}.
    def self._load(data)
      TimezoneProxy.new(data)
    end

    private

    # Returns the real {Timezone} instance being proxied.
    #
    # The real {Timezone} is loaded using {Timezone.get} on the first access.
    #
    # @return [Timezone] the real {Timezone} instance being proxied.
    def real_timezone
      # Thread-safety: It is possible that the value of @real_timezone may be
      # calculated multiple times in concurrently executing threads. It is not
      # worth the overhead of locking to ensure that @real_timezone is only
      # calculated once.
      unless @real_timezone
        result = Timezone.get(@identifier)
        return result if frozen?
        @real_timezone = result
      end

      @real_timezone
    end
  end
end
