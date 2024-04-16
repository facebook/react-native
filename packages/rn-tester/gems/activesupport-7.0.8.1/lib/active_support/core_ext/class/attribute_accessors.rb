# frozen_string_literal: true

# cattr_* became mattr_* aliases in 7dfbd91b0780fbd6a1dd9bfbc176e10894871d2d,
# but we keep this around for libraries that directly require it knowing they
# want cattr_*. No need to deprecate.
require "active_support/core_ext/module/attribute_accessors"
