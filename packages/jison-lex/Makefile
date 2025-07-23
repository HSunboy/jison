

ROLLUP = ./node_modules/.bin/rollup
BABEL = ./node_modules/.bin/babel
MOCHA = ./node_modules/.bin/mocha
NYC = ./node_modules/.bin/nyc      --clean=false --temp-directory ../../.nyc_output

ifndef FULL_CODE_COVERAGE
	LEX = node ./dist/cli-cjs-es5.js -o ./output/$@/
else
	LEX = $(NYC) --reporter=lcov -- node ./dist/cli-cjs-es5.js -o ./output/$@/
endif


all: build


npm-install:
	npm install

npm-update:
	ncu -a --packageFile=package.json

build:
	node __patch_lexer_kernel_in_js.js
	-mkdir -p dist
	$(ROLLUP) -c
	$(ROLLUP) -c rollup.config-cli.js
	node __patch_nodebang_in_js.js

test:
	$(MOCHA) --timeout 18000 --check-leaks --globals assert tests/


comparison:                                                                 
		clean                                                               



# increment the XXX <prelease> number in the package.json file: version <major>.<minor>.<patch>-<prelease>
bump:


git-tag:

publish:
	npm run pub






clean:
	-rm -rf dist/

superclean: clean
	-rm -rf node_modules/
	-rm -f package-lock.json
	-find . -type d -name 'node_modules' -exec rm -rf "{}" \;





.PHONY: all npm-install build test clean superclean bump git-tag publish  comparison npm-update

