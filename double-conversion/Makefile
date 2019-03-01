all:
	scons debug=1

test:
	./run_tests --list | tr -d '<' | xargs ./run_tests

.PHONY: test all
