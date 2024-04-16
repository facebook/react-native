# Simple Locale tag implementation that computes subtags by simply splitting
# the locale tag at '-' occurrences.
module I18n
  module Locale
    module Tag
      class Simple
        class << self
          def tag(tag)
            new(tag)
          end
        end

        include Parents

        attr_reader :tag

        def initialize(*tag)
          @tag = tag.join('-').to_sym
        end

        def subtags
          @subtags = tag.to_s.split('-').map!(&:to_s)
        end

        def to_sym
          tag
        end

        def to_s
          tag.to_s
        end

        def to_a
          subtags
        end
      end
    end
  end
end
