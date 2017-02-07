import groovy.json.JsonSlurperClassic

def runPipeline() {
    try {
        runStages();
    } catch(err) {
        echo "Error: ${err}"
        currentBuild.result = "FAILED"
    }
}

def pullDockerImage(imageName) {
    def result = sh(script: "docker pull ${imageName}", returnStatus: true)

    if (result != 0) {
        throw new Exception("Failed to pull image[${imageName}]")
    }
}

def buildDockerfile(dockerfilePath = "Dockerfile", imageName) {
    def buildCmd = "docker build -f ${dockerfilePath} -t ${imageName} ."
    echo "${buildCmd}"

    def result = sh(script: buildCmd, returnStatus: true)

    if (result != 0) {
        throw new Exception("Failed to build image[${imageName}] from '${dockerfilePath}'")
    }
}

def runCmdOnDockerImage(imageName, cmd, run_opts = '') {
    def result = sh(script: "docker run ${run_opts} -i ${imageName} sh -c '${cmd}'", returnStatus: true)

    if(result != 0) {
        throw new Exception("Failed to run cmd[${cmd}] on image[${imageName}]")
    }
}

def calculateGithubInfo() {
    return [
        branch: env.BRANCH_NAME,
        sha: sh(returnStdout: true, script: 'git rev-parse HEAD').trim(),
        tag: null,
        isPR: "${env.CHANGE_URL}".contains('/pull/')
    ]
}

def getParallelInstrumentationTests(testDir, parallelCount, imageName) {
    def integrationTests = [:]
    def testCount = sh(script: "ls ${testDir} | wc -l", returnStdout: true).trim().toInteger()
    def testPerParallel = testCount.intdiv(parallelCount) + 1

    for (def x = 0; (x*testPerParallel) < testCount; x++) {
        def offset = x
        integrationTests["android integration tests: ${offset}"] = {
            run: {
                runCmdOnDockerImage(imageName, "bash /app/ContainerShip/scripts/run-android-docker-instrumentation-tests.sh --offset=${offset} --count=${testPerParallel}", '--privileged')
            }
        }
    }

    return integrationTests
}

def runStages() {
    def buildInfo = [
        image: [
            name: "facebook/react-native",
            tag: null
        ],
        scm: [
            branch: null,
            sha: null,
            tag: null,
            isPR: false
        ]
    ]

    node {
        def jsTag, androidTag, jsImageName, androidImageName, parallelInstrumentationTests

        try {
            stage('Setup') {
                parallel(
                    'pull images': {
                        pullDockerImage('containership/android-base:latest')
                    }
                )
            }

            stage('Build') {
                checkout scm

                def githubInfo = calculateGithubInfo()
                buildInfo.scm.branch = githubInfo.branch
                buildInfo.scm.sha = githubInfo.sha
                buildInfo.scm.tag = githubInfo.tag
                buildInfo.scm.isPR = githubInfo.isPR
                buildInfo.image.tag = buildInfo.scm.sha

                jsTag = "${buildInfo.image.tag}-javascript"
                androidTag = "${buildInfo.image.tag}-android"
                jsImageName = "${buildInfo.image.name}:${jsTag}"
                androidImageName = "${buildInfo.image.name}:${androidTag}"

                parallelInstrumentationTests = getParallelInstrumentationTests('./ReactAndroid/src/androidTest/java/com/facebook/react/tests', 3, androidImageName)

                parallel(
                    'javascript build': {
                        buildDockerfile('ContainerShip/Dockerfile.javascript', jsImageName)
                    },
                    'android build': {
                        buildDockerfile('ContainerShip/Dockerfile.android', androidImageName)
                    }
                )

            }

            stage('Tests') {
                parallelInstrumentationTests["javascript flow"] = {
                    run: {
                        runCmdOnDockerImage(jsImageName, 'yarn run flow -- check')
                    }
                }

                parallelInstrumentationTests["javascript tests"] = {
                    run: {
                        runCmdOnDockerImage(jsImageName, 'yarn test --maxWorkers=4')
                    }
                }

                parallelInstrumentationTests["documentation tests"] = {
                    run: {
                        runCmdOnDockerImage(jsImageName, 'cd website && yarn test')
                    }
                }

                parallelInstrumentationTests["documentation generation"] = {
                    run: {
                        runCmdOnDockerImage(jsImageName, 'cd website && node ./server/generate.js')
                    }
                }

                parallelInstrumentationTests["android unit tests"] = {
                    run: {
                        runCmdOnDockerImage(androidImageName, 'bash /app/ContainerShip/scripts/run-android-docker-unit-tests.sh', '--privileged')
                    }
                }

                parallelInstrumentationTests["android e2e tests"] = {
                    run: {
                        runCmdOnDockerImage(androidImageName, 'bash /app/ContainerShip/scripts/run-ci-e2e-tests.sh --android --js')
                    }
                }

                // run all tests in parallel
                parallel(parallelInstrumentationTests)
            }

            stage('Cleanup') {
                parallel(
                    'javascript': {
                        cleanupImage(buildInfo.image.name, jsTag)
                    },
                    'android': {
                        cleanupImage(buildInfo.image.name, androidTag)
                    }
                )
            }
        } catch(err) {
            cleanupImage(buildInfo.image.name, jsTag)
            cleanupImage(buildInfo.image.name, androidTag)
            throw err
        }
    }

}

def isMasterBranch() {
    return env.GIT_BRANCH == 'master'
}

def gitCommit() {
    return sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
}

def cleanupImage(imageName, tag) {
    def imageId = sh(script: "docker images | awk '\$1==\"${imageName}\" && \$2==\"${tag}\" { print \$3 }'", returnStdout: true).trim()

    if(imageId) {
        sh "docker rm -f \$(docker ps -a | awk '\$2==\"${imageName}:${tag}\" { print \$1 }')"
        sh "docker rmi -f ${imageId}"
    }
}

runPipeline()
