# Allow users to override the namespace we define our application's classes in
# Arg $1 is the default namespace to use if --enable-namespace isn't present.

# In general, $1 should be 'google', so we put all our exported symbols in a
# unique namespace that is not likely to conflict with anyone else.  However,
# when it makes sense -- for instance, when publishing stl-like code -- you
# may want to go with a different default, like 'std'.

AC_DEFUN([AC_DEFINE_GOOGLE_NAMESPACE],
  [google_namespace_default=[$1]
   AC_ARG_ENABLE(namespace, [  --enable-namespace=FOO to define these Google
                             classes in the FOO namespace. --disable-namespace
                             to define them in the global namespace. Default
                             is to define them in namespace $1.],
                 [case "$enableval" in
                    yes) google_namespace="$google_namespace_default" ;;
                     no) google_namespace="" ;;
                      *) google_namespace="$enableval" ;;
                  esac],
                 [google_namespace="$google_namespace_default"])
   if test -n "$google_namespace"; then
     ac_google_namespace="$google_namespace"
     ac_google_start_namespace="namespace $google_namespace {"
     ac_google_end_namespace="}"
   else
     ac_google_namespace=""
     ac_google_start_namespace=""
     ac_google_end_namespace=""
   fi
   AC_DEFINE_UNQUOTED(GOOGLE_NAMESPACE, $ac_google_namespace,
                      Namespace for Google classes)
   AC_DEFINE_UNQUOTED(_START_GOOGLE_NAMESPACE_, $ac_google_start_namespace,
                      Puts following code inside the Google namespace)
   AC_DEFINE_UNQUOTED(_END_GOOGLE_NAMESPACE_,  $ac_google_end_namespace,
                      Stops putting the code inside the Google namespace)
])
