
NANOC := $(shell command -v nanoc 2> /dev/null)

ROLLUP = node_modules/.bin/rollup
BABEL = node_modules/.bin/babel
MOCHA = node_modules/.bin/mocha
NYC = node_modules/.bin/nyc      --clean=false --temp-directory ./.nyc_output

ifndef FULL_CODE_COVERAGE
	JISON = node dist/cli-cjs-es5.js
else
	JISON = $(NYC) --reporter=lcov -- node dist/cli-cjs-es5.js
endif



all: build test

everything:                         \
		clean                       \
		npm-update                  \
		prep                        \
		all                         \
		site


prep: subpackages-prep npm-install

# `make site` will perform an extensive (re)build of the jison tool, all examples and the web pages.
# Use `make compile-site` for a faster, if less complete, site rebuild action.
site: build test examples-test web-examples web/content/assets/js/jison.js compile-site

clean-site:
	-@rm -rf web/tmp/
	-@rm -rf web/output/jison/
	-@rm -rf web/content/examples/
	-rm web/content/assets/js/jison.js
	-rm web/content/assets/js/calculator.js

# `make compile-site` will perform a quick (re)build of the web pages
compile-site: web-examples web/content/assets/js/jison.js
	-@rm -rf web/tmp/
	-@rm -rf web/content/examples/
	cp -r examples web/content/examples/
ifndef NANOC
	$(warning "*** nanoc is not available, please install ruby, gem and nanoc. ***")
	$(warning "*** JISON website pages have NOT been updated!                  ***")
