# frozen_string_literal: true

require "test_helper"

class PublicSuffix::RuleTest < Minitest::Test

  def test_factory_should_return_rule_normal
    rule = PublicSuffix::Rule.factory("com")
    assert_instance_of PublicSuffix::Rule::Normal, rule

    rule = PublicSuffix::Rule.factory("verona.it")
    assert_instance_of PublicSuffix::Rule::Normal, rule
  end

  def test_factory_should_return_rule_exception
    rule = PublicSuffix::Rule.factory("!british-library.uk")
    assert_instance_of PublicSuffix::Rule::Exception, rule
  end

  def test_factory_should_return_rule_wildcard
    rule = PublicSuffix::Rule.factory("*.do")
    assert_instance_of PublicSuffix::Rule::Wildcard, rule

    rule = PublicSuffix::Rule.factory("*.sch.uk")
    assert_instance_of PublicSuffix::Rule::Wildcard, rule
  end


  def test_default_returns_default_wildcard
    default = PublicSuffix::Rule.default
    assert_equal PublicSuffix::Rule::Wildcard.build("*"), default
    assert_equal %w( example tldnotlisted ), default.decompose("example.tldnotlisted")
    assert_equal %w( www.example tldnotlisted ), default.decompose("www.example.tldnotlisted")
  end

end


class PublicSuffix::RuleBaseTest < Minitest::Test

  class ::PublicSuffix::Rule::Test < ::PublicSuffix::Rule::Base
  end

  def setup
    @klass = PublicSuffix::Rule::Base
  end


  def test_initialize
    rule = @klass.new(value: "verona.it")
    assert_instance_of @klass,  rule
    assert_equal "verona.it",   rule.value
  end


  def test_equality_with_self
    rule = PublicSuffix::Rule::Base.new(value: "foo")
    assert_equal rule, rule
  end

  # rubocop:disable Style/SingleLineMethods
  def test_equality_with_internals
    assert_equal @klass.new(value: "foo"), @klass.new(value: "foo")
    refute_equal @klass.new(value: "foo"), @klass.new(value: "bar")
    refute_equal @klass.new(value: "foo"), PublicSuffix::Rule::Test.new(value: "foo")
    refute_equal @klass.new(value: "foo"), PublicSuffix::Rule::Test.new(value: "bar")
    refute_equal @klass.new(value: "foo"), Class.new { def name; foo; end }.new
  end
  # rubocop:enable Style/SingleLineMethods

  def test_match
    [
      # standard match
      [PublicSuffix::Rule.factory("uk"), "uk", true],
      [PublicSuffix::Rule.factory("uk"), "example.uk", true],
      [PublicSuffix::Rule.factory("uk"), "example.co.uk", true],
      [PublicSuffix::Rule.factory("co.uk"), "example.co.uk", true],

      # FIXME
      # [PublicSuffix::Rule.factory("*.com"), "com", false],
      [PublicSuffix::Rule.factory("*.com"), "example.com", true],
      [PublicSuffix::Rule.factory("*.com"), "foo.example.com", true],
      [PublicSuffix::Rule.factory("!example.com"), "com", false],
      [PublicSuffix::Rule.factory("!example.com"), "example.com", true],
      [PublicSuffix::Rule.factory("!example.com"), "foo.example.com", true],

      # TLD mismatch
      [PublicSuffix::Rule.factory("gk"), "example.uk", false],
      [PublicSuffix::Rule.factory("gk"), "example.co.uk", false],
      [PublicSuffix::Rule.factory("co.uk"), "uk", false],

      # general mismatch
      [PublicSuffix::Rule.factory("uk.co"), "example.co.uk", false],
      [PublicSuffix::Rule.factory("go.uk"), "example.co.uk", false],
      [PublicSuffix::Rule.factory("co.uk"), "uk", false],

      # partial matches/mismatches
      [PublicSuffix::Rule.factory("co"), "example.co.uk", false],
      [PublicSuffix::Rule.factory("example"), "example.uk", false],
      [PublicSuffix::Rule.factory("le.it"), "example.it", false],
      [PublicSuffix::Rule.factory("le.it"), "le.it", true],
      [PublicSuffix::Rule.factory("le.it"), "foo.le.it", true],

    ].each do |rule, input, expected|
      assert_equal expected, rule.match?(input)
    end
  end


  def test_parts
    assert_raises(NotImplementedError) { @klass.new(value: "com").parts }
  end

  def test_decompose
    assert_raises(NotImplementedError) { @klass.new(value: "com").decompose("google.com") }
  end

end


class PublicSuffix::RuleNormalTest < Minitest::Test

  def setup
    @klass = PublicSuffix::Rule::Normal
  end


  def test_build
    rule = @klass.build("verona.it")
    assert_instance_of @klass,              rule
    assert_equal "verona.it",               rule.value
    assert_equal "verona.it",               rule.rule
  end


  def test_length
    assert_equal 1, @klass.build("com").length
    assert_equal 2, @klass.build("co.com").length
    assert_equal 3, @klass.build("mx.co.com").length
  end

  def test_parts
    assert_equal %w(com), @klass.build("com").parts
    assert_equal %w(co com), @klass.build("co.com").parts
    assert_equal %w(mx co com), @klass.build("mx.co.com").parts
  end

  def test_decompose
    assert_equal [nil, nil], @klass.build("com").decompose("com")
    assert_equal %w( example com ), @klass.build("com").decompose("example.com")
    assert_equal %w( foo.example com ), @klass.build("com").decompose("foo.example.com")
  end

end


class PublicSuffix::RuleExceptionTest < Minitest::Test

  def setup
    @klass = PublicSuffix::Rule::Exception
  end


  def test_initialize
    rule = @klass.build("!british-library.uk")
    assert_instance_of @klass, rule
    assert_equal "british-library.uk", rule.value
    assert_equal "!british-library.uk", rule.rule
  end


  def test_length
    assert_equal 2, @klass.build("!british-library.uk").length
    assert_equal 3, @klass.build("!foo.british-library.uk").length
  end

  def test_parts
    assert_equal %w( uk ), @klass.build("!british-library.uk").parts
    assert_equal %w( tokyo jp ), @klass.build("!metro.tokyo.jp").parts
  end

  def test_decompose
    assert_equal [nil, nil], @klass.build("!british-library.uk").decompose("uk")
    assert_equal %w( british-library uk ), @klass.build("!british-library.uk").decompose("british-library.uk")
    assert_equal %w( foo.british-library uk ), @klass.build("!british-library.uk").decompose("foo.british-library.uk")
  end

end


class PublicSuffix::RuleWildcardTest < Minitest::Test

  def setup
    @klass = PublicSuffix::Rule::Wildcard
  end


  def test_initialize
    rule = @klass.build("*.aichi.jp")
    assert_instance_of @klass, rule
    assert_equal "aichi.jp", rule.value
    assert_equal "*.aichi.jp", rule.rule
  end


  def test_length
    assert_equal 2, @klass.build("*.uk").length
    assert_equal 3, @klass.build("*.co.uk").length
  end

  def test_parts
    assert_equal %w( uk ), @klass.build("*.uk").parts
    assert_equal %w( co uk ), @klass.build("*.co.uk").parts
  end

  def test_decompose
    assert_equal [nil, nil], @klass.build("*.do").decompose("nic.do")
    assert_equal %w( google co.uk ), @klass.build("*.uk").decompose("google.co.uk")
    assert_equal %w( foo.google co.uk ), @klass.build("*.uk").decompose("foo.google.co.uk")
  end

end
