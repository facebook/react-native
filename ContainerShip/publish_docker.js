const execSync = require("child_process").execSync;

function publishDocker() {
  const now = new Date()
  const finaltag = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`
  const cmd =`
docker login -u ${process.env.DOCKER_USER} -p ${process.env.DOCKER_PASS}
docker build -t gengjiawen/react-native:${finaltag} -f Dockerfile.android-base .
docker tag gengjiawen/react-native:${finaltag} gengjiawen/react-native
docker push gengjiawen/react-native:${finaltag}
docker push gengjiawen/react-native
  `
  cmd.trim().split("\n").map(i => {
    const cmd = i.trim();
    if (cmd) {
      if (!cmd.includes('login')) {
        console.log(cmd);
      }
      const output = execSync(cmd)
      console.log(output.toString());
    }
  })
}

publishDocker()
