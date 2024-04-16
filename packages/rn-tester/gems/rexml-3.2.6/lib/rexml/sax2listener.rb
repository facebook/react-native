# frozen_string_literal: false
module REXML
  # A template for stream parser listeners.
  # Note that the declarations (attlistdecl, elementdecl, etc) are trivially
  # processed; REXML doesn't yet handle doctype entity declarations, so you
  # have to parse them out yourself.
  # === Missing methods from SAX2
  #  ignorable_whitespace
  # === Methods extending SAX2
  # +WARNING+
  # These methods are certainly going to change, until DTDs are fully
  # supported.  Be aware of this.
  #  start_document
  #  end_document
  #  doctype
  #  elementdecl
  #  attlistdecl
  #  entitydecl
  #  notationdecl
  #  cdata
  #  xmldecl
  #  comment
  module SAX2Listener
    def start_document
    end
    def end_document
    end
    def start_prefix_mapping prefix, uri
    end
    def end_prefix_mapping prefix
    end
    def start_element uri, localname, qname, attributes
    end
    def end_element uri, localname, qname
    end
    def characters text
    end
    def processing_instruction target, data
    end
    # Handles a doctype declaration. Any attributes of the doctype which are
    # not supplied will be nil.  # EG, <!DOCTYPE me PUBLIC "foo" "bar">
    # @p name the name of the doctype; EG, "me"
    # @p pub_sys "PUBLIC", "SYSTEM", or nil.  EG, "PUBLIC"
    # @p long_name the supplied long name, or nil.  EG, "foo"
    # @p uri the uri of the doctype, or nil.  EG, "bar"
    def doctype name, pub_sys, long_name, uri
    end
    # If a doctype includes an ATTLIST declaration, it will cause this
    # method to be called.  The content is the declaration itself, unparsed.
    # EG, <!ATTLIST el attr CDATA #REQUIRED> will come to this method as "el
    # attr CDATA #REQUIRED".  This is the same for all of the .*decl
    # methods.
    def attlistdecl(element, pairs, contents)
    end
    # <!ELEMENT ...>
    def elementdecl content
    end
    # <!ENTITY ...>
    # The argument passed to this method is an array of the entity
    # declaration.  It can be in a number of formats, but in general it
    # returns (example, result):
    #  <!ENTITY % YN '"Yes"'>
    #  ["%", "YN", "\"Yes\""]
    #  <!ENTITY % YN 'Yes'>
    #  ["%", "YN", "Yes"]
    #  <!ENTITY WhatHeSaid "He said %YN;">
    #  ["WhatHeSaid", "He said %YN;"]
    #  <!ENTITY open-hatch SYSTEM "http://www.textuality.com/boilerplate/OpenHatch.xml">
    #  ["open-hatch", "SYSTEM", "http://www.textuality.com/boilerplate/OpenHatch.xml"]
    #  <!ENTITY open-hatch PUBLIC "-//Textuality//TEXT Standard open-hatch boilerplate//EN" "http://www.textuality.com/boilerplate/OpenHatch.xml">
    # ["open-hatch", "PUBLIC", "-//Textuality//TEXT Standard open-hatch boilerplate//EN", "http://www.textuality.com/boilerplate/OpenHatch.xml"]
    #  <!ENTITY hatch-pic SYSTEM "../grafix/OpenHatch.gif" NDATA gif>
    #  ["hatch-pic", "SYSTEM", "../grafix/OpenHatch.gif", "NDATA", "gif"]
    def entitydecl declaration
    end
    # <!NOTATION ...>
    def notationdecl name, public_or_system, public_id, system_id
    end
    # Called when <![CDATA[ ... ]]> is encountered in a document.
    # @p content "..."
    def cdata content
    end
    # Called when an XML PI is encountered in the document.
    # EG: <?xml version="1.0" encoding="utf"?>
    # @p version the version attribute value.  EG, "1.0"
    # @p encoding the encoding attribute value, or nil.  EG, "utf"
    # @p standalone the standalone attribute value, or nil.  EG, nil
    # @p spaced the declaration is followed by a line break
    def xmldecl version, encoding, standalone
    end
    # Called when a comment is encountered.
    # @p comment The content of the comment
    def comment comment
    end
    def progress position
    end
  end
end
