# frozen_string_literal: true

module I18n
  module Backend
    # This module contains several helpers to assist flattening translations.
    # You may want to flatten translations for:
    #
    #   1) speed up lookups, as in the Memoize backend;
    #   2) In case you want to store translations in a data store, as in ActiveRecord backend;
    #
    # You can check both backends above for some examples.
    # This module also keeps all links in a hash so they can be properly resolved when flattened.
    module Flatten
      SEPARATOR_ESCAPE_CHAR = "\001"
      FLATTEN_SEPARATOR = "."

      # normalize_keys the flatten way. This method is significantly faster
      # and creates way less objects than the one at I18n.normalize_keys.
      # It also handles escaping the translation keys.
      def self.normalize_flat_keys(locale, key, scope, separator)
        keys = [scope, key]
        keys.flatten!
        keys.compact!

        separator ||= I18n.default_separator

        if separator != FLATTEN_SEPARATOR
          from_str = "#{FLATTEN_SEPARATOR}#{separator}"
          to_str = "#{SEPARATOR_ESCAPE_CHAR}#{FLATTEN_SEPARATOR}"

          keys.map! { |k| k.to_s.tr from_str, to_str }
        end

        keys.join(".")
      end

      # Receives a string and escape the default separator.
      def self.escape_default_separator(key) #:nodoc:
        key.to_s.tr(FLATTEN_SEPARATOR, SEPARATOR_ESCAPE_CHAR)
      end

      # Shortcut to I18n::Backend::Flatten.normalize_flat_keys
      # and then resolve_links.
      def normalize_flat_keys(locale, key, scope, separator)
        key = I18n::Backend::Flatten.normalize_flat_keys(locale, key, scope, separator)
        resolve_link(locale, key)
      end

      # Store flattened links.
      def links
        @links ||= I18n.new_double_nested_cache
      end

      # Flatten keys for nested Hashes by chaining up keys:
      #
      #   >> { "a" => { "b" => { "c" => "d", "e" => "f" }, "g" => "h" }, "i" => "j"}.wind
      #   => { "a.b.c" => "d", "a.b.e" => "f", "a.g" => "h", "i" => "j" }
      #
      def flatten_keys(hash, escape, prev_key=nil, &block)
        hash.each_pair do |key, value|
          key = escape_default_separator(key) if escape
          curr_key = [prev_key, key].compact.join(FLATTEN_SEPARATOR).to_sym
          yield curr_key, value
          flatten_keys(value, escape, curr_key, &block) if value.is_a?(Hash)
        end
      end

      # Receives a hash of translations (where the key is a locale and
      # the value is another hash) and return a hash with all
      # translations flattened.
      #
      # Nested hashes are included in the flattened hash just if subtree
      # is true and Symbols are automatically stored as links.
      def flatten_translations(locale, data, escape, subtree)
        hash = {}
        flatten_keys(data, escape) do |key, value|
          if value.is_a?(Hash)
            hash[key] = value if subtree
          else
            store_link(locale, key, value) if value.is_a?(Symbol)
            hash[key] = value
          end
        end
        hash
      end

      protected

        def store_link(locale, key, link)
          links[locale.to_sym][key.to_s] = link.to_s
        end

        def resolve_link(locale, key)
          key, locale = key.to_s, locale.to_sym
          links = self.links[locale]

          if links.key?(key)
            links[key]
          elsif link = find_link(locale, key)
            store_link(locale, key, key.gsub(*link))
          else
            key
          end
        end

        def find_link(locale, key) #:nodoc:
          links[locale].each_pair do |from, to|
            return [from, to] if key[0, from.length] == from
          end && nil
        end

        def escape_default_separator(key) #:nodoc:
          I18n::Backend::Flatten.escape_default_separator(key)
        end

    end
  end
end
