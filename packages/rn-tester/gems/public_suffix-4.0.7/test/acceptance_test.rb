# frozen_string_literal: true

require "test_helper"

class AcceptanceTest < Minitest::Test

  VALID_CASES = [
    ["example.com",             "example.com", [nil, "example", "com"]],
    ["foo.example.com",         "example.com",        ["foo", "example", "com"]],

    ["verybritish.co.uk",       "verybritish.co.uk",  [nil, "verybritish", "co.uk"]],
    ["foo.verybritish.co.uk",   "verybritish.co.uk",  ["foo", "verybritish", "co.uk"]],

    ["parliament.uk",           "parliament.uk",      [nil, "parliament", "uk"]],
    ["foo.parliament.uk",       "parliament.uk",      ["foo", "parliament", "uk"]],
  ].freeze

  def test_valid
    VALID_CASES.each do |input, domain, results|
      parsed = PublicSuffix.parse(input)
      trd, sld, tld = results
      assert_equal tld, parsed.tld, "Invalid tld for `#{name}`"
      assert_equal sld, parsed.sld, "Invalid sld for `#{name}`"
      if trd.nil?
        assert_nil parsed.trd, "Invalid trd for `#{name}`"
      else
        assert_equal trd, parsed.trd, "Invalid trd for `#{name}`"
      end

      assert_equal domain, PublicSuffix.domain(input)
      assert PublicSuffix.valid?(input)
    end
  end


  INVALID_CASES = [
    ["nic.bd", PublicSuffix::DomainNotAllowed],
    [nil,                       PublicSuffix::DomainInvalid],
    ["",                        PublicSuffix::DomainInvalid],
    ["  ",                      PublicSuffix::DomainInvalid],
  ].freeze

  def test_invalid
    INVALID_CASES.each do |(name, error)|
      assert_raises(error) { PublicSuffix.parse(name) }
      assert !PublicSuffix.valid?(name)
    end
  end


  REJECTED_CASES = [
    ["www. .com", true],
    ["foo.co..uk",          true],
    ["goo,gle.com",         true],
    ["-google.com",         true],
    ["google-.com",         true],

    # This case was covered in GH-15.
    # I decided to cover this case because it's not easily reproducible with URI.parse
    # and can lead to several false positives.
    ["http://google.com",   false],
  ].freeze

  def test_rejected
    REJECTED_CASES.each do |name, expected|
      assert_equal expected, PublicSuffix.valid?(name),
                   "Expected %s to be %s" % [name.inspect, expected.inspect]
      assert !valid_domain?(name),
             "#{name} expected to be invalid"
    end
  end


  CASE_CASES = [
    ["Www.google.com", %w( www google com )],
    ["www.Google.com", %w( www google com )],
    ["www.google.Com", %w( www google com )],
  ].freeze

  def test_ignore_case
    CASE_CASES.each do |name, results|
      domain = PublicSuffix.parse(name)
      trd, sld, tld = results
      assert_equal tld, domain.tld, "Invalid tld for `#{name}'"
      assert_equal sld, domain.sld, "Invalid sld for `#{name}'"
      assert_equal trd, domain.trd, "Invalid trd for `#{name}'"
      assert PublicSuffix.valid?(name)
    end
  end


  INCLUDE_PRIVATE_CASES = [
    ["blogspot.com", true, "blogspot.com"],
    ["blogspot.com", false, nil],
    ["subdomain.blogspot.com", true, "blogspot.com"],
    ["subdomain.blogspot.com", false, "subdomain.blogspot.com"],
  ].freeze

  # rubocop:disable Style/CombinableLoops
  def test_ignore_private
    # test domain and parse
    INCLUDE_PRIVATE_CASES.each do |given, ignore_private, expected|
      if expected.nil?
        assert_nil PublicSuffix.domain(given, ignore_private: ignore_private)
      else
        assert_equal expected, PublicSuffix.domain(given, ignore_private: ignore_private)
      end
    end
    # test valid?
    INCLUDE_PRIVATE_CASES.each do |given, ignore_private, expected|
      assert_equal !expected.nil?, PublicSuffix.valid?(given, ignore_private: ignore_private)
    end
  end
  # rubocop:enable Style/CombinableLoops


  def valid_uri?(name)
    uri = URI.parse(name)
    !uri.host.nil?
  rescue StandardError
    false
  end

  def valid_domain?(name)
    uri = URI.parse(name)
    !uri.host.nil? && uri.scheme.nil?
  rescue StandardError
    false
  end

end
