require 'active_support/core_ext/hash/indifferent_access'

module Pod
  # Provides support for the hook system of CocoaPods. The system is designed
  # especially for plugins. Interested clients can register to notifications by
  # name.
  #
  # The blocks, to prevent compatibility issues, will receive
  # one and only one argument: a context object. This object should be simple
  # storage of information (a typed hash). Notifications senders are
  # responsible to indicate the class of the object associated with their
  # notification name.
  #
  # Context object should not remove attribute accessors to not break
  # compatibility with the plugins (this promise will be honoured strictly
  # from CocoaPods 1.0).
  #
  module HooksManager
    # Represents a single registered hook.
    #
    class Hook
      # @return [String]
      #         The name of the plugin that registered the hook.
      #
      attr_reader :plugin_name

      # @return [String]
      #         The name of the hook.
      #
      attr_reader :name

      # @return [Proc]
      #         The block.
      #
      attr_reader :block

      # Initialize a new instance
      #
      # @param  [String] name        @see {#name}.
      #
      # @param  [String] plugin_name @see {#plugin_name}.
      #
      # @param  [Proc]   block       @see {#block}.
      #
      def initialize(name, plugin_name, block)
        raise ArgumentError, 'Missing name' unless name
        raise ArgumentError, 'Missing plugin_name' unless plugin_name
        raise ArgumentError, 'Missing block' unless block

        @name = name
        @plugin_name = plugin_name
        @block = block
      end
    end

    class << self
      # @return [Hash{Symbol => Array<Hook>}] The list of the hooks that are
      #         registered for each hook name.
      #
      attr_reader :registrations

      # Registers a block for the hook with the given name.
      #
      # @param  [String] plugin_name
      #         The name of the plugin the hook comes from.
      #
      # @param  [Symbol] hook_name
      #         The name of the notification.
      #
      # @param  [Proc] block
      #         The block.
      #
      def register(plugin_name, hook_name, &block)
        @registrations ||= {}
        @registrations[hook_name] ||= []
        @registrations[hook_name] << Hook.new(hook_name, plugin_name, block)
      end

      # Returns all the hooks to run for the given event name
      # and set of whitelisted plugins
      #
      # @see #run
      #
      # @return [Array<Hook>] the hooks to run
      #
      def hooks_to_run(name, whitelisted_plugins = nil)
        return [] unless registrations
        hooks = registrations.fetch(name, [])
        return hooks unless whitelisted_plugins
        hooks.select { |hook| whitelisted_plugins.key?(hook.plugin_name) }
      end

      # Runs all the registered blocks for the hook with the given name.
      #
      # @param  [Symbol] name
      #         The name of the hook.
      #
      # @param  [Object] context
      #         The context object which should be passed to the blocks.
      #
      # @param  [Hash<String, Hash>] whitelisted_plugins
      #         The plugins that should be run, in the form of a hash keyed by
      #         plugin name, where the values are the custom options that should
      #         be passed to the hook's block if it supports taking a second
      #         argument.
      #
      def run(name, context, whitelisted_plugins = nil)
        raise ArgumentError, 'Missing name' unless name
        raise ArgumentError, 'Missing options' unless context

        hooks = hooks_to_run(name, whitelisted_plugins)
        return if hooks.empty?

        UI.message "- Running #{name.to_s.tr('_', ' ')} hooks" do
          hooks.each do |hook|
            UI.message "- #{hook.plugin_name} from " \
                        "`#{hook.block.source_location.first}`" do
              block = hook.block
              if block.arity > 1
                user_options = whitelisted_plugins[hook.plugin_name]
                user_options = user_options.with_indifferent_access if user_options
                block.call(context, user_options)
              else
                block.call(context)
              end
            end
          end
        end
      end
    end
  end
end
