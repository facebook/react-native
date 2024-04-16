# frozen_string_literal: false
module REXML
  # A template for stream parser listeners.
  # Note that the declarations (attlistdecl, elementdecl, etc) are trivially
  # processed; REXML doesn't yet handle doctype entity declarations, so you
  # have to parse them out yourself.
  module StreamListener
    # Called when a tag is encountered.
    # @p name the tag name
    # @p attrs an array of arrays of attribute/value pairs, suitable for
    # use with assoc or rassoc.  IE, <tag attr1="value1" attr2="value2">
    # will result in
    # tag_start( "tag", # [["attr1","value1"],["attr2","value2"]])
    def tag_start name, attrs
    end
    # Called when the end tag is reached.  In the case of <tag/>, tag_end
    # will be called immediately after tag_start
    # @p the name of the tag
    def tag_end name
    end
    # Called when text is encountered in the document
    # @p text the text content.
    def text text
    end
    # Called when an instruction is encountered.  EG: <?xsl sheet='foo'?>
    # @p name the instruction name; in the example, "xsl"
    # @p instruction the rest of the instruction.  In the example,
    # "sheet='foo'"
    def instruction name, instruction
    end
    # Called when a comment is encountered.
    # @p comment The content of the comment
    def comment comment
    end
    # Handles a doctype declaration. Any attributes of the doctype which are
    # not supplied will be nil.  # EG, <!DOCTYPE me PUBLIC "foo" "bar">
    # @p name the name of the doctype; EG, "me"
    # @p pub_sys "PUBLIC", "SYSTEM", or nil.  EG, "PUBLIC"
    # @p long_name the supplied long name, or nil.  EG, "foo"
    # @p uri the uri of the doctype, or nil.  EG, "bar"
    def doctype name, pub_sys, long_name, uri
    end
    # Called when the doctype is done
    def doctype_end
    end
    # If a doctype includes an ATTLIST declaration, it will cause this
    # method to be called.  The content is the declaration itself, unparsed.
    # EG, <!ATTLIST el attr CDATA #REQUIRED> will come to this method as "el
    # attr CDATA #REQUIRED".  This is the same for all of the .*decl
    # methods.
    def attlistdecl element_name, attributes, raw_content
    end
    # <!ELEMENT ...>
    def elementdecl content
    end
    # <!ENTITY ...>
    # The argument passed to this method is an array of the entity
    # declaration.  It can be in a number of formats, but in general it
    # returns (example, result):
    #  <!ENTITY % YN '"Yes"'>
    #  ["YN", "\"Yes\"", "%"]
    #  <!ENTITY % YN 'Yes'>
    #  ["YN", "Yes", "%"]
    #  <!ENTITY WhatHeSaid "He said %YN;">
    #  ["WhatHeSaid", "He said %YN;"]
    #  <!ENTITY open-hatch SYSTEM "http://www.textuality.com/boilerplate/OpenHatch.xml">
    #  ["open-hatch", "SYSTEM", "http://www.textuality.com/boilerplate/OpenHatch.xml"]
    #  <!ENTITY open-hatch PUBLIC "-//Textuality//TEXT Standard open-hatch boilerplate//EN" "http://www.textuality.com/boilerplate/OpenHatch.xml">
    #  ["open-hatch", "PUBLIC", "-//Textuality//TEXT Standard open-hatch boilerplate//EN", "http://www.textuality.com/boilerplate/OpenHatch.xml"]
    #  <!ENTITY hatch-pic SYSTEM "../grafix/OpenHatch.gif" NDATA gif>
    #  ["hatch-pic", "SYSTEM", "../grafix/OpenHatch.gif", "gif"]
    def entitydecl content
    end
    # <!NOTATION ...>
    def notationdecl content
    end
    # Called when %foo; is encountered in a doctype declaration.
    # @p content "foo"
    def entity content
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
    def xmldecl version, encoding, standalone
    end
  end
end
