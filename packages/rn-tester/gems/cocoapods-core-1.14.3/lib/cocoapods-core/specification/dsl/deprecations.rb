module Pod
  class Specification
    module DSL
      # Provides warning and errors for the deprecated attributes of the DSL.
      #
      module Deprecations
        DSL.attribute :xcconfig,
                      :container => Hash,
                      :inherited => true

        def xcconfig=(value)
          self.pod_target_xcconfig = value
          self.user_target_xcconfig = value
          CoreUI.warn "[#{self}] `xcconfig` has been split into "\
            '`pod_target_xcconfig` and `user_target_xcconfig`.'
        end
      end
    end
  end
end
