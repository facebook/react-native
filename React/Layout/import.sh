LAYOUT_C=`curl https://raw.githubusercontent.com/facebook/css-layout/master/src/Layout.c`
LAYOUT_H=`curl https://raw.githubusercontent.com/facebook/css-layout/master/src/Layout.h`

REPLACE_STRING="*
 * WARNING: You should not modify this file directly. Instead:
 * 1) Go to https://github.com/facebook/css-layout
 * 2) Make a pull request and get it merged
 * 3) Run import.sh to copy Layout.* to react-native-github
 */"

LAYOUT_C=${LAYOUT_C/\*\//$REPLACE_STRING}
LAYOUT_H=${LAYOUT_H/\*\//$REPLACE_STRING}

echo "$LAYOUT_C" > Layout.c
echo "$LAYOUT_H" > Layout.h
