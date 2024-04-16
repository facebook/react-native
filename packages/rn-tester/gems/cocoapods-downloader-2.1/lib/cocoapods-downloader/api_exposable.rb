module Pod
  module Downloader
    module APIExposable
      def expose_api(mod = nil, &block)
        if mod.nil?
          if block.nil?
            raise "Either a module or a block that's used to create a module is required."
          else
            mod = Module.new(&block)
          end
        elsif mod && block
          raise 'Only a module *or* is required, not both.'
        end
        include mod
        # TODO: Try to find a nicer way to do this
        # See https://github.com/CocoaPods/cocoapods-downloader/pull/57
        extend mod
      end

      alias override_api expose_api
    end
  end
end
