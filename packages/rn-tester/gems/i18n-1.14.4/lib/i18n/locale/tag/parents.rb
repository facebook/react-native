module I18n
  module Locale
    module Tag
      module Parents
        def parent
          @parent ||=
            begin
              segs = to_a
              segs.compact!
              segs.length > 1 ? self.class.tag(*segs[0..(segs.length - 2)].join('-')) : nil
            end
        end

        def self_and_parents
          @self_and_parents ||= [self].concat parents
        end

        def parents
          @parents ||= parent ? [parent].concat(parent.parents) : []
        end
      end
    end
  end
end
