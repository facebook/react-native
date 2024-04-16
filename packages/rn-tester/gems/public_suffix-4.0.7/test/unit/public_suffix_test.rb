# frozen_string_literal: true

require "test_helper"

class PublicSuffixTest < Minitest::Test

  def test_private_domains_enabled_by_default
    domain = PublicSuffix.parse("www.example.blogspot.com")
    assert_equal "blogspot.com", domain.tld
  end

  def test_private_domains_disable
    data = File.read(PublicSuffix::List::DEFAULT_LIST_PATH)
    PublicSuffix::List.default = PublicSuffix::List.parse(data, private_domains: false)
    domain = PublicSuffix.parse("www.example.blogspot.com")
    assert_equal "com", domain.tld
  ensure
    PublicSuffix::List.default = nil
  end


  def test_self_parse_a_domain_with_tld_and_sld
    domain = PublicSuffix.parse("example.com")
    assert_instance_of PublicSuffix::Domain, domain
    assert_equal "com",     domain.tld
    assert_equal "example", domain.sld
    assert_nil              domain.trd

    domain = PublicSuffix.parse("example.co.uk")
    assert_instance_of PublicSuffix::Domain, domain
    assert_equal "co.uk",   domain.tld
    assert_equal "example", domain.sld
    assert_nil              domain.trd
  end

  def test_self_parse_a_domain_with_tld_and_sld_and_trd
    domain = PublicSuffix.parse("alpha.example.com")
    assert_instance_of PublicSuffix::Domain, domain
    assert_equal "com",     domain.tld
    assert_equal "example", domain.sld
    assert_equal "alpha",   domain.trd

    domain = PublicSuffix.parse("alpha.example.co.uk")
    assert_instance_of PublicSuffix::Domain, domain
    assert_equal "co.uk",   domain.tld
    assert_equal "example", domain.sld
    assert_equal "alpha",   domain.trd
  end

  def test_self_parse_a_domain_with_tld_and_sld_and_4rd
    domain = PublicSuffix.parse("one.two.example.com")
    assert_instance_of PublicSuffix::Domain, domain
    assert_equal "com",     domain.tld
    assert_equal "example", domain.sld
    assert_equal "one.two", domain.trd

    domain = PublicSuffix.parse("one.two.example.co.uk")
    assert_instance_of PublicSuffix::Domain, domain
    assert_equal "co.uk",   domain.tld
    assert_equal "example", domain.sld
    assert_equal "one.two", domain.trd
  end

  def test_self_parse_name_fqdn
    domain = PublicSuffix.parse("www.example.com.")
    assert_instance_of PublicSuffix::Domain, domain
    assert_equal "com",     domain.tld
    assert_equal "example", domain.sld
    assert_equal "www",     domain.trd
  end

  def test_self_parse_with_custom_list
    list = PublicSuffix::List.new
    list << PublicSuffix::Rule.factory("test")

    domain = PublicSuffix.parse("www.example.test", list: list)
    assert_instance_of PublicSuffix::Domain, domain
    assert_equal "test",    domain.tld
    assert_equal "example", domain.sld
    assert_equal "www",     domain.trd
  end

  def test_self_parse_with_notlisted_name
    domain = PublicSuffix.parse("example.tldnotlisted")
    assert_instance_of PublicSuffix::Domain, domain
    assert_equal "tldnotlisted",    domain.tld
    assert_equal "example",         domain.sld
    assert_nil                      domain.trd
  end

  def test_self_parse_with_unallowed_domain
    error = assert_raises(PublicSuffix::DomainNotAllowed) { PublicSuffix.parse("example.bd") }
    assert_match(/example\.bd/, error.message)
  end

  def test_self_parse_with_uri
    error = assert_raises(PublicSuffix::DomainInvalid) { PublicSuffix.parse("http://google.com") }
    assert_match(%r{http://google\.com}, error.message)
  end


  def test_self_valid
    assert  PublicSuffix.valid?("google.com")
    assert  PublicSuffix.valid?("www.google.com")
    assert  PublicSuffix.valid?("google.co.uk")
    assert  PublicSuffix.valid?("www.google.co.uk")
  end

  def test_self_valid_with_notlisted_name
    assert  PublicSuffix.valid?("google.tldnotlisted")
    assert  PublicSuffix.valid?("www.google.tldnotlisted")
  end

  # def test_self_valid_with_fully_qualified_domain_name
  #   assert  PublicSuffix.valid?("google.com.")
  #   assert  PublicSuffix.valid?("google.co.uk.")
  #   assert !PublicSuffix.valid?("google.tldnotlisted.")
  # end


  def test_self_domain
    assert_equal "google.com",    PublicSuffix.domain("google.com")
    assert_equal "google.com",    PublicSuffix.domain("www.google.com")
    assert_equal "google.co.uk",  PublicSuffix.domain("google.co.uk")
    assert_equal "google.co.uk",  PublicSuffix.domain("www.google.co.uk")
  end

  def test_self_domain_with_notlisted_name
    assert_equal "example.tldnotlisted", PublicSuffix.domain("example.tldnotlisted")
  end

  def test_self_domain_with_unallowed_name
    assert_nil PublicSuffix.domain("example.bd")
  end

  def test_self_domain_with_blank_sld
    assert_nil PublicSuffix.domain("com")
    assert_nil PublicSuffix.domain(".com")
  end


  def test_self_normalize
    [
      ["com", "com"],
      ["example.com", "example.com"],
      ["www.example.com", "www.example.com"],

      ["example.com.",  "example.com"],     # strip FQDN
      [" example.com ", "example.com"],     # strip spaces
      ["Example.COM",   "example.com"],     # downcase
    ].each do |input, output|
      assert_equal output, PublicSuffix.normalize(input)
    end
  end

  def test_normalize_blank
    [
      nil,
      "",
      " ",
    ].each do |input|
      error = PublicSuffix.normalize(input)
      assert_instance_of PublicSuffix::DomainInvalid, error
      assert_equal "Name is blank", error.message
    end
  end

  def test_normalize_scheme
    [
      "https://google.com",
    ].each do |input|
      error = PublicSuffix.normalize(input)
      assert_instance_of PublicSuffix::DomainInvalid, error
      assert_match(/scheme/, error.message)
    end
  end

  def test_normalize_leading_dot
    [
      ".google.com",
    ].each do |input|
      error = PublicSuffix.normalize(input)
      assert_instance_of PublicSuffix::DomainInvalid, error
      assert_match "Name starts with a dot", error.message
    end
  end

end
