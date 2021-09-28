PATCHES=BuildAndThirdPartyFixes DialogModule UIEditText UIScroll UITextFont Accessibility OfficeRNHost SecurityFixes V8Integration AnnotationProcessing
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

PATCHSTORE=$DIR/../patches-droid-office-grouped
LOGFOLDER=$DIR/../logs

RUNFROMFORK=1
if [["$RUNFROMFORK" == "1"]]; then
  TARGETREPO=$DIR/../..
else then
  TARGETREPO=/mnt/e/github/ms-react-native-forpatch
)

RUNBUNDLE=1
if [["$RUNBUNDLE" == "1"]]; then
  SCRIPT=$DIR/../bundle/bundle.js
else then
# Make sure to yarn install.
  SCRIPT=$DIR/../dist/index.js
)

echo "Applying patches .."
node $SCRIPT patch $TARGETREPO $PATCHES --patch-store $PATCHSTORE --log-folder $LOGFOLDER