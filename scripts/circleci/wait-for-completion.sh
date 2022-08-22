SECONDS=0

MAX_WAIT=1800 # 30 mins

function waitFor {
  echo "Waiting for $1 to complete"
  sleep 1
  SECONDS=$(($SECONDS + 1))

  if [[ SECONDS -ge MAX_WAIT ]]; then
    echo "Build for $1 took too long to run"
    exit 1
  fi
}


while [[ ! -f "/tmp/build-completed-$1" ]];
do
  waitFor $1
done
SECONDS=0
while [[ ! -f "/tmp/build-completed-$2" ]];
do
  waitFor $2
done
