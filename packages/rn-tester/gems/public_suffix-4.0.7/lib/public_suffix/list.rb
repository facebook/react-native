# frozen_string_literal: true

# = Public Suffix
#
# Domain name parser based on the Public Suffix List.
#
# Copyright (c) 2009-2022 Simone Carletti <weppos@weppos.net>

module PublicSuffix

  # A {PublicSuffix::List} is a collection of one
  # or more {PublicSuffix::Rule}.
  #
  # Given a {PublicSuffix::List},
  # you can add or remove {PublicSuffix::Rule},
  # iterate all items in the list or search for the first rule
  # which matches a specific domain name.
  #
  #   # Create a new list
  #   list =  PublicSuffix::List.new
  #
  #   # Push two rules to the list
  #   list << PublicSuffix::Rule.factory("it")
  #   list << PublicSuffix::Rule.factory("com")
  #
  #   # Get the size of the list
  #   list.size
  #   # => 2
  #
  #   # Search for the rule matching given domain
  #   list.find("example.com")
  #   # => #<PublicSuffix::Rule::Normal>
  #   list.find("example.org")
  #   # => nil
  #
  # You can create as many {PublicSuffix::List} you want.
  # The {PublicSuffix::List.default} rule list is used
  # to tokenize and validate a domain.
  #
  class List

    DEFAULT_LIST_PATH = File.expand_path("../../data/list.txt", __dir__)

    # Gets the default rule list.
    #
    # Initializes a new {PublicSuffix::List} parsing the content
    # of {PublicSuffix::List.default_list_content}, if required.
    #
    # @return [PublicSuffix::List]
    def self.default(**options)
      @default ||= parse(File.read(DEFAULT_LIST_PATH), **options)
    end

    # Sets the default rule list to +value+.
    #
    # @param  value [PublicSuffix::List] the new list
    # @return [PublicSuffix::List]
    def self.default=(value)
      @default = value
    end

    # Parse given +input+ treating the content as Public Suffix List.
    #
    # See http://publicsuffix.org/format/ for more details about input format.
    #
    # @param  input [#each_line] the list to parse
    # @param  private_domains [Boolean] whether to ignore the private domains section
    # @return [PublicSuffix::List]
    def self.parse(input, private_domains: true)
      comment_token = "//"
      private_token = "===BEGIN PRIVATE DOMAINS==="
      section = nil # 1 == ICANN, 2 == PRIVATE

      new do |list|
        input.each_line do |line|
          line.strip!
          case # rubocop:disable Style/EmptyCaseCondition

          # skip blank lines
          when line.empty?
            next

          # include private domains or stop scanner
          when line.include?(private_token)
            break if !private_domains

            section = 2

          # skip comments
          when line.start_with?(comment_token)
            next

          else
            list.add(Rule.factory(line, private: section == 2))

          end
        end
      end
    end


    # Initializes an empty {PublicSuffix::List}.
    #
    # @yield [self] Yields on self.
    # @yieldparam [PublicSuffix::List] self The newly created instance.
    def initialize
      @rules = {}
      yield(self) if block_given?
    end


    # Checks whether two lists are equal.
    #
    # List <tt>one</tt> is equal to <tt>two</tt>, if <tt>two</tt> is an instance of
    # {PublicSuffix::List} and each +PublicSuffix::Rule::*+
    # in list <tt>one</tt> is available in list <tt>two</tt>, in the same order.
    #
    # @param  other [PublicSuffix::List] the List to compare
    # @return [Boolean]
    def ==(other)
      return false unless other.is_a?(List)

      equal?(other) || @rules == other.rules
    end
    alias eql? ==

    # Iterates each rule in the list.
    def each(&block)
      Enumerator.new do |y|
        @rules.each do |key, node|
          y << entry_to_rule(node, key)
        end
      end.each(&block)
    end


    # Adds the given object to the list and optionally refreshes the rule index.
    #
    # @param  rule [PublicSuffix::Rule::*] the rule to add to the list
    # @return [self]
    def add(rule)
      @rules[rule.value] = rule_to_entry(rule)
      self
    end
    alias << add

    # Gets the number of rules in the list.
    #
    # @return [Integer]
    def size
      @rules.size
    end

    # Checks whether the list is empty.
    #
    # @return [Boolean]
    def empty?
      @rules.empty?
    end

    # Removes all rules.
    #
    # @return [self]
    def clear
      @rules.clear
      self
    end

    # Finds and returns the rule corresponding to the longest public suffix for the hostname.
    #
    # @param  name [#to_s] the hostname
    # @param  default [PublicSuffix::Rule::*] the default rule to return in case no rule matches
    # @return [PublicSuffix::Rule::*]
    def find(name, default: default_rule, **options)
      rule = select(name, **options).inject do |l, r|
        return r if r.instance_of?(Rule::Exception)

        l.length > r.length ? l : r
      end
      rule || default
    end

    # Selects all the rules matching given hostame.
    #
    # If `ignore_private` is set to true, the algorithm will skip the rules that are flagged as
    # private domain. Note that the rules will still be part of the loop.
    # If you frequently need to access lists ignoring the private domains,
    # you should create a list that doesn't include these domains setting the
    # `private_domains: false` option when calling {.parse}.
    #
    # Note that this method is currently private, as you should not rely on it. Instead,
    # the public interface is {#find}. The current internal algorithm allows to return all
    # matching rules, but different data structures may not be able to do it, and instead would
    # return only the match. For this reason, you should rely on {#find}.
    #
    # @param  name [#to_s] the hostname
    # @param  ignore_private [Boolean]
    # @return [Array<PublicSuffix::Rule::*>]
    def select(name, ignore_private: false)
      name = name.to_s

      parts = name.split(DOT).reverse!
      index = 0
      query = parts[index]
      rules = []

      loop do
        match = @rules[query]
        rules << entry_to_rule(match, query) if !match.nil? && (ignore_private == false || match.private == false)

        index += 1
        break if index >= parts.size

        query = parts[index] + DOT + query
      end

      rules
    end
    private :select

    # Gets the default rule.
    #
    # @see PublicSuffix::Rule.default_rule
    #
    # @return [PublicSuffix::Rule::*]
    def default_rule
      PublicSuffix::Rule.default
    end


    protected

    attr_reader :rules


    private

    def entry_to_rule(entry, value)
      entry.type.new(value: value, length: entry.length, private: entry.private)
    end

    def rule_to_entry(rule)
      Rule::Entry.new(rule.class, rule.length, rule.private)
    end

  end
end
