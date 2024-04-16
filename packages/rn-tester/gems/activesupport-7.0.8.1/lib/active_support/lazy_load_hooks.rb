# frozen_string_literal: true

module ActiveSupport
  # LazyLoadHooks allows Rails to lazily load a lot of components and thus
  # making the app boot faster. Because of this feature now there is no need to
  # require <tt>ActiveRecord::Base</tt> at boot time purely to apply
  # configuration. Instead a hook is registered that applies configuration once
  # <tt>ActiveRecord::Base</tt> is loaded. Here <tt>ActiveRecord::Base</tt> is
  # used as example but this feature can be applied elsewhere too.
  #
  # Here is an example where on_load method is called to register a hook.
  #
  #   initializer 'active_record.initialize_timezone' do
  #     ActiveSupport.on_load(:active_record) do
  #       self.time_zone_aware_attributes = true
  #       self.default_timezone = :utc
  #     end
  #   end
  #
  # When the entirety of +ActiveRecord::Base+ has been
  # evaluated then run_load_hooks is invoked. The very last line of
  # +ActiveRecord::Base+ is:
  #
  #   ActiveSupport.run_load_hooks(:active_record, ActiveRecord::Base)
  #
  # run_load_hooks will then execute all the hooks that were registered
  # with the on_load method. In the case of the above example, it will
  # execute the block of code that is in the +initializer+.
  #
  # Registering a hook that has already run results in that hook executing
  # immediately. This allows hooks to be nested for code that relies on
  # multiple lazily loaded components:
  #
  #   initializer "action_text.renderer" do
  #     ActiveSupport.on_load(:action_controller_base) do
  #       ActiveSupport.on_load(:action_text_content) do
  #         self.default_renderer = Class.new(ActionController::Base).renderer
  #       end
  #     end
  #   end
  module LazyLoadHooks
    def self.extended(base) # :nodoc:
      base.class_eval do
        @load_hooks = Hash.new { |h, k| h[k] = [] }
        @loaded     = Hash.new { |h, k| h[k] = [] }
        @run_once   = Hash.new { |h, k| h[k] = [] }
      end
    end

    # Declares a block that will be executed when a Rails component is fully
    # loaded. If the component has already loaded, the block is executed
    # immediately.
    #
    # Options:
    #
    # * <tt>:yield</tt> - Yields the object that run_load_hooks to +block+.
    # * <tt>:run_once</tt> - Given +block+ will run only once.
    def on_load(name, options = {}, &block)
      @loaded[name].each do |base|
        execute_hook(name, base, options, block)
      end

      @load_hooks[name] << [block, options]
    end

    # Executes all blocks registered to +name+ via on_load, using +base+ as the
    # evaluation context.
    #
    #   ActiveSupport.run_load_hooks(:active_record, ActiveRecord::Base)
    #
    # In the case of the above example, it will execute all hooks registered
    # for +:active_record+ within the class +ActiveRecord::Base+.
    def run_load_hooks(name, base = Object)
      @loaded[name] << base
      @load_hooks[name].each do |hook, options|
        execute_hook(name, base, options, hook)
      end
    end

    private
      def with_execution_control(name, block, once)
        unless @run_once[name].include?(block)
          @run_once[name] << block if once

          yield
        end
      end

      def execute_hook(name, base, options, block)
        with_execution_control(name, block, options[:run_once]) do
          if options[:yield]
            block.call(base)
          else
            if base.is_a?(Module)
              base.class_eval(&block)
            else
              base.instance_eval(&block)
            end
          end
        end
      end
  end

  extend LazyLoadHooks
end