else
	cd web/ && nanoc compile
	-@rm -rf docs/
	-mkdir -p docs
	cp -r web/output/jison/* docs/
endif

web/content/assets/js/jison.js: build
	@[ -a  node_modules/.bin/browserify ] || echo "### FAILURE: Make sure you run 'make prep' before as the browserify tool is unavailable! ###"
	sh node_modules/.bin/browserify entry.js --exports require > web/content/assets/js/jison.js

preview:
ifndef NANOC
	$(error "nanoc is not available, please install ruby, gem and nanoc")
else
	cd web/ && nanoc view &
	open http://localhost:3000/jison/
endif

# `make deploy` is `make site` plus GIT checkin of the result into the gh-pages branch
deploy: site
	#git checkout gh-pages
	#cp -r web/output/jison/* ./
	#git add . --all
	git commit -a -m 'Deploy site updates'
	#git checkout master

test:
	$(MOCHA) --timeout 18000 --check-leaks --globals assert --recursive tests/

analyze-coverage:
	istanbul cover test/unit-tests.js

check-coverage:
	istanbul check-coverage --statement 96 --branch 96 --function 96

dynamic-analysis: analyze-coverage check-coverage

clean-nyc:
	# clear the coverage cache, etc.
	-rm -rf ./.nyc_output
	-rm -rf ./coverage/


report-nyc:
	-rm -rf ./coverage/
	# report collective coverage results:
	$(NYC) report --reporter=html

web-examples: web/content/assets/js/calculator.js

examples: examples_directory

web/content/assets/js/calculator.js: examples/calculator.jison build
	$(JISON) examples/calculator.jison -o $@


comparison:
	cd examples/ && make comparison

lexer-comparison: build
	cd packages/jison-lex && make comparison

examples_directory: build
	cd examples/ && make all


examples-test: build
	cd examples/ && make error-handling-tests basic-tests github-issue-tests misc-tests

error-handling-tests: build
	cd examples/ && make error-handling-tests

basic-tests: build
	cd examples/ && make basic-tests

github-issue-tests: build
	cd examples/ && make github-issue-tests

misc-tests: build
	cd examples/ && make misc-tests



examples/ansic: build
	cd examples/ && make ansic

examples/basic: build
	cd examples/ && make basic

examples/basic2: build
	cd examples/ && make basic2

examples/basic2_lex: build
	cd examples/ && make basic2_lex

examples/basic_lex: build
	cd examples/ && make basic_lex

examples/basic_w_error_rule: build
	cd examples/ && make basic_w_error_rule

examples/bloop: build
	cd examples/ && make bloop

examples/btyacc-ansiC: build
	cd examples/ && make btyacc-ansiC

examples/btyacc-ansiC2: build
	cd examples/ && make btyacc-ansiC2

examples/btyacc-ftp: build
	cd examples/ && make btyacc-ftp

examples/btyacc-t1: build
	cd examples/ && make btyacc-t1

examples/btyacc-t2: build
	cd examples/ && make btyacc-t2

examples/c99: build
	cd examples/ && make c99

examples/calc_LA_on_demand: build
	cd examples/ && make calc_LA_on_demand

examples/calculator: build
	cd examples/ && make calculator

examples/calculator_json: build
	cd examples/ && make calculator_json

examples/ccalc: build
	cd examples/ && make ccalc

examples/classy: build
	cd examples/ && make classy

examples/classy_ast: build
	cd examples/ && make classy_ast

examples/comments: build
	cd examples/ && make comments

examples/compiled_calc: build
	cd examples/ && make compiled_calc

examples/dism: build
	cd examples/ && make dism

examples/dism_lr0: build
	cd examples/ && make dism_lr0

examples/dot: build
	cd examples/ && make dot

examples/error-handling-and-yyclearin: build
	cd examples/ && make error-handling-and-yyclearin

examples/error-handling-and-yyerrok-loopfix: build
	cd examples/ && make error-handling-and-yyerrok-loopfix

examples/error-handling-and-yyerrok-looping1: build
	cd examples/ && make error-handling-and-yyerrok-looping1

examples/error-handling-and-yyerrok-looping2: build
	cd examples/ && make error-handling-and-yyerrok-looping2

examples/error-handling-and-yyerrok-macro: build
	cd examples/ && make error-handling-and-yyerrok-macro

examples/error-handling-and-yyerrok-part1: build
	cd examples/ && make error-handling-and-yyerrok-part1

examples/error-handling-and-yyerrok-part2: build
	cd examples/ && make error-handling-and-yyerrok-part2

examples/error-handling-and-yyerrok-part3: build
	cd examples/ && make error-handling-and-yyerrok-part3

examples/error-handling-and-yyerrok-part4a: build
	cd examples/ && make error-handling-and-yyerrok-part4a

examples/error-handling-and-yyerrok-part4b: build
	cd examples/ && make error-handling-and-yyerrok-part4b

examples/error-handling-and-yyerrok-part5: build
	cd examples/ && make error-handling-and-yyerrok-part5

examples/error-only: build
	cd examples/ && make error-only

examples/error-recognition-actions: build
	cd examples/ && make error-recognition-actions

examples/faking-multiple-start-rules: build
	cd examples/ && make faking-multiple-start-rules

examples/faking-multiple-start-rules-alt: build
	cd examples/ && make faking-multiple-start-rules-alt

examples/flow: build
	cd examples/ && make flow

examples/formula: build
	cd examples/ && make formula

examples/fsyacc-cgrammar: build
	cd examples/ && make fsyacc-cgrammar

examples/gantt: build
	cd examples/ && make gantt

examples/grammar: build
	cd examples/ && make grammar

examples/handlebars: build
	cd examples/ && make handlebars

examples/happyhappy: build
	cd examples/ && make happyhappy

examples/inherited_y: build
	cd examples/ && make inherited_y

examples/issue-205: build
	cd examples/ && make issue-205

examples/issue-205-2: build
	cd examples/ && make issue-205-2

examples/issue-205-3: build
	cd examples/ && make issue-205-3

examples/issue-205-4: build
	cd examples/ && make issue-205-4

examples/issue-254: build
	cd examples/ && make issue-254

examples/issue-289: build
	cd examples/ && make issue-289

examples/issue-293: build
	cd examples/ && make issue-293

examples/issue-342: build
	cd examples/ && make issue-342

examples/issue-344: build
	cd examples/ && make issue-344

examples/issue-344-2: build
	cd examples/ && make issue-344-2

examples/issue-348: build
	cd examples/ && make issue-348

examples/issue-357-url-lexing: build
	cd examples/ && make issue-357-url-lexing

examples/issue-360: build
	cd examples/ && make issue-360

examples/jscore: build
	cd examples/ && make jscore

examples/json_ast_js: build
	cd examples/ && make json_ast_js

examples/json_js: build
	cd examples/ && make json_js

examples/klammergebirge: build
	cd examples/ && make klammergebirge

examples/lalr-but-not-slr: build
	cd examples/ && make lalr-but-not-slr

examples/lambdacalc: build
	cd examples/ && make lambdacalc

examples/lex: build
	cd examples/ && make lex

examples/lojban-300: build
	cd examples/ && make lojban-300

examples/lr-but-not-lalr: build
	cd examples/ && make lr-but-not-lalr

examples/mermaid: build
	cd examples/ && make mermaid

examples/mfcalc: build
	cd examples/ && make mfcalc

examples/no-prec-hack-needed: build
	cd examples/ && make no-prec-hack-needed

examples/codegen-feature-tester: build
	cd examples/ && make codegen-feature-tester

examples/nv_classy_ast: build
	cd examples/ && make nv_classy_ast

examples/olmenu-proto2: build
	cd examples/ && make olmenu-proto2

examples/parser-to-lexer-communication-test: build
	cd examples/ && make parser-to-lexer-communication-test

examples/parser-to-lexer-communication-test--profiling: build
	cd examples/ && make parser-to-lexer-communication-test--profiling

profiling:
	cd examples/ && make profiling

examples/pascal: build
	cd examples/ && make pascal

examples/phraser: build
	cd examples/ && make phraser

examples/precedence: build
	cd examples/ && make precedence

examples/reduce_conflict: build
	cd examples/ && make reduce_conflict

examples/regex: build
	cd examples/ && make regex

examples/semwhitespace: build
	cd examples/ && make semwhitespace

examples/test-EOF-bugfix: build
	cd examples/ && make test-EOF-bugfix

examples/test-epsilon-rules-early-reduce: build
	cd examples/ && make test-epsilon-rules-early-reduce

examples/test-literal-quote-tokens-in-grammar: build
	cd examples/ && make test-literal-quote-tokens-in-grammar

examples/test-nonassociative-operator-0: build
	cd examples/ && make test-nonassociative-operator-0

examples/test-nonassociative-operator-1: build
	cd examples/ && make test-nonassociative-operator-1

examples/test-nonassociative-operator-2: build
	cd examples/ && make test-nonassociative-operator-2

examples/test-propagation-rules-reduction-1: build
	cd examples/ && make test-propagation-rules-reduction-1

examples/theory-left-recurs-01: build
	cd examples/ && make theory-left-recurs-01

examples/tikiwikiparser: build
	cd examples/ && make tikiwikiparser

examples/unicode: build
	cd examples/ && make unicode

examples/unicode2: build
	cd examples/ && make unicode2

examples/with-includes: build
	cd examples/ && make with-includes

examples/with_custom_lexer: build
	cd examples/ && make with_custom_lexer

examples/yacc-error-recovery: build
	cd examples/ && make yacc-error-recovery






build:   dist/cli-cjs-es5.js                                             

npm-install:
	npm install

npm-update: subpackages-npm-update
	ncu -a --packageFile=package.json

prep_util_dir:
	#@[ -d  node_modules/jison-gho/dist ] || echo "### FAILURE: Make sure you have run 'make prep' before as the jison compiler backup utility files are unavailable! ###"
	#@[ -f  node_modules/jison-gho/dist/cli-cjs-es5.js ] || echo "### FAILURE: Make sure you have run 'make prep' before as the jison compiler backup utility files are unavailable! ###"
	-mkdir -p dist
	#+[ -f dist/cli-cjs-es5.js     ] || ( cp node_modules/jison-gho/dist/cli-cjs-es5.js      dist/cli-cjs-es5.js      && touch -d 1970/1/1  dist/cli-cjs-es5.js     )

dist/cli-cjs-es5.js: dist/jison.js rollup.config-cli.js
	-mkdir -p dist
	$(ROLLUP) -c rollup.config-cli.js
	$(BABEL) dist/cli-cjs.js -o dist/cli-cjs-es5.js
	$(BABEL) dist/cli-umd.js -o dist/cli-umd-es5.js
	node __patch_nodebang_in_js.js

dist/jison.js: rollup.config.js
	node __patch_parser_kernel_in_js.js
	-mkdir -p dist
	$(ROLLUP) -c
	$(BABEL) dist/jison-cjs.js -o dist/jison-cjs-es5.js
	$(BABEL) dist/jison-umd.js -o dist/jison-umd-es5.js





subpackages: helpers-lib lex-parser jison-lex ebnf-parser json2jison jison2json

helpers-lib:
	cd packages/helpers-lib && make

lex-parser:
	cd packages/lex-parser && make

jison-lex:
	cd packages/jison-lex && make

ebnf-parser:
	cd packages/ebnf-parser && make

json2jison:
	cd packages/json2jison && make

jison2json:
	cd packages/jison2json && make


subpackages-prep:
	cd packages/helpers-lib && make prep
	cd packages/lex-parser && make prep
	cd packages/jison-lex && make prep
	cd packages/ebnf-parser && make prep
	cd packages/jison2json && make prep
	cd packages/json2jison && make prep


subpackages-npm-update:
	cd packages/helpers-lib && make npm-update
	cd packages/lex-parser && make npm-update
	cd packages/jison-lex && make npm-update
	cd packages/ebnf-parser && make npm-update
	cd packages/jison2json && make npm-update
	cd packages/json2jison && make npm-update


# increment the XXX <prelease> number in the package.json file: version <major>.<minor>.<patch>-<prelease>
bump:
	npm version --no-git-tag-version prerelease


git-tag:
	node -e 'var pkg = require("./package.json"); console.log(pkg.version);' | xargs git tag


git:
	-git pull --all
	-git push --all


subpackages-publish:
	cd packages/helpers-lib && make publish
	cd packages/lex-parser && make publish
	cd packages/jison-lex && make publish
	cd packages/ebnf-parser && make publish
	cd packages/jison2json && make publish
	cd packages/json2jison && make publish

publish: subpackages-publish
	npm run pub


clean: clean-site
	cd examples/ && make clean

	cd packages/helpers-lib && make clean
	cd packages/lex-parser && make clean
	cd packages/jison-lex && make clean
	cd packages/ebnf-parser && make clean
	cd packages/jison2json && make clean
	cd packages/json2jison && make clean

#
# When you've run `make superclean` you must run `make prep`, `make` and `make deploy` to regenerate all content again.
#
# The 'superclean' target is to be used when you need to update/edit the jison code generators and want to
# make sure that jison is rebuilt from scratch.
# The 'superclean' target is also useful in the above context for it enables you to find the 'originals'
# of each part of the generator (lexer & parser) as all derived copies have been killed.
#
superclean: clean clean-site
	-rm -rf node_modules/
	-rm -f package-lock.json

	cd examples/ && make superclean

	cd packages/helpers-lib && make superclean
	cd packages/lex-parser && make superclean
	cd packages/jison-lex && make superclean
	cd packages/ebnf-parser && make superclean
	cd packages/jison2json && make superclean
	cd packages/json2jison && make superclean

	-rm -rf dist
	-find . -type d -name 'node_modules' -exec rm -rf "{}" \;

	# recover old jison run-time so we can bootstrap without failure and need for manual git-revert action
	git checkout dist/




.PHONY: all everything                                                              \
		prep subpackages-prep                                                       \
		helpers-lib lex-parser jison-lex ebnf-parser json2jison jison2json          \
		site preview deploy test web-examples examples examples-test                \
		examples_directory comparison lexer-comparison                              \
		error-handling-tests basic-tests github-issue-tests misc-tests              \
		build npm-install                                                           \
		subpackages                                                                 \
		clean superclean git prep_util_dir                                          \
		bump                                                                        \
		git-tag subpackages-git-tag                                                 \
		compile-site clean-site                                                     \
		publish subpackages-publish                                                 \
		npm-update subpackages-npm-update                                           \
		test-nyc clean-nyc report-nyc


test-nyc:
	$(NYC) --reporter=lcov --reporter=text --exclude 'examples/issue-lex*.js' -- $(MOCHA) --timeout 18000 --check-leaks --globals assert --recursive tests/