# frozen_string_literal: true

require "active_support/concern"

class Module
  # = Bite-sized separation of concerns
  #
  # We often find ourselves with a medium-sized chunk of behavior that we'd
  # like to extract, but only mix in to a single class.
  #
  # Extracting a plain old Ruby object to encapsulate it and collaborate or
  # delegate to the original object is often a good choice, but when there's
  # no additional state to encapsulate or we're making DSL-style declarations
  # about the parent class, introducing new collaborators can obfuscate rather
  # than simplify.
  #
  # The typical route is to just dump everything in a monolithic class, perhaps
  # with a comment, as a least-bad alternative. Using modules in separate files
  # means tedious sifting to get a big-picture view.
  #
  # = Dissatisfying ways to separate small concerns
  #
  # == Using comments:
  #
  #   class Todo < ApplicationRecord
  #     # Other todo implementation
  #     # ...
  #
  #     ## Event tracking
  #     has_many :events
  #
  #     before_create :track_creation
  #
  #     private
  #       def track_creation
  #         # ...
  #       end
  #   end
  #
  # == With an inline module:
  #
  # Noisy syntax.
  #
  #   class Todo < ApplicationRecord
  #     # Other todo implementation
  #     # ...
  #
  #     module EventTracking
  #       extend ActiveSupport::Concern
  #
  #       included do
  #         has_many :events
  #         before_create :track_creation
  #       end
  #
  #       private
  #         def track_creation
  #           # ...
  #         end
  #     end
  #     include EventTracking
  #   end
  #
  # == Mix-in noise exiled to its own file:
  #
  # Once our chunk of behavior starts pushing the scroll-to-understand-it
  # boundary, we give in and move it to a separate file. At this size, the
  # increased overhead can be a reasonable tradeoff even if it reduces our
  # at-a-glance perception of how things work.
  #
  #   class Todo < ApplicationRecord
  #     # Other todo implementation
  #     # ...
  #
  #     include TodoEventTracking
  #   end
  #
  # = Introducing Module#concerning
  #
  # By quieting the mix-in noise, we arrive at a natural, low-ceremony way to
  # separate bite-sized concerns.
  #
  #   class Todo < ApplicationRecord
  #     # Other todo implementation
  #     # ...
  #
  #     concerning :EventTracking do
  #       included do
  #         has_many :events
  #         before_create :track_creation
  #       end
  #
  #       private
  #         def track_creation
  #           # ...
  #         end
  #     end
  #   end
  #
  #   Todo.ancestors
  #   # => [Todo, Todo::EventTracking, ApplicationRecord, Object]
  #
  # This small step has some wonderful ripple effects. We can
  # * grok the behavior of our class in one glance,
  # * clean up monolithic junk-drawer classes by separating their concerns, and
  # * stop leaning on protected/private for crude "this is internal stuff" modularity.
  #
  # === Prepending concerning
  #
  # <tt>concerning</tt> supports a <tt>prepend: true</tt> argument which will <tt>prepend</tt> the
  # concern instead of using <tt>include</tt> for it.
  module Concerning
    # Define a new concern and mix it in.
    def concerning(topic, prepend: false, &block)
      method = prepend ? :prepend : :include
      __send__(method, concern(topic, &block))
    end

    # A low-cruft shortcut to define a concern.
    #
    #   concern :EventTracking do
    #     ...
    #   end
    #
    # is equivalent to
    #
    #   module EventTracking
    #     extend ActiveSupport::Concern
    #
    #     ...
    #   end
    def concern(topic, &module_definition)
      const_set topic, Module.new {
        extend ::ActiveSupport::Concern
        module_eval(&module_definition)
      }
    end
  end
  include Concerning
end
