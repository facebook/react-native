# frozen_string_literal: true

require 'i18n/backend/base'

module I18n

  begin
    require 'oj'
    class JSON
      class << self
        def encode(value)
          Oj::Rails.encode(value)
        end
        def decode(value)
          Oj.load(value)
        end
      end
    end
  rescue LoadError
    require 'active_support/json'
    JSON = ActiveSupport::JSON
  end

  module Backend
    # This is a basic backend for key value stores. It receives on
    # initialization the store, which should respond to three methods:
    #
    # * store#[](key)         - Used to get a value
    # * store#[]=(key, value) - Used to set a value
    # * store#keys            - Used to get all keys
    #
    # Since these stores only supports string, all values are converted
    # to JSON before being stored, allowing it to also store booleans,
    # hashes and arrays. However, this store does not support Procs.
    #
    # As the ActiveRecord backend, Symbols are just supported when loading
    # translations from the filesystem or through explicit store translations.
    #
    # Also, avoid calling I18n.available_locales since it's a somehow
    # expensive operation in most stores.
    #
    # == Example
    #
    # To setup I18n to use TokyoCabinet in memory is quite straightforward:
    #
    #   require 'rufus/tokyo/cabinet' # gem install rufus-tokyo
    #   I18n.backend = I18n::Backend::KeyValue.new(Rufus::Tokyo::Cabinet.new('*'))
    #
    # == Performance
    #
    # You may make this backend even faster by including the Memoize module.
    # However, notice that you should properly clear the cache if you change
    # values directly in the key-store.
    #
    # == Subtrees
    #
    # In most backends, you are allowed to retrieve part of a translation tree:
    #
    #   I18n.backend.store_translations :en, :foo => { :bar => :baz }
    #   I18n.t "foo" #=> { :bar => :baz }
    #
    # This backend supports this feature by default, but it slows down the storage
    # of new data considerably and makes hard to delete entries. That said, you are
    # allowed to disable the storage of subtrees on initialization:
    #
    #   I18n::Backend::KeyValue.new(@store, false)
    #
    # This is useful if you are using a KeyValue backend chained to a Simple backend.
    class KeyValue
      module Implementation
        attr_accessor :store

        include Base, Flatten

        def initialize(store, subtrees=true)
          @store, @subtrees = store, subtrees
        end

        def initialized?
          !@store.nil?
        end

        def store_translations(locale, data, options = EMPTY_HASH)
          escape = options.fetch(:escape, true)
          flatten_translations(locale, data, escape, @subtrees).each do |key, value|
            key = "#{locale}.#{key}"

            case value
            when Hash
              if @subtrees && (old_value = @store[key])
                old_value = JSON.decode(old_value)
                value = Utils.deep_merge!(Utils.deep_symbolize_keys(old_value), value) if old_value.is_a?(Hash)
              end
            when Proc
              raise "Key-value stores cannot handle procs"
            end

            @store[key] = JSON.encode(value) unless value.is_a?(Symbol)
          end
        end

        def available_locales
          locales = @store.keys.map { |k| k =~ /\./; $` }
          locales.uniq!
          locales.compact!
          locales.map! { |k| k.to_sym }
          locales
        end

      protected

        # Queries the translations from the key-value store and converts
        # them into a hash such as the one returned from loading the
        # haml files
        def translations
          @translations = Utils.deep_symbolize_keys(@store.keys.clone.map do |main_key|
            main_value = JSON.decode(@store[main_key])
            main_key.to_s.split(".").reverse.inject(main_value) do |value, key|
              {key.to_sym => value}
            end
          end.inject{|hash, elem| Utils.deep_merge!(hash, elem)})
        end

        def init_translations
          # NO OP
          # This call made also inside Simple Backend and accessed by
          # other plugins like I18n-js and babilu and
          # to use it along with the Chain backend we need to
          # provide a uniform API even for protected methods :S
        end

        def subtrees?
          @subtrees
        end

        def lookup(locale, key, scope = [], options = EMPTY_HASH)
          key   = normalize_flat_keys(locale, key, scope, options[:separator])
          value = @store["#{locale}.#{key}"]
          value = JSON.decode(value) if value

          if value.is_a?(Hash)
            Utils.deep_symbolize_keys(value)
          elsif !value.nil?
            value
          elsif !@subtrees
            SubtreeProxy.new("#{locale}.#{key}", @store)
          end
        end

        def pluralize(locale, entry, count)
          if subtrees?
            super
          else
            return entry unless entry.is_a?(Hash)
            key = pluralization_key(entry, count)
            entry[key]
          end
        end
      end

      class SubtreeProxy
        def initialize(master_key, store)
          @master_key = master_key
          @store = store
          @subtree = nil
        end

        def has_key?(key)
          @subtree && @subtree.has_key?(key) || self[key]
        end

        def [](key)
          unless @subtree && value = @subtree[key]
            value = @store["#{@master_key}.#{key}"]
            if value
              value = JSON.decode(value)
              (@subtree ||= {})[key] = value
            end
          end
          value
        end

        def is_a?(klass)
          Hash == klass || super
        end
        alias :kind_of? :is_a?

        def instance_of?(klass)
          Hash == klass || super
        end

        def nil?
          @subtree.nil?
        end

        def inspect
          @subtree.inspect
        end
      end

      include Implementation
    end
  end
end
