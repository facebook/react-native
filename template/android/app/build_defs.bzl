"""Helper definitions to glob .aar and .jar targets"""

def create_aar_targets(aarfiles):
    for aarfile in aarfiles:
        name = "aars__" + aarfile[aarfile.rindex("/") + 1:aarfile.rindex(".aar")]
        lib_deps.append(":" + name)
        android_prebuilt_aar(
            name = name,
            aar = aarfile,
        )

def create_jar_targets(jarfiles):
    for jarfile in jarfiles:
        name = "jars__" + jarfile[jarfile.rindex("/") + 1:jarfile.rindex(".jar")]
        lib_deps.append(":" + name)
        prebuilt_jar(
            name = name,
            binary_jar = jarfile,
        )
