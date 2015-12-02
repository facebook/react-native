# Ensure that methods from LollipopSysdeps don't get inlined. LollipopSysdeps.fallocate references
# an exception that isn't present prior to Lollipop, which trips up the verifier if the class is
# loaded on a pre-Lollipop OS.
-keep class com.facebook.soloader.SysUtil$LollipopSysdeps {
    public <methods>;
}
