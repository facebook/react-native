from pathlib import Path
from pytest import fixture
from pytest_pyodide.server import spawn_web_server
from pytest_pyodide import runner

TEST_PATH = Path(__file__).parents[1].resolve()


class BaseRunner(runner._BrowserBaseRunner):
    def __init__(
        self,
        *args,
        test_dir,
        **kwargs,
    ):
        self.test_dir = test_dir
        super().__init__(
            *args,
            **kwargs,
            load_pyodide=False,
        )

    def prepare_driver(self):
        self.base_url = (
            f"http://{self.server_hostname}:{self.server_port}/{self.test_dir}/"
        )
        self.goto(f"{self.base_url}/test.html")

    def javascript_setup(self):
        self.run_js("globalThis.TestModule = await globalThis.Module();")


class FirefoxRunner(BaseRunner, runner.SeleniumFirefoxRunner):
    pass


class ChromeRunner(BaseRunner, runner.SeleniumChromeRunner):
    pass


# TODO: Figure out how to get NodeRunner to work.

RUNNER_DICT = {x.browser: x for x in [FirefoxRunner, ChromeRunner]}


@fixture(params=list(RUNNER_DICT), scope="class")
def selenium_class_scope(request, web_server_main):
    server_hostname, server_port, server_log = web_server_main
    assert request.param in RUNNER_DICT
    cls = RUNNER_DICT[request.param]
    selenium = cls(
        test_dir=request.cls.TEST_BUILD_DIR,
        server_port=server_port,
        server_hostname=server_hostname,
        server_log=server_log,
    )
    request.cls.call_number = 0
    try:
        yield selenium
    finally:
        print(selenium.logs)
        selenium.driver.quit()


@fixture(scope="function")
def selenium(selenium_class_scope, request):
    selenium = selenium_class_scope
    request.cls.call_number += 1
    # Refresh page every 50 calls to prevent firefox out of memory errors
    if request.cls.call_number % 50 == 0:
        selenium.driver.refresh()
        selenium.javascript_setup()
    selenium.clean_logs()
    yield selenium


@fixture(scope="session")
def web_server_main(request):
    with spawn_web_server(TEST_PATH) as output:
        yield output
