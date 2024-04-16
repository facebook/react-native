# frozen_string_literal: true

require "test_helper"

class PublicSuffix::DomainTest < Minitest::Test

  def setup
    @klass = PublicSuffix::Domain
  end

  # Tokenizes given input into labels.
  def test_self_name_to_labels
    assert_equal  %w( someone spaces live com ),
                  PublicSuffix::Domain.name_to_labels("someone.spaces.live.com")
    assert_equal  %w( leontina23samiko wiki zoho com ),
                  PublicSuffix::Domain.name_to_labels("leontina23samiko.wiki.zoho.com")
  end

  # Converts input into String.
  def test_self_name_to_labels_converts_input_to_string
    assert_equal  %w( someone spaces live com ),
                  PublicSuffix::Domain.name_to_labels(:"someone.spaces.live.com")
  end


  def test_initialize_with_tld
    domain = @klass.new("com")
    assert_equal "com", domain.tld
    assert_nil domain.sld
    assert_nil domain.trd
  end

  def test_initialize_with_tld_and_sld
    domain = @klass.new("com", "google")
    assert_equal "com", domain.tld
    assert_equal "google", domain.sld
    assert_nil domain.trd
  end

  def test_initialize_with_tld_and_sld_and_trd
    domain = @klass.new("com", "google", "www")
    assert_equal "com", domain.tld
    assert_equal "google", domain.sld
    assert_equal "www", domain.trd
  end


  def test_to_s
    assert_equal "com",             @klass.new("com").to_s
    assert_equal "google.com",      @klass.new("com", "google").to_s
    assert_equal "www.google.com",  @klass.new("com", "google", "www").to_s
  end

  def test_to_a
    assert_equal [nil, nil, "com"],         @klass.new("com").to_a
    assert_equal [nil, "google", "com"],    @klass.new("com", "google").to_a
    assert_equal ["www", "google", "com"],  @klass.new("com", "google", "www").to_a
  end


  def test_tld
    assert_equal "com", @klass.new("com", "google", "www").tld
  end

  def test_sld
    assert_equal "google", @klass.new("com", "google", "www").sld
  end

  def test_trd
    assert_equal "www", @klass.new("com", "google", "www").trd
  end


  def test_name
    assert_equal "com",             @klass.new("com").name
    assert_equal "google.com",      @klass.new("com", "google").name
    assert_equal "www.google.com",  @klass.new("com", "google", "www").name
  end

  def test_domain
    assert_nil @klass.new("com").domain
    assert_nil @klass.new("tldnotlisted").domain
    assert_equal "google.com", @klass.new("com", "google").domain
    assert_equal "google.tldnotlisted", @klass.new("tldnotlisted", "google").domain
    assert_equal "google.com", @klass.new("com", "google", "www").domain
    assert_equal "google.tldnotlisted", @klass.new("tldnotlisted", "google", "www").domain
  end

  def test_subdomain
    assert_nil @klass.new("com").subdomain
    assert_nil @klass.new("tldnotlisted").subdomain
    assert_nil @klass.new("com", "google").subdomain
    assert_nil @klass.new("tldnotlisted", "google").subdomain
    assert_equal "www.google.com", @klass.new("com", "google", "www").subdomain
    assert_equal "www.google.tldnotlisted", @klass.new("tldnotlisted", "google", "www").subdomain
  end


  def test_domain_question
    assert !@klass.new("com").domain?
    assert  @klass.new("com", "example").domain?
    assert  @klass.new("com", "example", "www").domain?
    assert  @klass.new("tldnotlisted", "example").domain?
  end

end
