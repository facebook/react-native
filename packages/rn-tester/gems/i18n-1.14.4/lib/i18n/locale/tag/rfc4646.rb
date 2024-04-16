# RFC 4646/47 compliant Locale tag implementation that parses locale tags to
# subtags such as language, script, region, variant etc.
#
# For more information see by http://en.wikipedia.org/wiki/IETF_language_tag
#
# Rfc4646::Parser does not implement grandfathered tags.

module I18n
  module Locale
    module Tag
      RFC4646_SUBTAGS = [ :language, :script, :region, :variant, :extension, :privateuse, :grandfathered ]
      RFC4646_FORMATS = { :language => :downcase, :script => :capitalize, :region => :upcase, :variant => :downcase }

      class Rfc4646 < Struct.new(*RFC4646_SUBTAGS)
        class << self
          # Parses the given tag and returns a Tag instance if it is valid.
          # Returns false if the given tag is not valid according to RFC 4646.
          def tag(tag)
            matches = parser.match(tag)
            new(*matches) if matches
          end

          def parser
            @@parser ||= Rfc4646::Parser
          end

          def parser=(parser)
            @@parser = parser
          end
        end

        include Parents

        RFC4646_FORMATS.each do |name, format|
          define_method(name) { self[name].send(format) unless self[name].nil? }
        end

        def to_sym
          to_s.to_sym
        end

        def to_s
          @tag ||= to_a.compact.join("-")
        end

        def to_a
          members.collect { |attr| self.send(attr) }
        end

        module Parser
          PATTERN = %r{\A(?:
            ([a-z]{2,3}(?:(?:-[a-z]{3}){0,3})?|[a-z]{4}|[a-z]{5,8}) # language
            (?:-([a-z]{4}))?                                        # script
            (?:-([a-z]{2}|\d{3}))?                                  # region
            (?:-([0-9a-z]{5,8}|\d[0-9a-z]{3}))*                     # variant
            (?:-([0-9a-wyz](?:-[0-9a-z]{2,8})+))*                   # extension
            (?:-(x(?:-[0-9a-z]{1,8})+))?|                           # privateuse subtag
            (x(?:-[0-9a-z]{1,8})+)|                                 # privateuse tag
            /* ([a-z]{1,3}(?:-[0-9a-z]{2,8}){1,2}) */               # grandfathered
            )\z}xi

          class << self
            def match(tag)
              c = PATTERN.match(tag.to_s).captures
              c[0..4] << (c[5].nil? ? c[6] : c[5])  << c[7] # TODO c[7] is grandfathered, throw a NotImplemented exception here?
            rescue
              false
            end
          end
        end
      end
    end
  end
end
