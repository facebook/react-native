import os
import plistlib
import string

FULL_PRODUCT_NAME = 'FULL_PRODUCT_NAME'
SDK_NAMES = 'SDK_NAMES'
TARGET_TEMP_DIR = 'TARGET_TEMP_DIR'
PROJECT_DIR = 'PROJECT_DIR'

def modify_xcuitest_entitlements():
    """
    This function is meant to be executed from a run script phase of an XCUITest target. 
    It takes in as input build environment variables and modifies the entitlements file
    (productname.xcent) to allow specific sandbox exceptions that allow the tests to run.
    Specifically, it allows the test code to read and write files in the 
    project folder which is needed for recording and comparing of screenshot files.

    You can validate that the resulting Runner app has the correct entitlement by running the following command:
        `codesign -d --entitlements - <Path to Target-Runner.app>`
    """

    # ENV var validation
    assert os.environ.get('PRODUCT_TYPE') == 'com.apple.product-type.bundle.ui-testing', \
                "This script only works for XCUITest targets. This is NOT an XCUITest target."

    required_env_vars = [FULL_PRODUCT_NAME,
                        SDK_NAMES,
                        TARGET_TEMP_DIR,
                        PROJECT_DIR]

    for env_var in required_env_vars:
        assert os.environ.get(env_var), "Required environment variable %r is missing or blank." % env_var

    full_product_name = os.environ[FULL_PRODUCT_NAME]
    sdk_names = os.environ[SDK_NAMES]
    target_temp_dir = os.environ[TARGET_TEMP_DIR]
    project_dir = os.environ[PROJECT_DIR]
    
    if 'macos' in sdk_names:
        entitlements_plist_path = os.path.join(target_temp_dir, '%s.xcent' % full_product_name)

        print "Enlistments plist path: %s" % entitlements_plist_path

        entitlements_plist = plistlib.readPlist(entitlements_plist_path)

        assert entitlements_plist, "Enlistments plist file could not be read."

        temporary_exceptions_global_key = "com.apple.security.temporary-exception.files.absolute-path.read-write"
        read_write_path = project_dir + "/" # trailing / is necessary
        entitlements_plist[temporary_exceptions_global_key] = [read_write_path]

        plistlib.writePlist(entitlements_plist, entitlements_plist_path)

        print "Success"

if __name__ == '__main__':
    modify_xcuitest_entitlements()

