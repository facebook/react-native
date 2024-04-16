# frozen_string_literal: true
module Ethon
  module Curl
    # :nodoc:
    VERSION_NOW = 3

    # Flag. Initialize SSL.
    GLOBAL_SSL     = 0x01
    # Flag. Initialize win32 socket libraries.
    GLOBAL_WIN32   = 0x02
    # Flag. Initialize everything possible.
    GLOBAL_ALL     = (GLOBAL_SSL | GLOBAL_WIN32)
    # Flag. Initialize everything by default.
    GLOBAL_DEFAULT = GLOBAL_ALL

    # :nodoc:
    EasyCode = enum(:easy_code, easy_codes)
    # :nodoc:
    MultiCode = enum(:multi_code, multi_codes)

    # :nodoc:
    EasyOption = enum(:easy_option, easy_options(:enum).to_a.flatten)
    # :nodoc:
    MultiOption = enum(:multi_option, multi_options(:enum).to_a.flatten)

    # Used by curl_debug_callback when setting CURLOPT_DEBUGFUNCTION
    # https://github.com/bagder/curl/blob/master/include/curl/curl.h#L378 for details
    DebugInfoType = enum(:debug_info_type, debug_info_types)

    # :nodoc:
    InfoType = enum(info_types.to_a.flatten)

    # Info details, refer
    # https://github.com/bagder/curl/blob/master/src/tool_writeout.c#L66 for details
    Info = enum(:info, infos.to_a.flatten)

    # Form options, used by FormAdd for temporary storage, refer
    # https://github.com/bagder/curl/blob/master/lib/formdata.h#L51 for details
    FormOption = enum(:form_option, form_options)

    # :nodoc:
    MsgCode = enum(:msg_code, msg_codes)

    VERSION_IPV6 = (1<<0)  # IPv6-enabled
    VERSION_KERBEROS4 = (1<<1)  # kerberos auth is supported
    VERSION_SSL = (1<<2)  # SSL options are present
    VERSION_LIBZ = (1<<3)  # libz features are present
    VERSION_NTLM = (1<<4)  # NTLM auth is supported
    VERSION_GSSNEGOTIATE = (1<<5) # Negotiate auth supp
    VERSION_DEBUG = (1<<6)  # built with debug capabilities
    VERSION_ASYNCHDNS = (1<<7)  # asynchronous dns resolves
    VERSION_SPNEGO = (1<<8)  # SPNEGO auth is supported
    VERSION_LARGEFILE = (1<<9)  # supports files bigger than 2GB
    VERSION_IDN = (1<<10) # International Domain Names support
    VERSION_SSPI = (1<<11) # SSPI is supported
    VERSION_CONV = (1<<12) # character conversions supported
    VERSION_CURLDEBUG = (1<<13) # debug memory tracking supported
    VERSION_TLSAUTH_SRP = (1<<14) # TLS-SRP auth is supported
    VERSION_NTLM_WB = (1<<15) # NTLM delegating to winbind helper
    VERSION_HTTP2 = (1<<16) # HTTP2 support built
    VERSION_GSSAPI = (1<<17) # GSS-API is supported

    SOCKET_BAD = -1
    SOCKET_TIMEOUT = SOCKET_BAD

    PollAction = enum(:poll_action, [
      :none,
      :in,
      :out,
      :inout,
      :remove
    ])

    SocketReadiness = bitmask(:socket_readiness, [
      :in,  # CURL_CSELECT_IN  - 0x01 (bit 0)
      :out, # CURL_CSELECT_OUT - 0x02 (bit 1)
      :err, # CURL_CSELECT_ERR - 0x04 (bit 2)
    ])
  end
end
