echo $AGENT_BUILDDIRECTORY

SDX_PATH=$AGENT_BUILDDIRECTORY/sdx

echo $SDX_PATH

rm -rf $SDX_PATH

git -c http.https://office.visualstudio.com.extraheader="AUTHORIZATION: bearer $SYSTEM_ACCESSTOKEN" clone https://office.visualstudio.com/ISS/_git/sdx-platform $SDX_PATH