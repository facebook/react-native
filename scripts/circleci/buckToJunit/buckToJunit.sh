#!/bin/bash

# Get script directory
prog="$0"
while [ -h "${prog}" ]; do
    newProg=`/bin/ls -ld "${prog}"`
    newProg=`expr "${newProg}" : ".* -> \(.*\)$"`
    if expr "x${newProg}" : 'x/' >/dev/null; then
        prog="${newProg}"
    else
        progdir=`dirname "${prog}"`
        prog="${progdir}/${newProg}"
    fi
done
DIR=`dirname $prog`

# We download saxon from Maven Central rather than copying it over.
curl https://repo1.maven.org/maven2/net/sf/saxon/Saxon-HE/9.7.0-11/Saxon-HE-9.7.0-11.jar --output $DIR/saxon.jar

saxonJar="$DIR/saxon.jar"
buckToJunitXsl="$DIR/buckToJunit.xsl"

# Perform conversion
java -jar $saxonJar -xsl:$buckToJunitXsl -s:$1 -o:$2