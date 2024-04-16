# frozen_string_literal: true
module Ethon
  module Curls

    # This module contains the available options for forms.
    module FormOptions

      # Form options, used by FormAdd for temporary storage, refer
      # https://github.com/bagder/curl/blob/master/lib/formdata.h#L51 for details
      def form_options
        [
          :none,
          :copyname,
          :ptrname,
          :namelength,
          :copycontents,
          :ptrcontents,
          :contentslength,
          :filecontent,
          :array,
          :obsolete,
          :file,
          :buffer,
          :bufferptr,
          :bufferlength,
          :contenttype,
          :contentheader,
          :filename,
          :end,
          :obsolete2,
          :stream,
          :last
        ]
      end
    end
  end
end
