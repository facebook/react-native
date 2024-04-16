# Locale Fallbacks
#
# Extends the I18n module to hold a fallbacks instance which is set to an
# instance of I18n::Locale::Fallbacks by default but can be swapped with a
# different implementation.
#
# Locale fallbacks will compute a number of fallback locales for a given locale.
# For example:
#
# <pre><code>
# I18n.fallbacks[:"es-MX"] # => [:"es-MX", :es, :en] </code></pre>
#
# Locale fallbacks always fall back to
#
#   * all parent locales of a given locale (e.g. :es for :"es-MX") first,
#   * the current default locales and all of their parents second
#
# The default locales are set to [] by default but can be set to something else.
#
# One can additionally add any number of additional fallback locales manually.
# These will be added before the default locales to the fallback chain. For
# example:
#
#   # using a custom locale as default fallback locale
#
#   I18n.fallbacks = I18n::Locale::Fallbacks.new(:"en-GB", :"de-AT" => :de, :"de-CH" => :de)
#   I18n.fallbacks[:"de-AT"] # => [:"de-AT", :de, :"en-GB", :en]
#   I18n.fallbacks[:"de-CH"] # => [:"de-CH", :de, :"en-GB", :en]
#
#   # mapping fallbacks to an existing instance
#
#   # people speaking Catalan also speak Spanish as spoken in Spain
#   fallbacks = I18n.fallbacks
#   fallbacks.map(:ca => :"es-ES")
#   fallbacks[:ca] # => [:ca, :"es-ES", :es, :"en-US", :en]
#
#   # people speaking Arabian as spoken in Palestine also speak Hebrew as spoken in Israel
#   fallbacks.map(:"ar-PS" => :"he-IL")
#   fallbacks[:"ar-PS"] # => [:"ar-PS", :ar, :"he-IL", :he, :"en-US", :en]
#   fallbacks[:"ar-EG"] # => [:"ar-EG", :ar, :"en-US", :en]
#
#   # people speaking Sami as spoken in Finland also speak Swedish and Finnish as spoken in Finland
#   fallbacks.map(:sms => [:"se-FI", :"fi-FI"])
#   fallbacks[:sms] # => [:sms, :"se-FI", :se, :"fi-FI", :fi, :"en-US", :en]

module I18n
  module Locale
    class Fallbacks < Hash
      def initialize(*mappings)
        @map = {}
        map(mappings.pop) if mappings.last.is_a?(Hash)
        self.defaults = mappings.empty? ? [] : mappings
      end

      def defaults=(defaults)
        @defaults = defaults.flat_map { |default| compute(default, false) }
      end
      attr_reader :defaults

      def [](locale)
        raise InvalidLocale.new(locale) if locale.nil?
        raise Disabled.new('fallback#[]') if locale == false
        locale = locale.to_sym
        super || store(locale, compute(locale))
      end

      def map(*args, &block)
        if args.count == 1 && !block_given?
          mappings = args.first
          mappings.each do |from, to|
            from, to = from.to_sym, Array(to)
            to.each do |_to|
              @map[from] ||= []
              @map[from] << _to.to_sym
            end
          end
        else
          @map.map(*args, &block)
        end
      end

      def empty?
        @map.empty? && @defaults.empty?
      end

      def inspect
       "#<#{self.class.name} @map=#{@map.inspect} @defaults=#{@defaults.inspect}>"
      end

      protected

      def compute(tags, include_defaults = true, exclude = [])
        result = Array(tags).flat_map do |tag|
          tags = I18n::Locale::Tag.tag(tag).self_and_parents.map! { |t| t.to_sym } - exclude
          tags.each { |_tag| tags += compute(@map[_tag], false, exclude + tags) if @map[_tag] }
          tags
        end
        result.push(*defaults) if include_defaults
        result.uniq!
        result.compact!
        result
      end
    end
  end
end
