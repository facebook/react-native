const execSync = require("child_process").execSync;

function publishDocker() {
  const now = new Date()
  const finaltag = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`
  console.log(finaltag);
  const cmd =`
docker login -u -u ${process.env.DOCKER_USER} -p ${process.env.DOCKER_PASS}
docker build -t gengjiawen/react-native:${finaltag} -f Dockerfile.android-base .
  `
  cmd.trim().split().map(i => {
    const cmd = i.trim();
    if (cmd) {
      console.log(cmd);
      const output = execSync(cmd)
      console.log(output.toString());
    }
  })
}

publishDocker()
