import groovy.json.JsonSlurperClassic

def runPipeline() {
    try {
        ansiColor('xterm') {
            runStages();
        }
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
                runCmdOnDockerImage(imageName, "bash /app/ContainerShip/scripts/run-android-docker-instrumentation-tests.sh --offset=${offset} --count=${testPerParallel}", '--privileged --rm')
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
        def jsDockerBuild, androidDockerBuild
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
                buildInfo.image.tag = "${buildInfo.scm.sha}-${env.BUILD_TAG.replace(" ", "-").replace("/", "-").replace("%2F", "-")}"

                jsTag = "${buildInfo.image.tag}"
                androidTag = "${buildInfo.image.tag}"
                jsImageName = "${buildInfo.image.name}-js:${jsTag}"
                androidImageName = "${buildInfo.image.name}-android:${androidTag}"

                parallelInstrumentationTests = getParallelInstrumentationTests('./ReactAndroid/src/androidTest/java/com/facebook/react/tests', 1, androidImageName)

                parallel(
                    'javascript build': {
                        jsDockerBuild = docker.build("${jsImageName}", "-f ContainerShip/Dockerfile.javascript .")
                    },
                    'android build': {
                        androidDockerBuild = docker.build("${androidImageName}", "-f ContainerShip/Dockerfile.android .")
                    }
                )

            }

            stage('Tests JS') {
                try {
                    parallel(
                        'javascript flow': {
                            runCmdOnDockerImage(jsImageName, 'yarn run flow -- check', '--rm')
                        },
                        'javascript tests': {
                            runCmdOnDockerImage(jsImageName, 'yarn test --maxWorkers=4', '--rm')
                        },
                        'documentation tests': {
                            runCmdOnDockerImage(jsImageName, 'cd website && yarn test', '--rm')
                        },
                        'documentation generation': {
                            runCmdOnDockerImage(jsImageName, 'cd website && node ./server/generate.js', '--rm')
                        }
                    )
                } catch(e) {
                    currentBuild.result = "FAILED"
                    echo "Test JS Stage Error: ${e}"
                }
            }

            stage('Tests Android') {
                try {
                    parallel(
                        'android unit tests': {
                            runCmdOnDockerImage(androidImageName, 'bash /app/ContainerShip/scripts/run-android-docker-unit-tests.sh', '--privileged --rm')
                        },
                        'android e2e tests': {
                            // temporarily disable e2e tests, they have a high transient failure rate
                            // runCmdOnDockerImage(androidImageName, 'bash /app/ContainerShip/scripts/run-ci-e2e-tests.sh --android --js', '--rm')
                            echo "Android E2E tests have been temporarily disabled"
                        }
                    )
                } catch(e) {
                    currentBuild.result = "FAILED"
                    echo "Tests Android Stage Error: ${e}"
                }
            }

            stage('Tests Android Instrumentation') {
                // run all tests in parallel
                try {
                    parallel(parallelInstrumentationTests)
                } catch(e) {
                    currentBuild.result = "FAILED"
                    echo "Tests Android Instrumentation Stage Error: ${e}"
                }
            }

            stage('Cleanup') {
                cleanupImage(jsDockerBuild)
                cleanupImage(androidDockerBuild)
            }
        } catch(err) {
            cleanupImage(jsDockerBuild)
            cleanupImage(androidDockerBuild)

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

def cleanupImage(image) {
    if (image) {
        try {
            sh "docker ps -a | awk '{ print \$1,\$2 }' | grep ${image.id} | awk '{print \$1 }' | xargs -I {} docker rm {}"
            sh "docker rmi -f ${image.id}"
        } catch(e) {
            echo "Error cleaning up ${image.id}"
            echo "${e}"
        }
    }
}

runPipeline()
