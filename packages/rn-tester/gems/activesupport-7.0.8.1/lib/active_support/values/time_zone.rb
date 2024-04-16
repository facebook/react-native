# frozen_string_literal: true

require "tzinfo"
require "concurrent/map"

module ActiveSupport
  # The TimeZone class serves as a wrapper around <tt>TZInfo::Timezone</tt> instances.
  # It allows us to do the following:
  #
  # * Limit the set of zones provided by TZInfo to a meaningful subset of 134
  #   zones.
  # * Retrieve and display zones with a friendlier name
  #   (e.g., "Eastern Time (US & Canada)" instead of "America/New_York").
  # * Lazily load <tt>TZInfo::Timezone</tt> instances only when they're needed.
  # * Create ActiveSupport::TimeWithZone instances via TimeZone's +local+,
  #   +parse+, +at+, and +now+ methods.
  #
  # If you set <tt>config.time_zone</tt> in the Rails Application, you can
  # access this TimeZone object via <tt>Time.zone</tt>:
  #
  #   # application.rb:
  #   class Application < Rails::Application
  #     config.time_zone = 'Eastern Time (US & Canada)'
  #   end
  #
  #   Time.zone      # => #<ActiveSupport::TimeZone:0x514834...>
  #   Time.zone.name # => "Eastern Time (US & Canada)"
  #   Time.zone.now  # => Sun, 18 May 2008 14:30:44 EDT -04:00
  class TimeZone
    # Keys are Rails TimeZone names, values are TZInfo identifiers.
    MAPPING = {
      "International Date Line West" => "Etc/GMT+12",
      "Midway Island"                => "Pacific/Midway",
      "American Samoa"               => "Pacific/Pago_Pago",
      "Hawaii"                       => "Pacific/Honolulu",
      "Alaska"                       => "America/Juneau",
      "Pacific Time (US & Canada)"   => "America/Los_Angeles",
      "Tijuana"                      => "America/Tijuana",
      "Mountain Time (US & Canada)"  => "America/Denver",
      "Arizona"                      => "America/Phoenix",
      "Chihuahua"                    => "America/Chihuahua",
      "Mazatlan"                     => "America/Mazatlan",
      "Central Time (US & Canada)"   => "America/Chicago",
      "Saskatchewan"                 => "America/Regina",
      "Guadalajara"                  => "America/Mexico_City",
      "Mexico City"                  => "America/Mexico_City",
      "Monterrey"                    => "America/Monterrey",
      "Central America"              => "America/Guatemala",
      "Eastern Time (US & Canada)"   => "America/New_York",
      "Indiana (East)"               => "America/Indiana/Indianapolis",
      "Bogota"                       => "America/Bogota",
      "Lima"                         => "America/Lima",
      "Quito"                        => "America/Lima",
      "Atlantic Time (Canada)"       => "America/Halifax",
      "Caracas"                      => "America/Caracas",
      "La Paz"                       => "America/La_Paz",
      "Santiago"                     => "America/Santiago",
      "Newfoundland"                 => "America/St_Johns",
      "Brasilia"                     => "America/Sao_Paulo",
      "Buenos Aires"                 => "America/Argentina/Buenos_Aires",
      "Montevideo"                   => "America/Montevideo",
      "Georgetown"                   => "America/Guyana",
      "Puerto Rico"                  => "America/Puerto_Rico",
      "Greenland"                    => "America/Godthab",
      "Mid-Atlantic"                 => "Atlantic/South_Georgia",
      "Azores"                       => "Atlantic/Azores",
      "Cape Verde Is."               => "Atlantic/Cape_Verde",
      "Dublin"                       => "Europe/Dublin",
      "Edinburgh"                    => "Europe/London",
      "Lisbon"                       => "Europe/Lisbon",
      "London"                       => "Europe/London",
      "Casablanca"                   => "Africa/Casablanca",
      "Monrovia"                     => "Africa/Monrovia",
      "UTC"                          => "Etc/UTC",
      "Belgrade"                     => "Europe/Belgrade",
      "Bratislava"                   => "Europe/Bratislava",
      "Budapest"                     => "Europe/Budapest",
      "Ljubljana"                    => "Europe/Ljubljana",
      "Prague"                       => "Europe/Prague",
      "Sarajevo"                     => "Europe/Sarajevo",
      "Skopje"                       => "Europe/Skopje",
      "Warsaw"                       => "Europe/Warsaw",
      "Zagreb"                       => "Europe/Zagreb",
      "Brussels"                     => "Europe/Brussels",
      "Copenhagen"                   => "Europe/Copenhagen",
      "Madrid"                       => "Europe/Madrid",
      "Paris"                        => "Europe/Paris",
      "Amsterdam"                    => "Europe/Amsterdam",
      "Berlin"                       => "Europe/Berlin",
      "Bern"                         => "Europe/Zurich",
      "Zurich"                       => "Europe/Zurich",
      "Rome"                         => "Europe/Rome",
      "Stockholm"                    => "Europe/Stockholm",
      "Vienna"                       => "Europe/Vienna",
      "West Central Africa"          => "Africa/Algiers",
      "Bucharest"                    => "Europe/Bucharest",
      "Cairo"                        => "Africa/Cairo",
      "Helsinki"                     => "Europe/Helsinki",
      "Kyiv"                         => "Europe/Kiev",
      "Riga"                         => "Europe/Riga",
      "Sofia"                        => "Europe/Sofia",
      "Tallinn"                      => "Europe/Tallinn",
      "Vilnius"                      => "Europe/Vilnius",
      "Athens"                       => "Europe/Athens",
      "Istanbul"                     => "Europe/Istanbul",
      "Minsk"                        => "Europe/Minsk",
      "Jerusalem"                    => "Asia/Jerusalem",
      "Harare"                       => "Africa/Harare",
      "Pretoria"                     => "Africa/Johannesburg",
      "Kaliningrad"                  => "Europe/Kaliningrad",
      "Moscow"                       => "Europe/Moscow",
      "St. Petersburg"               => "Europe/Moscow",
      "Volgograd"                    => "Europe/Volgograd",
      "Samara"                       => "Europe/Samara",
      "Kuwait"                       => "Asia/Kuwait",
      "Riyadh"                       => "Asia/Riyadh",
      "Nairobi"                      => "Africa/Nairobi",
      "Baghdad"                      => "Asia/Baghdad",
      "Tehran"                       => "Asia/Tehran",
      "Abu Dhabi"                    => "Asia/Muscat",
      "Muscat"                       => "Asia/Muscat",
      "Baku"                         => "Asia/Baku",
      "Tbilisi"                      => "Asia/Tbilisi",
      "Yerevan"                      => "Asia/Yerevan",
      "Kabul"                        => "Asia/Kabul",
      "Ekaterinburg"                 => "Asia/Yekaterinburg",
      "Islamabad"                    => "Asia/Karachi",
      "Karachi"                      => "Asia/Karachi",
      "Tashkent"                     => "Asia/Tashkent",
      "Chennai"                      => "Asia/Kolkata",
      "Kolkata"                      => "Asia/Kolkata",
      "Mumbai"                       => "Asia/Kolkata",
      "New Delhi"                    => "Asia/Kolkata",
      "Kathmandu"                    => "Asia/Kathmandu",
      "Astana"                       => "Asia/Dhaka",
      "Dhaka"                        => "Asia/Dhaka",
      "Sri Jayawardenepura"          => "Asia/Colombo",
      "Almaty"                       => "Asia/Almaty",
      "Novosibirsk"                  => "Asia/Novosibirsk",
      "Rangoon"                      => "Asia/Rangoon",
      "Bangkok"                      => "Asia/Bangkok",
      "Hanoi"                        => "Asia/Bangkok",
      "Jakarta"                      => "Asia/Jakarta",
      "Krasnoyarsk"                  => "Asia/Krasnoyarsk",
      "Beijing"                      => "Asia/Shanghai",
      "Chongqing"                    => "Asia/Chongqing",
      "Hong Kong"                    => "Asia/Hong_Kong",
      "Urumqi"                       => "Asia/Urumqi",
      "Kuala Lumpur"                 => "Asia/Kuala_Lumpur",
      "Singapore"                    => "Asia/Singapore",
      "Taipei"                       => "Asia/Taipei",
      "Perth"                        => "Australia/Perth",
      "Irkutsk"                      => "Asia/Irkutsk",
      "Ulaanbaatar"                  => "Asia/Ulaanbaatar",
      "Seoul"                        => "Asia/Seoul",
      "Osaka"                        => "Asia/Tokyo",
      "Sapporo"                      => "Asia/Tokyo",
      "Tokyo"                        => "Asia/Tokyo",
      "Yakutsk"                      => "Asia/Yakutsk",
      "Darwin"                       => "Australia/Darwin",
      "Adelaide"                     => "Australia/Adelaide",
      "Canberra"                     => "Australia/Melbourne",
      "Melbourne"                    => "Australia/Melbourne",
      "Sydney"                       => "Australia/Sydney",
      "Brisbane"                     => "Australia/Brisbane",
      "Hobart"                       => "Australia/Hobart",
      "Vladivostok"                  => "Asia/Vladivostok",
      "Guam"                         => "Pacific/Guam",
      "Port Moresby"                 => "Pacific/Port_Moresby",
      "Magadan"                      => "Asia/Magadan",
      "Srednekolymsk"                => "Asia/Srednekolymsk",
      "Solomon Is."                  => "Pacific/Guadalcanal",
      "New Caledonia"                => "Pacific/Noumea",
      "Fiji"                         => "Pacific/Fiji",
      "Kamchatka"                    => "Asia/Kamchatka",
      "Marshall Is."                 => "Pacific/Majuro",
      "Auckland"                     => "Pacific/Auckland",
      "Wellington"                   => "Pacific/Auckland",
      "Nuku'alofa"                   => "Pacific/Tongatapu",
      "Tokelau Is."                  => "Pacific/Fakaofo",
      "Chatham Is."                  => "Pacific/Chatham",
      "Samoa"                        => "Pacific/Apia"
    }

    UTC_OFFSET_WITH_COLON = "%s%02d:%02d" # :nodoc:
    UTC_OFFSET_WITHOUT_COLON = UTC_OFFSET_WITH_COLON.tr(":", "") # :nodoc:
    private_constant :UTC_OFFSET_WITH_COLON, :UTC_OFFSET_WITHOUT_COLON

    @lazy_zones_map = Concurrent::Map.new
    @country_zones  = Concurrent::Map.new

    class << self
      # Assumes self represents an offset from UTC in seconds (as returned from
      # Time#utc_offset) and turns this into an +HH:MM formatted string.
      #
      #   ActiveSupport::TimeZone.seconds_to_utc_offset(-21_600) # => "-06:00"
      def seconds_to_utc_offset(seconds, colon = true)
        format = colon ? UTC_OFFSET_WITH_COLON : UTC_OFFSET_WITHOUT_COLON
        sign = (seconds < 0 ? "-" : "+")
        hours = seconds.abs / 3600
        minutes = (seconds.abs % 3600) / 60
        format % [sign, hours, minutes]
      end

      def find_tzinfo(name)
        TZInfo::Timezone.get(MAPPING[name] || name)
      end

      alias_method :create, :new

      # Returns a TimeZone instance with the given name, or +nil+ if no
      # such TimeZone instance exists. (This exists to support the use of
      # this class with the +composed_of+ macro.)
      def new(name)
        self[name]
      end

      # Returns an array of all TimeZone objects. There are multiple
      # TimeZone objects per time zone, in many cases, to make it easier
      # for users to find their own time zone.
      def all
        @zones ||= zones_map.values.sort
      end

      # Locate a specific time zone object. If the argument is a string, it
      # is interpreted to mean the name of the timezone to locate. If it is a
      # numeric value it is either the hour offset, or the second offset, of the
      # timezone to find. (The first one with that offset will be returned.)
      # Returns +nil+ if no such time zone is known to the system.
      def [](arg)
        case arg
        when self
          arg
        when String
          begin
            @lazy_zones_map[arg] ||= create(arg)
          rescue TZInfo::InvalidTimezoneIdentifier
            nil
          end
        when TZInfo::Timezone
          @lazy_zones_map[arg.name] ||= create(arg.name, nil, arg)
        when Numeric, ActiveSupport::Duration
          arg *= 3600 if arg.abs <= 13
          all.find { |z| z.utc_offset == arg.to_i }
        else
          raise ArgumentError, "invalid argument to TimeZone[]: #{arg.inspect}"
        end
      end

      # A convenience method for returning a collection of TimeZone objects
      # for time zones in the USA.
      def us_zones
        country_zones(:us)
      end

      # A convenience method for returning a collection of TimeZone objects
      # for time zones in the country specified by its ISO 3166-1 Alpha2 code.
      def country_zones(country_code)
        code = country_code.to_s.upcase
        @country_zones[code] ||= load_country_zones(code)
      end

      def clear # :nodoc:
        @lazy_zones_map = Concurrent::Map.new
        @country_zones  = Concurrent::Map.new
        @zones = nil
        @zones_map = nil
      end

      private
        def load_country_zones(code)
          country = TZInfo::Country.get(code)
          country.zone_identifiers.flat_map do |tz_id|
            if MAPPING.value?(tz_id)
              MAPPING.inject([]) do |memo, (key, value)|
                memo << self[key] if value == tz_id
                memo
              end
            else
              create(tz_id, nil, TZInfo::Timezone.get(tz_id))
            end
          end.sort!
        end

        def zones_map
          @zones_map ||= MAPPING.each_with_object({}) do |(name, _), zones|
            timezone = self[name]
            zones[name] = timezone if timezone
          end
        end
    end

    include Comparable
    attr_reader :name
    attr_reader :tzinfo

    # Create a new TimeZone object with the given name and offset. The
    # offset is the number of seconds that this time zone is offset from UTC
    # (GMT). Seconds were chosen as the offset unit because that is the unit
    # that Ruby uses to represent time zone offsets (see Time#utc_offset).
    def initialize(name, utc_offset = nil, tzinfo = nil)
      @name = name
      @utc_offset = utc_offset
      @tzinfo = tzinfo || TimeZone.find_tzinfo(name)
    end

    # Returns the offset of this time zone from UTC in seconds.
    def utc_offset
      @utc_offset || tzinfo&.current_period&.base_utc_offset
    end

    # Returns a formatted string of the offset from UTC, or an alternative
    # string if the time zone is already UTC.
    #
    #   zone = ActiveSupport::TimeZone['Central Time (US & Canada)']
    #   zone.formatted_offset        # => "-06:00"
    #   zone.formatted_offset(false) # => "-0600"
    def formatted_offset(colon = true, alternate_utc_string = nil)
      utc_offset == 0 && alternate_utc_string || self.class.seconds_to_utc_offset(utc_offset, colon)
    end

    # Compare this time zone to the parameter. The two are compared first on
    # their offsets, and then by name.
    def <=>(zone)
      return unless zone.respond_to? :utc_offset
      result = (utc_offset <=> zone.utc_offset)
      result = (name <=> zone.name) if result == 0
      result
    end

    # Compare #name and TZInfo identifier to a supplied regexp, returning +true+
    # if a match is found.
    def =~(re)
      re === name || re === MAPPING[name]
    end

    # Compare #name and TZInfo identifier to a supplied regexp, returning +true+
    # if a match is found.
    def match?(re)
      (re == name) || (re == MAPPING[name]) ||
        ((Regexp === re) && (re.match?(name) || re.match?(MAPPING[name])))
    end

    # Returns a textual representation of this time zone.
    def to_s
      "(GMT#{formatted_offset}) #{name}"
    end

    # Method for creating new ActiveSupport::TimeWithZone instance in time zone
    # of +self+ from given values.
    #
    #   Time.zone = 'Hawaii'                    # => "Hawaii"
    #   Time.zone.local(2007, 2, 1, 15, 30, 45) # => Thu, 01 Feb 2007 15:30:45 HST -10:00
    def local(*args)
      time = Time.utc(*args)
      ActiveSupport::TimeWithZone.new(nil, self, time)
    end

    # Method for creating new ActiveSupport::TimeWithZone instance in time zone
    # of +self+ from number of seconds since the Unix epoch.
    #
    #   Time.zone = 'Hawaii'        # => "Hawaii"
    #   Time.utc(2000).to_f         # => 946684800.0
    #   Time.zone.at(946684800.0)   # => Fri, 31 Dec 1999 14:00:00 HST -10:00
    #
    # A second argument can be supplied to specify sub-second precision.
    #
    #   Time.zone = 'Hawaii'                # => "Hawaii"
    #   Time.at(946684800, 123456.789).nsec # => 123456789
    def at(*args)
      Time.at(*args).utc.in_time_zone(self)
    end

    # Method for creating new ActiveSupport::TimeWithZone instance in time zone
    # of +self+ from an ISO 8601 string.
    #
    #   Time.zone = 'Hawaii'                     # => "Hawaii"
    #   Time.zone.iso8601('1999-12-31T14:00:00') # => Fri, 31 Dec 1999 14:00:00 HST -10:00
    #
    # If the time components are missing then they will be set to zero.
    #
    #   Time.zone = 'Hawaii'            # => "Hawaii"
    #   Time.zone.iso8601('1999-12-31') # => Fri, 31 Dec 1999 00:00:00 HST -10:00
    #
    # If the string is invalid then an +ArgumentError+ will be raised unlike +parse+
    # which usually returns +nil+ when given an invalid date string.
    def iso8601(str)
      # Historically `Date._iso8601(nil)` returns `{}`, but in the `date` gem versions `3.2.1`, `3.1.2`, `3.0.2`,
      # and `2.0.1`, `Date._iso8601(nil)` raises `TypeError` https://github.com/ruby/date/issues/39
      # Future `date` releases are expected to revert back to the original behavior.
      raise ArgumentError, "invalid date" if str.nil?

      parts = Date._iso8601(str)

      year = parts.fetch(:year)

      if parts.key?(:yday)
        ordinal_date = Date.ordinal(year, parts.fetch(:yday))
        month = ordinal_date.month
        day = ordinal_date.day
      else
        month = parts.fetch(:mon)
        day = parts.fetch(:mday)
      end

      time = Time.new(
        year,
        month,
        day,
        parts.fetch(:hour, 0),
        parts.fetch(:min, 0),
        parts.fetch(:sec, 0) + parts.fetch(:sec_fraction, 0),
        parts.fetch(:offset, 0)
      )

      if parts[:offset]
        TimeWithZone.new(time.utc, self)
      else
        TimeWithZone.new(nil, self, time)
      end

    rescue Date::Error, KeyError
      raise ArgumentError, "invalid date"
    end

    # Method for creating new ActiveSupport::TimeWithZone instance in time zone
    # of +self+ from parsed string.
    #
    #   Time.zone = 'Hawaii'                   # => "Hawaii"
    #   Time.zone.parse('1999-12-31 14:00:00') # => Fri, 31 Dec 1999 14:00:00 HST -10:00
    #
    # If upper components are missing from the string, they are supplied from
    # TimeZone#now:
    #
    #   Time.zone.now               # => Fri, 31 Dec 1999 14:00:00 HST -10:00
    #   Time.zone.parse('22:30:00') # => Fri, 31 Dec 1999 22:30:00 HST -10:00
    #
    # However, if the date component is not provided, but any other upper
    # components are supplied, then the day of the month defaults to 1:
    #
    #   Time.zone.parse('Mar 2000') # => Wed, 01 Mar 2000 00:00:00 HST -10:00
    #
    # If the string is invalid then an +ArgumentError+ could be raised.
    def parse(str, now = now())
      parts_to_time(Date._parse(str, false), now)
    end

    # Method for creating new ActiveSupport::TimeWithZone instance in time zone
    # of +self+ from an RFC 3339 string.
    #
    #   Time.zone = 'Hawaii'                     # => "Hawaii"
    #   Time.zone.rfc3339('2000-01-01T00:00:00Z') # => Fri, 31 Dec 1999 14:00:00 HST -10:00
    #
    # If the time or zone components are missing then an +ArgumentError+ will
    # be raised. This is much stricter than either +parse+ or +iso8601+ which
    # allow for missing components.
    #
    #   Time.zone = 'Hawaii'            # => "Hawaii"
    #   Time.zone.rfc3339('1999-12-31') # => ArgumentError: invalid date
    def rfc3339(str)
      parts = Date._rfc3339(str)

      raise ArgumentError, "invalid date" if parts.empty?

      time = Time.new(
        parts.fetch(:year),
        parts.fetch(:mon),
        parts.fetch(:mday),
        parts.fetch(:hour),
        parts.fetch(:min),
        parts.fetch(:sec) + parts.fetch(:sec_fraction, 0),
        parts.fetch(:offset)
      )

      TimeWithZone.new(time.utc, self)
    end

    # Parses +str+ according to +format+ and returns an ActiveSupport::TimeWithZone.
    #
    # Assumes that +str+ is a time in the time zone +self+,
    # unless +format+ includes an explicit time zone.
    # (This is the same behavior as +parse+.)
    # In either case, the returned TimeWithZone has the timezone of +self+.
    #
    #   Time.zone = 'Hawaii'                   # => "Hawaii"
    #   Time.zone.strptime('1999-12-31 14:00:00', '%Y-%m-%d %H:%M:%S') # => Fri, 31 Dec 1999 14:00:00 HST -10:00
    #
    # If upper components are missing from the string, they are supplied from
    # TimeZone#now:
    #
    #   Time.zone.now                              # => Fri, 31 Dec 1999 14:00:00 HST -10:00
    #   Time.zone.strptime('22:30:00', '%H:%M:%S') # => Fri, 31 Dec 1999 22:30:00 HST -10:00
    #
    # However, if the date component is not provided, but any other upper
    # components are supplied, then the day of the month defaults to 1:
    #
    #   Time.zone.strptime('Mar 2000', '%b %Y') # => Wed, 01 Mar 2000 00:00:00 HST -10:00
    def strptime(str, format, now = now())
      parts_to_time(DateTime._strptime(str, format), now)
    end

    # Returns an ActiveSupport::TimeWithZone instance representing the current
    # time in the time zone represented by +self+.
    #
    #   Time.zone = 'Hawaii'  # => "Hawaii"
    #   Time.zone.now         # => Wed, 23 Jan 2008 20:24:27 HST -10:00
    def now
      time_now.utc.in_time_zone(self)
    end

    # Returns the current date in this time zone.
    def today
      tzinfo.now.to_date
    end

    # Returns the next date in this time zone.
    def tomorrow
      today + 1
    end

    # Returns the previous date in this time zone.
    def yesterday
      today - 1
    end

    # Adjust the given time to the simultaneous time in the time zone
    # represented by +self+. Returns a local time with the appropriate offset
    # -- if you want an ActiveSupport::TimeWithZone instance, use
    # Time#in_time_zone() instead.
    #
    # As of tzinfo 2, utc_to_local returns a Time with a non-zero utc_offset.
    # See the +utc_to_local_returns_utc_offset_times+ config for more info.
    def utc_to_local(time)
      tzinfo.utc_to_local(time).yield_self do |t|
        ActiveSupport.utc_to_local_returns_utc_offset_times ?
          t : Time.utc(t.year, t.month, t.day, t.hour, t.min, t.sec, t.sec_fraction * 1_000_000)
      end
    end

    # Adjust the given time to the simultaneous time in UTC. Returns a
    # Time.utc() instance.
    def local_to_utc(time, dst = true)
      tzinfo.local_to_utc(time, dst)
    end

    # Available so that TimeZone instances respond like <tt>TZInfo::Timezone</tt>
    # instances.
    def period_for_utc(time)
      tzinfo.period_for_utc(time)
    end

    # Available so that TimeZone instances respond like <tt>TZInfo::Timezone</tt>
    # instances.
    def period_for_local(time, dst = true)
      tzinfo.period_for_local(time, dst) { |periods| periods.last }
    end

    def periods_for_local(time) # :nodoc:
      tzinfo.periods_for_local(time)
    end

    def init_with(coder) # :nodoc:
      initialize(coder["name"])
    end

    def encode_with(coder) # :nodoc:
      coder.tag = "!ruby/object:#{self.class}"
      coder.map = { "name" => tzinfo.name }
    end

    private
      def parts_to_time(parts, now)
        raise ArgumentError, "invalid date" if parts.nil?
        return if parts.empty?

        if parts[:seconds]
          time = Time.at(parts[:seconds])
        else
          time = Time.new(
            parts.fetch(:year, now.year),
            parts.fetch(:mon, now.month),
            parts.fetch(:mday, parts[:year] || parts[:mon] ? 1 : now.day),
            parts.fetch(:hour, 0),
            parts.fetch(:min, 0),
            parts.fetch(:sec, 0) + parts.fetch(:sec_fraction, 0),
            parts.fetch(:offset, 0)
          )
        end

        if parts[:offset] || parts[:seconds]
          TimeWithZone.new(time.utc, self)
        else
          TimeWithZone.new(nil, self, time)
        end
      end

      def time_now
        Time.now
      end
  end
end
