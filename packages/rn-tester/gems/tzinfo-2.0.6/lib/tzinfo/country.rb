# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  # {InvalidCountryCode} is raised by {Country#get} if the code given is not a
  # valid ISO 3166-1 alpha-2 code.
  class InvalidCountryCode < StandardError
  end

  # The {Country} class represents an ISO 3166-1 country. It can be used to
  # obtain a list of time zones observed by a country. For example:
  #
  #     united_states = Country.get('US')
  #     united_states.zone_identifiers
  #     united_states.zones
  #     united_states.zone_info
  #
  # The {Country} class is thread-safe. It is safe to use class and instance
  # methods of {Country} in concurrently executing threads. Instances of
  # {Country} can be shared across thread boundaries.
  #
  # Country information available through TZInfo is intended as an aid for
  # users, to help them select time zone data appropriate for their practical
  # needs. It is not intended to take or endorse any position on legal or
  # territorial claims.
  class Country
    include Comparable

    class << self
      # Gets a {Country} by its ISO 3166-1 alpha-2 code.
      #
      # The {Country.all_codes} method can be used to obtain a list of valid ISO
      # 3166-1 alpha-2 codes.
      #
      # @param code [String] An ISO 3166-1 alpha-2 code.
      # @return [Country] a {Country} instance representing the ISO-3166-1
      #   country identified by the `code` parameter.
      # @raise [InvalidCountryCode] If {code} is not a valid ISO 3166-1 alpha-2
      #   code it couldn't be found.
      def get(code)
        Country.new(data_source.get_country_info(code))
      end

      # @return [Array<String>] an `Array` containing all the valid ISO 3166-1
      #   alpha-2 country codes.
      def all_codes
        data_source.country_codes
      end

      # @return [Array<Country>] an `Array` containing one {Country} instance
      #   for each defined country.
      def all
        data_source.country_codes.collect {|code| get(code)}
      end

      private

      # @return [DataSource] the current DataSource.
      def data_source
        DataSource.get
      end
    end

    # Initializes a new {Country} based upon a {DataSources::CountryInfo}
    # instance.
    #
    # {Country} instances should not normally be constructed directly. Use
    # the {Country.get} method to obtain instances instead.
    #
    # @param info [DataSources::CountryInfo] the data to base the new {Country}
    #   instance upon.
    def initialize(info)
      @info = info
    end

    # @return [String] the ISO 3166-1 alpha-2 country code.
    def code
      @info.code
    end

    # @return [String] the name of the country.
    def name
      @info.name
    end

    # @return [String] a `String` representation of this {Country} (the name of
    #   the country).
    def to_s
      name
    end

    # @return [String] the internal object state as a programmer-readable
    #   `String`.
    def inspect
      "#<#{self.class}: #{@info.code}>"
    end

    # Returns an `Array` containing the identifier for each time zone observed
    # by the country. These are in an order that
    #
    # 1. makes some geographical sense, and
    # 2. puts the most populous zones first, where that does not contradict 1.
    #
    # Returned zone identifiers may refer to cities and regions outside of the
    # country. This will occur if the zone covers multiple countries. Any zones
    # referring to a city or region in a different country will be listed after
    # those relating to this country.
    #
    # @return [Array<String>] an `Array` containing the identifier for each time
    #   zone observed by the country
    def zone_identifiers
      zone_info.map(&:identifier)
    end
    alias zone_names zone_identifiers

    # Returns An `Array` containing a {Timezone} instance for each time zone
    # observed by the country. These are in an order that
    #
    # 1. makes some geographical sense, and
    # 2. puts the most populous zones first, where that does not contradict 1.
    #
    # The identifiers of the time zones returned may refer to cities and regions
    # outside of the country. This will occur if the time zone covers multiple
    # countries. Any zones referring to a city or region in a different country
    # will be listed after those relating to this country.
    #
    # The results are actually instances of {TimezoneProxy} in order to defer
    # loading of the time zone transition data until it is first needed.
    #
    # @return [Array<Timezone>] an `Array` containing a {Timezone} instance for
    #   each time zone observed by the country.
    def zones
      zone_info.map(&:timezone)
    end

    # Returns a frozen `Array` containing a {CountryTimezone} instance for each
    # time zone observed by the country. These are in an order that
    #
    # 1. makes some geographical sense, and
    # 2. puts the most populous zones first, where that does not contradict 1.
    #
    # The {CountryTimezone} instances can be used to obtain the location and
    # descriptions of the observed time zones.
    #
    # Identifiers and descriptions of the time zones returned may refer to
    # cities and regions outside of the country. This will occur if the time
    # zone covers multiple countries. Any zones referring to a city or region in
    # a different country will be listed after those relating to this country.
    #
    # @return [Array<CountryTimezone>] a frozen `Array` containing a
    #   {CountryTimezone} instance for each time zone observed by the country.
    def zone_info
      @info.zones
    end

    # Compares this {Country} with another based on their {code}.
    #
    # @param c [Object] an `Object` to compare this {Country} with.
    # @return [Integer] -1 if `c` is less than `self`, 0 if `c` is equal to
    #   `self` and +1 if `c` is greater than `self`, or `nil` if `c` is not an
    #   instance of {Country}.
    def <=>(c)
      return nil unless c.is_a?(Country)
      code <=> c.code
    end

    # @param c [Object] an `Object` to compare this {Country} with.
    # @return [Boolean] `true` if `c` is an instance of {Country} and has the
    #   same code as `self`, otherwise `false`.
    def eql?(c)
      self == c
    end

    # @return [Integer] a hash based on the {code}.
    def hash
      code.hash
    end

    # Matches `regexp` against the {code} of this {Country}.
    #
    # @param regexp [Regexp] a `Regexp` to match against the {code} of
    #   this {Country}.
    # @return [Integer] the position the match starts, or `nil` if there is no
    #   match.
    def =~(regexp)
      regexp =~ code
    end

    # Returns a serialized representation of this {Country}. This method is
    # called when using `Marshal.dump` with an instance of {Country}.
    #
    # @param limit [Integer] the maximum depth to dump - ignored.
    # @return [String] a serialized representation of this {Country}.
    def _dump(limit)
      code
    end

    # Loads a {Country} from the serialized representation returned by {_dump}.
    # This is method is called when using `Marshal.load` or `Marshal.restore`
    # to restore a serialized {Country}.
    #
    # @param data [String] a serialized representation of a {Country}.
    # @return [Country] the result of converting `data` back into a {Country}.
    def self._load(data)
      Country.get(data)
    end
  end
end
