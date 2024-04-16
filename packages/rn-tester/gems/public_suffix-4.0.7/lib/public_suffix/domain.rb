# frozen_string_literal: true

# = Public Suffix
#
# Domain name parser based on the Public Suffix List.
#
# Copyright (c) 2009-2022 Simone Carletti <weppos@weppos.net>

module PublicSuffix

  # Domain represents a domain name, composed by a TLD, SLD and TRD.
  class Domain

    # Splits a string into the labels, that is the dot-separated parts.
    #
    # The input is not validated, but it is assumed to be a valid domain name.
    #
    # @example
    #
    #   name_to_labels('example.com')
    #   # => ['example', 'com']
    #
    #   name_to_labels('example.co.uk')
    #   # => ['example', 'co', 'uk']
    #
    # @param  name [String, #to_s] The domain name to split.
    # @return [Array<String>]
    def self.name_to_labels(name)
      name.to_s.split(DOT)
    end


    attr_reader :tld, :sld, :trd

    # Creates and returns a new {PublicSuffix::Domain} instance.
    #
    # @overload initialize(tld)
    #   Initializes with a +tld+.
    #   @param [String] tld The TLD (extension)
    # @overload initialize(tld, sld)
    #   Initializes with a +tld+ and +sld+.
    #   @param [String] tld The TLD (extension)
    #   @param [String] sld The TRD (domain)
    # @overload initialize(tld, sld, trd)
    #   Initializes with a +tld+, +sld+ and +trd+.
    #   @param [String] tld The TLD (extension)
    #   @param [String] sld The SLD (domain)
    #   @param [String] trd The TRD (subdomain)
    #
    # @yield [self] Yields on self.
    # @yieldparam [PublicSuffix::Domain] self The newly creates instance
    #
    # @example Initialize with a TLD
    #   PublicSuffix::Domain.new("com")
    #   # => #<PublicSuffix::Domain @tld="com">
    #
    # @example Initialize with a TLD and SLD
    #   PublicSuffix::Domain.new("com", "example")
    #   # => #<PublicSuffix::Domain @tld="com", @trd=nil>
    #
    # @example Initialize with a TLD, SLD and TRD
    #   PublicSuffix::Domain.new("com", "example", "wwww")
    #   # => #<PublicSuffix::Domain @tld="com", @trd=nil, @sld="example">
    #
    def initialize(*args)
      @tld, @sld, @trd = args
      yield(self) if block_given?
    end

    # Returns a string representation of this object.
    #
    # @return [String]
    def to_s
      name
    end

    # Returns an array containing the domain parts.
    #
    # @return [Array<String, nil>]
    #
    # @example
    #
    #   PublicSuffix::Domain.new("google.com").to_a
    #   # => [nil, "google", "com"]
    #
    #   PublicSuffix::Domain.new("www.google.com").to_a
    #   # => [nil, "google", "com"]
    #
    def to_a
      [@trd, @sld, @tld]
    end

    # Returns the full domain name.
    #
    # @return [String]
    #
    # @example Gets the domain name of a domain
    #   PublicSuffix::Domain.new("com", "google").name
    #   # => "google.com"
    #
    # @example Gets the domain name of a subdomain
    #   PublicSuffix::Domain.new("com", "google", "www").name
    #   # => "www.google.com"
    #
    def name
      [@trd, @sld, @tld].compact.join(DOT)
    end

    # Returns a domain-like representation of this object
    # if the object is a {#domain?}, <tt>nil</tt> otherwise.
    #
    #   PublicSuffix::Domain.new("com").domain
    #   # => nil
    #
    #   PublicSuffix::Domain.new("com", "google").domain
    #   # => "google.com"
    #
    #   PublicSuffix::Domain.new("com", "google", "www").domain
    #   # => "www.google.com"
    #
    # This method doesn't validate the input. It handles the domain
    # as a valid domain name and simply applies the necessary transformations.
    #
    # This method returns a FQD, not just the domain part.
    # To get the domain part, use <tt>#sld</tt> (aka second level domain).
    #
    #   PublicSuffix::Domain.new("com", "google", "www").domain
    #   # => "google.com"
    #
    #   PublicSuffix::Domain.new("com", "google", "www").sld
    #   # => "google"
    #
    # @see #domain?
    # @see #subdomain
    #
    # @return [String]
    def domain
      [@sld, @tld].join(DOT) if domain?
    end

    # Returns a subdomain-like representation of this object
    # if the object is a {#subdomain?}, <tt>nil</tt> otherwise.
    #
    #   PublicSuffix::Domain.new("com").subdomain
    #   # => nil
    #
    #   PublicSuffix::Domain.new("com", "google").subdomain
    #   # => nil
    #
    #   PublicSuffix::Domain.new("com", "google", "www").subdomain
    #   # => "www.google.com"
    #
    # This method doesn't validate the input. It handles the domain
    # as a valid domain name and simply applies the necessary transformations.
    #
    # This method returns a FQD, not just the subdomain part.
    # To get the subdomain part, use <tt>#trd</tt> (aka third level domain).
    #
    #   PublicSuffix::Domain.new("com", "google", "www").subdomain
    #   # => "www.google.com"
    #
    #   PublicSuffix::Domain.new("com", "google", "www").trd
    #   # => "www"
    #
    # @see #subdomain?
    # @see #domain
    #
    # @return [String]
    def subdomain
      [@trd, @sld, @tld].join(DOT) if subdomain?
    end

    # Checks whether <tt>self</tt> looks like a domain.
    #
    # This method doesn't actually validate the domain.
    # It only checks whether the instance contains
    # a value for the {#tld} and {#sld} attributes.
    #
    # @example
    #
    #   PublicSuffix::Domain.new("com").domain?
    #   # => false
    #
    #   PublicSuffix::Domain.new("com", "google").domain?
    #   # => true
    #
    #   PublicSuffix::Domain.new("com", "google", "www").domain?
    #   # => true
    #
    #   # This is an invalid domain, but returns true
    #   # because this method doesn't validate the content.
    #   PublicSuffix::Domain.new("com", nil).domain?
    #   # => true
    #
    # @see #subdomain?
    #
    # @return [Boolean]
    def domain?
      !(@tld.nil? || @sld.nil?)
    end

    # Checks whether <tt>self</tt> looks like a subdomain.
    #
    # This method doesn't actually validate the subdomain.
    # It only checks whether the instance contains
    # a value for the {#tld}, {#sld} and {#trd} attributes.
    # If you also want to validate the domain,
    # use {#valid_subdomain?} instead.
    #
    # @example
    #
    #   PublicSuffix::Domain.new("com").subdomain?
    #   # => false
    #
    #   PublicSuffix::Domain.new("com", "google").subdomain?
    #   # => false
    #
    #   PublicSuffix::Domain.new("com", "google", "www").subdomain?
    #   # => true
    #
    #   # This is an invalid domain, but returns true
    #   # because this method doesn't validate the content.
    #   PublicSuffix::Domain.new("com", "example", nil).subdomain?
    #   # => true
    #
    # @see #domain?
    #
    # @return [Boolean]
    def subdomain?
      !(@tld.nil? || @sld.nil? || @trd.nil?)
    end

  end

end
