# frozen_string_literal: true

# = Public Suffix
#
# Domain name parser based on the Public Suffix List.
#
# Copyright (c) 2009-2022 Simone Carletti <weppos@weppos.net>

module PublicSuffix

  # A Rule is a special object which holds a single definition
  # of the Public Suffix List.
  #
  # There are 3 types of rules, each one represented by a specific
  # subclass within the +PublicSuffix::Rule+ namespace.
  #
  # To create a new Rule, use the {PublicSuffix::Rule#factory} method.
  #
  #   PublicSuffix::Rule.factory("ar")
  #   # => #<PublicSuffix::Rule::Normal>
  #
  module Rule

    # @api internal
    Entry = Struct.new(:type, :length, :private) # rubocop:disable Lint/StructNewOverride

    # = Abstract rule class
    #
    # This represent the base class for a Rule definition
    # in the {Public Suffix List}[https://publicsuffix.org].
    #
    # This is intended to be an Abstract class
    # and you shouldn't create a direct instance. The only purpose
    # of this class is to expose a common interface
    # for all the available subclasses.
    #
    # * {PublicSuffix::Rule::Normal}
    # * {PublicSuffix::Rule::Exception}
    # * {PublicSuffix::Rule::Wildcard}
    #
    # ## Properties
    #
    # A rule is composed by 4 properties:
    #
    # value   - A normalized version of the rule name.
    #           The normalization process depends on rule tpe.
    #
    # Here's an example
    #
    #   PublicSuffix::Rule.factory("*.google.com")
    #   #<PublicSuffix::Rule::Wildcard:0x1015c14b0
    #       @value="google.com"
    #   >
    #
    # ## Rule Creation
    #
    # The best way to create a new rule is passing the rule name
    # to the <tt>PublicSuffix::Rule.factory</tt> method.
    #
    #   PublicSuffix::Rule.factory("com")
    #   # => PublicSuffix::Rule::Normal
    #
    #   PublicSuffix::Rule.factory("*.com")
    #   # => PublicSuffix::Rule::Wildcard
    #
    # This method will detect the rule type and create an instance
    # from the proper rule class.
    #
    # ## Rule Usage
    #
    # A rule describes the composition of a domain name and explains how to tokenize
    # the name into tld, sld and trd.
    #
    # To use a rule, you first need to be sure the name you want to tokenize
    # can be handled by the current rule.
    # You can use the <tt>#match?</tt> method.
    #
    #   rule = PublicSuffix::Rule.factory("com")
    #
    #   rule.match?("google.com")
    #   # => true
    #
    #   rule.match?("google.com")
    #   # => false
    #
    # Rule order is significant. A name can match more than one rule.
    # See the {Public Suffix Documentation}[http://publicsuffix.org/format/]
    # to learn more about rule priority.
    #
    # When you have the right rule, you can use it to tokenize the domain name.
    #
    #   rule = PublicSuffix::Rule.factory("com")
    #
    #   rule.decompose("google.com")
    #   # => ["google", "com"]
    #
    #   rule.decompose("www.google.com")
    #   # => ["www.google", "com"]
    #
    # @abstract
    #
    class Base

      # @return [String] the rule definition
      attr_reader :value

      # @return [String] the length of the rule
      attr_reader :length

      # @return [Boolean] true if the rule is a private domain
      attr_reader :private


      # Initializes a new rule from the content.
      #
      # @param  content [String] the content of the rule
      # @param  private [Boolean]
      def self.build(content, private: false)
        new(value: content, private: private)
      end

      # Initializes a new rule.
      #
      # @param  value [String]
      # @param  private [Boolean]
      def initialize(value:, length: nil, private: false)
        @value    = value.to_s
        @length   = length || @value.count(DOT) + 1
        @private  = private
      end

      # Checks whether this rule is equal to <tt>other</tt>.
      #
      # @param  other [PublicSuffix::Rule::*] The rule to compare
      # @return [Boolean] true if this rule and other are instances of the same class
      #         and has the same value, false otherwise.
      def ==(other)
        equal?(other) || (self.class == other.class && value == other.value)
      end
      alias eql? ==

      # Checks if this rule matches +name+.
      #
      # A domain name is said to match a rule if and only if
      # all of the following conditions are met:
      #
      # - When the domain and rule are split into corresponding labels,
      #   that the domain contains as many or more labels than the rule.
      # - Beginning with the right-most labels of both the domain and the rule,
      #   and continuing for all labels in the rule, one finds that for every pair,
      #   either they are identical, or that the label from the rule is "*".
      #
      # @see https://publicsuffix.org/list/
      #
      # @example
      #   PublicSuffix::Rule.factory("com").match?("example.com")
      #   # => true
      #   PublicSuffix::Rule.factory("com").match?("example.net")
      #   # => false
      #
      # @param  name [String] the domain name to check
      # @return [Boolean]
      def match?(name)
        # Note: it works because of the assumption there are no
        # rules like foo.*.com. If the assumption is incorrect,
        # we need to properly walk the input and skip parts according
        # to wildcard component.
        diff = name.chomp(value)
        diff.empty? || diff.end_with?(DOT)
      end

      # @abstract
      def parts
        raise NotImplementedError
      end

      # @abstract
      # @param  domain [#to_s] The domain name to decompose
      # @return [Array<String, nil>]
      def decompose(*)
        raise NotImplementedError
      end

    end

    # Normal represents a standard rule (e.g. com).
    class Normal < Base

      # Gets the original rule definition.
      #
      # @return [String] The rule definition.
      def rule
        value
      end

      # Decomposes the domain name according to rule properties.
      #
      # @param  domain [#to_s] The domain name to decompose
      # @return [Array<String>] The array with [trd + sld, tld].
      def decompose(domain)
        suffix = parts.join('\.')
        matches = domain.to_s.match(/^(.*)\.(#{suffix})$/)
        matches ? matches[1..2] : [nil, nil]
      end

      # dot-split rule value and returns all rule parts
      # in the order they appear in the value.
      #
      # @return [Array<String>]
      def parts
        @value.split(DOT)
      end

    end

    # Wildcard represents a wildcard rule (e.g. *.co.uk).
    class Wildcard < Base

      # Initializes a new rule from the content.
      #
      # @param  content [String] the content of the rule
      # @param  private [Boolean]
      def self.build(content, private: false)
        new(value: content.to_s[2..-1], private: private)
      end

      # Initializes a new rule.
      #
      # @param  value [String]
      # @param  length [Integer]
      # @param  private [Boolean]
      def initialize(value:, length: nil, private: false)
        super(value: value, length: length, private: private)
        length or @length += 1 # * counts as 1
      end

      # Gets the original rule definition.
      #
      # @return [String] The rule definition.
      def rule
        value == "" ? STAR : STAR + DOT + value
      end

      # Decomposes the domain name according to rule properties.
      #
      # @param  domain [#to_s] The domain name to decompose
      # @return [Array<String>] The array with [trd + sld, tld].
      def decompose(domain)
        suffix = ([".*?"] + parts).join('\.')
        matches = domain.to_s.match(/^(.*)\.(#{suffix})$/)
        matches ? matches[1..2] : [nil, nil]
      end

      # dot-split rule value and returns all rule parts
      # in the order they appear in the value.
      #
      # @return [Array<String>]
      def parts
        @value.split(DOT)
      end

    end

    # Exception represents an exception rule (e.g. !parliament.uk).
    class Exception < Base

      # Initializes a new rule from the content.
      #
      # @param  content [#to_s] the content of the rule
      # @param  private [Boolean]
      def self.build(content, private: false)
        new(value: content.to_s[1..-1], private: private)
      end

      # Gets the original rule definition.
      #
      # @return [String] The rule definition.
      def rule
        BANG + value
      end

      # Decomposes the domain name according to rule properties.
      #
      # @param  domain [#to_s] The domain name to decompose
      # @return [Array<String>] The array with [trd + sld, tld].
      def decompose(domain)
        suffix = parts.join('\.')
        matches = domain.to_s.match(/^(.*)\.(#{suffix})$/)
        matches ? matches[1..2] : [nil, nil]
      end

      # dot-split rule value and returns all rule parts
      # in the order they appear in the value.
      # The leftmost label is not considered a label.
      #
      # See http://publicsuffix.org/format/:
      # If the prevailing rule is a exception rule,
      # modify it by removing the leftmost label.
      #
      # @return [Array<String>]
      def parts
        @value.split(DOT)[1..-1]
      end

    end


    # Takes the +name+ of the rule, detects the specific rule class
    # and creates a new instance of that class.
    # The +name+ becomes the rule +value+.
    #
    # @example Creates a Normal rule
    #   PublicSuffix::Rule.factory("ar")
    #   # => #<PublicSuffix::Rule::Normal>
    #
    # @example Creates a Wildcard rule
    #   PublicSuffix::Rule.factory("*.ar")
    #   # => #<PublicSuffix::Rule::Wildcard>
    #
    # @example Creates an Exception rule
    #   PublicSuffix::Rule.factory("!congresodelalengua3.ar")
    #   # => #<PublicSuffix::Rule::Exception>
    #
    # @param  content [#to_s] the content of the rule
    # @return [PublicSuffix::Rule::*] A rule instance.
    def self.factory(content, private: false)
      case content.to_s[0, 1]
      when STAR
        Wildcard
      when BANG
        Exception
      else
        Normal
      end.build(content, private: private)
    end

    # The default rule to use if no rule match.
    #
    # The default rule is "*". From https://publicsuffix.org/list/:
    #
    # > If no rules match, the prevailing rule is "*".
    #
    # @return [PublicSuffix::Rule::Wildcard] The default rule.
    def self.default
      factory(STAR)
    end

  end

end
