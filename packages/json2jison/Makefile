MOCHA = ./node_modules/.bin/mocha
NYC = ./node_modules/.bin/nyc      --clean=false --temp-directory ../../.nyc_output


all: build


npm-install:
	npm install

npm-update:
	ncu -a --packageFile=package.json

build:

test:
	$(MOCHA) --check-leaks --globals assert tests/

test-nyc:
	-rm -rf ./coverage/
	$(NYC) --reporter=lcov --reporter=html --reporter=text  -- $(MOCHA) --check-leaks --globals assert tests/


# increment the XXX <prelease> number in the package.json file: version <major>.<minor>.<patch>-<prelease>
bump:

git-tag:

publish:
	npm run pub






clean:

superclean: clean
	-rm -rf node_modules/
	-rm -f package-lock.json
	-find . -type d -name 'node_modules' -exec rm -rf "{}" \;





.PHONY: all npm-install build test clean superclean bump git-tag publish npm-update test-nyc

