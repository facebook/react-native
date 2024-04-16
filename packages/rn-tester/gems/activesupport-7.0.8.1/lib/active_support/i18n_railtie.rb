# frozen_string_literal: true

require "active_support"
require "active_support/core_ext/array/wrap"

# :enddoc:

module I18n
  class Railtie < Rails::Railtie
    config.i18n = ActiveSupport::OrderedOptions.new
    config.i18n.railties_load_path = []
    config.i18n.load_path = []
    config.i18n.fallbacks = ActiveSupport::OrderedOptions.new

    config.eager_load_namespaces << I18n

    # Set the i18n configuration after initialization since a lot of
    # configuration is still usually done in application initializers.
    config.after_initialize do |app|
      I18n::Railtie.initialize_i18n(app)
    end

    # Trigger i18n config before any eager loading has happened
    # so it's ready if any classes require it when eager loaded.
    config.before_eager_load do |app|
      I18n::Railtie.initialize_i18n(app)
    end

    @i18n_inited = false

    # Setup i18n configuration.
    def self.initialize_i18n(app)
      return if @i18n_inited

      fallbacks = app.config.i18n.delete(:fallbacks)

      # Avoid issues with setting the default_locale by disabling available locales
      # check while configuring.
      enforce_available_locales = app.config.i18n.delete(:enforce_available_locales)
      enforce_available_locales = I18n.enforce_available_locales if enforce_available_locales.nil?
      I18n.enforce_available_locales = false

      reloadable_paths = []
      app.config.i18n.each do |setting, value|
        case setting
        when :railties_load_path
          reloadable_paths = value
          app.config.i18n.load_path.unshift(*value.flat_map(&:existent))
        when :load_path
          I18n.load_path += value
        when :raise_on_missing_translations
          forward_raise_on_missing_translations_config(app)
        else
          I18n.public_send("#{setting}=", value)
        end
      end

      init_fallbacks(fallbacks) if fallbacks && validate_fallbacks(fallbacks)

      # Restore available locales check so it will take place from now on.
      I18n.enforce_available_locales = enforce_available_locales

      directories = watched_dirs_with_extensions(reloadable_paths)
      reloader = app.config.file_watcher.new(I18n.load_path.dup, directories) do
        I18n.load_path.keep_if { |p| File.exist?(p) }
        I18n.load_path |= reloadable_paths.flat_map(&:existent)
      end

      app.reloaders << reloader
      app.reloader.to_run do
        reloader.execute_if_updated { require_unload_lock! }
      end
      reloader.execute

      @i18n_inited = true
    end

    def self.forward_raise_on_missing_translations_config(app)
      ActiveSupport.on_load(:action_view) do
        ActionView::Helpers::TranslationHelper.raise_on_missing_translations = app.config.i18n.raise_on_missing_translations
      end

      ActiveSupport.on_load(:action_controller) do
        AbstractController::Translation.raise_on_missing_translations = app.config.i18n.raise_on_missing_translations
      end
    end

    def self.include_fallbacks_module
      I18n.backend.class.include(I18n::Backend::Fallbacks)
    end

    def self.init_fallbacks(fallbacks)
      include_fallbacks_module

      args = \
        case fallbacks
        when ActiveSupport::OrderedOptions
          [*(fallbacks[:defaults] || []) << fallbacks[:map]].compact
        when Hash, Array
          Array.wrap(fallbacks)
        else # TrueClass
          [I18n.default_locale]
        end

      I18n.fallbacks = I18n::Locale::Fallbacks.new(*args)
    end

    def self.validate_fallbacks(fallbacks)
      case fallbacks
      when ActiveSupport::OrderedOptions
        !fallbacks.empty?
      when TrueClass, Array, Hash
        true
      else
        raise "Unexpected fallback type #{fallbacks.inspect}"
      end
    end

    def self.watched_dirs_with_extensions(paths)
      paths.each_with_object({}) do |path, result|
        result[path.absolute_current] = path.extensions
      end
    end
  end
end
