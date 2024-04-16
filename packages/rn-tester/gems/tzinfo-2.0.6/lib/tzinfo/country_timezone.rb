# encoding: UTF-8

module TZInfo
  # Information about a time zone used by a {Country}.
  class CountryTimezone
    # @return [String] the identifier of the {Timezone} being described.
    attr_reader :identifier

    # The latitude of this time zone in degrees. Positive numbers are degrees
    # north and negative numbers are degrees south.
    #
    # Note that depending on the data source, the position given by {#latitude}
    # and {#longitude} may not be within the country.
    #
    # @return [Rational] the latitude in degrees.
    attr_reader :latitude

    # The longitude of this time zone in degrees. Positive numbers are degrees
    # east and negative numbers are degrees west.
    #
    # Note that depending on the data source, the position given by {#latitude}
    # and {#longitude} may not be within the country.
    #
    # @return [Rational] the longitude in degrees.
    attr_reader :longitude

    # A description of this time zone in relation to the country, e.g. "Eastern
    # Time". This is usually `nil` for countries that have a single time zone.
    #
    # @return [String] an optional description of the time zone.
    attr_reader :description

    # Creates a new {CountryTimezone}.
    #
    # The passed in identifier and description instances will be frozen.
    #
    # {CountryTimezone} instances should normally only be constructed
    # by implementations of {DataSource}.
    #
    # @param identifier [String] the {Timezone} identifier.
    # @param latitude [Rational] the latitude of the time zone.
    # @param longitude [Rational] the longitude of the time zone.
    # @param description [String] an optional description of the time zone.
    def initialize(identifier, latitude, longitude, description = nil)
      @identifier = identifier.freeze
      @latitude = latitude
      @longitude = longitude
      @description = description && description.freeze
    end

    # Returns the associated {Timezone}.
    #
    # The result is actually an instance of {TimezoneProxy} in order to defer
    # loading of the time zone transition data until it is first needed.
    #
    # @return [Timezone] the associated {Timezone}.
    def timezone
      Timezone.get_proxy(@identifier)
    end

    # @return [String] the {description} if present, otherwise a human-readable
    #   representation of the identifier (using {Timezone#friendly_identifier}).
    def description_or_friendly_identifier
      description || timezone.friendly_identifier(true)
    end

    # Tests if the given object is equal to the current instance (has the same
    # identifier, latitude, longitude and description).
    #
    # @param ct [Object] the object to be compared.
    # @return [TrueClass] `true` if `ct` is equal to the current instance.
    def ==(ct)
      ct.kind_of?(CountryTimezone) &&
        identifier == ct.identifier  && latitude == ct.latitude &&
        longitude == ct.longitude   && description == ct.description
    end

    # Tests if the given object is equal to the current instance (has the same
    # identifier, latitude, longitude and description).
    #
    # @param ct [Object] the object to be compared.
    # @return [Boolean] `true` if `ct` is equal to the current instance.
    def eql?(ct)
      self == ct
    end

    # @return [Integer] a hash based on the {identifier}, {latitude},
    # {longitude} and {description}.
    def hash
      [@identifier, @latitude, @longitude, @description].hash
    end
  end
end
