PATH        := ../../node_modules/.bin:${PATH}


ROLLUP = ../../node_modules/.bin/rollup
BABEL = ../../node_modules/.bin/babel
MOCHA = ../../node_modules/.bin/mocha
NYC = ../../node_modules/.bin/nyc      --clean=false --temp-directory ../../.nyc_output

ifndef FULL_CODE_COVERAGE
	LEX = node ./dist/cli-cjs.js -o ./output/$@/
else
	LEX = $(NYC) --reporter=lcov -- node ./dist/cli-cjs.js -o ./output/$@/
endif


all: build test examples

prep:

npm-install:
	npm install

npm-update:
	ncu -a --packageFile=package.json
	-rm -f package-lock.json

build:
	node __patch_lexer_kernel_in_js.js
	-mkdir -p dist
	$(ROLLUP) -c
	$(BABEL) dist/regexp-lexer-cjs.js -o dist/regexp-lexer-cjs-es5.js
	$(BABEL) dist/regexp-lexer-umd.js -o dist/regexp-lexer-umd-es5.js
	$(ROLLUP) -c rollup.config-cli.js
	$(BABEL) dist/cli-cjs.js -o dist/cli-cjs-es5.js
	$(BABEL) dist/cli-umd.js -o dist/cli-umd-es5.js
	node __patch_nodebang_in_js.js

test:
	$(MOCHA) --timeout 18000 --check-leaks --globals assert tests/

test-nyc:
	-rm -rf ./coverage/
	$(NYC) --reporter=lcov --reporter=html --reporter=text --exclude 'tests/specs/003-issue-*.js'  -- $(MOCHA) --timeout 18000 --check-leaks --globals assert tests/


examples:                                           \
		examples_include                            \
		examples_lex                                \
		examples_basic2_lex                         \
		examples_basic_lex                          \
		examples_c99                                \
		examples_ccalc_lex                          \
		examples_classy                             \
		examples_codegen_feature_tester_base        \
		examples_comments                           \
		examples_compiled_calc_parse                \
		examples_faking                             \
		examples_floop                              \
		examples_handlebars                         \
		examples_issue_url_lexing                   \
		examples_issue_x1                           \
		examples_issue_x2                           \
		examples_lex_grammar                        \
		examples_lexer_comm_debug                   \
		examples_pascal                             \
		examples_regex                              \
		examples_xregexp                            \
		examples_semwhitespace                      \
		examples_tikiwikiparser                     \
		examples_unicode2                           \
		examples_unicode                            \
		examples_with_custom_lexer                  \
		examples_with_includes

examples_lex:
	$(LEX) --main examples/lex.l -o examples/output/ -x
	node examples/output/lex.js    							examples/inputData/lex.input.txt                    			examples/output/$@.test-run.tokens.json

examples_include:
	$(LEX) --main examples/with-includes.test.lex -o examples/output/ -x
	node examples/output/with-includes.test.js    			examples/inputData/with-includes.test.input.txt                 examples/output/$@.test-run.tokens.json

examples_basic2_lex:
	$(LEX) --main examples/basic2_lex.jison -o examples/output/ -x
	node examples/output/basic2_lex.js    					examples/inputData/basic2_lex.input.txt                    		examples/output/$@.test-run.tokens.json

examples_basic_lex:
	$(LEX) --main examples/basic_lex.jison -o examples/output/ -x
	node examples/output/basic_lex.js    					examples/inputData/basic_lex.input.txt                    		examples/output/$@.test-run.tokens.json

examples_c99:
	$(LEX) --main examples/c99.l -o examples/output/ -x
	node examples/output/c99.js    							examples/inputData/c99.input.txt                    			examples/output/$@.test-run.tokens.json

examples_ccalc_lex:
	$(LEX) --main examples/ccalc-lex.l -o examples/output/ -x
	node examples/output/ccalc-lex.js    					examples/inputData/ccalc-lex.input.txt                    		examples/output/$@.test-run.tokens.json

examples_classy:
	$(LEX) --main examples/classy.jisonlex -o examples/output/ -x
	node examples/output/classy.js    						examples/inputData/classy.input.txt                    			examples/output/$@.test-run.tokens.json

examples_codegen_feature_tester_base:
	$(LEX) --main examples/codegen-feature-tester-base.jison -o examples/output/ -x
	node examples/output/codegen-feature-tester-base.js    	examples/inputData/codegen-feature-tester-base.input.txt        examples/output/$@.test-run.tokens.json

examples_comments:
	$(LEX) --main examples/comments.jison -o examples/output/ -x
	node examples/output/comments.js    					examples/inputData/comments.input.txt                    		examples/output/$@.test-run.tokens.json

examples_compiled_calc_parse:
	$(LEX) --main examples/compiled_calc_parse.jison -o examples/output/ -x
	node examples/output/compiled_calc_parse.js    			examples/inputData/compiled_calc_parse.input.txt                examples/output/$@.test-run.tokens.json

examples_faking:
	$(LEX) --main examples/faking-multiple-start-rules-alt.jison -o examples/output/ -x
	node examples/output/faking-multiple-start-rules-alt.js    examples/inputData/faking-multiple-start-rules-alt.input.txt         examples/output/$@.test-run.tokens.json

examples_floop:
	$(LEX) --main examples/floop.l -o examples/output/ -x
	node examples/output/floop.js    						examples/inputData/floop.input.txt                    			examples/output/$@.test-run.tokens.json

examples_handlebars:
	$(LEX) --main examples/handlebars.jison.l -o examples/output/ -x
	node examples/output/handlebars.jison.js    			examples/inputData/handlebars.jison.input.txt                   examples/output/$@.test-run.tokens.json

examples_issue_x1:
	$(LEX) --main examples/issue-19-jison_lex-fixed.jison -o examples/output/ -x
	node examples/output/issue-19-jison_lex-fixed.js    	examples/inputData/issue-19-jison_lex-fixed.input.txt           examples/output/$@.test-run.tokens.json

examples_issue_x2:
	$(LEX) --main examples/issue-19-jison_lex.jison -o examples/output/ -x
	node examples/output/issue-19-jison_lex.js    			examples/inputData/issue-19-jison_lex.input.txt                 examples/output/$@.test-run.tokens.json

examples_issue_url_lexing:
	$(LEX) --main examples/issue-357-url-lexing.jison -o examples/output/ -x
	node examples/output/issue-357-url-lexing.js    		examples/inputData/issue-357-url-lexing.input.txt               examples/output/$@.test-run.tokens.json

examples_lex_grammar:
	$(LEX) --main examples/lex_grammar.jisonlex -o examples/output/ -x
	node examples/output/lex_grammar.js    					examples/inputData/lex_grammar.input.txt                    	examples/output/$@.test-run.tokens.json

examples_lexer_comm_debug:
	$(LEX) --main examples/parser-to-lexer-communication-test-w-debug.jison -o examples/output/ -x
	node examples/output/parser-to-lexer-communication-test-w-debug.js    examples/inputData/parser-to-lexer-communication-test-w-debug.input.txt       examples/output/$@.test-run.tokens.json

examples_pascal:
	$(LEX) --main examples/pascal.l -o examples/output/ -x
	node examples/output/pascal.js    						examples/inputData/pascal.input.txt                    			examples/output/$@.test-run.tokens.json

examples_regex:
	$(LEX) --main examples/regex.jison -o examples/output/ -x
	node examples/output/regex.js    						examples/inputData/regex.input.txt                    			examples/output/$@.test-run.tokens.json

examples_xregexp:
	$(LEX) --main examples/xregexp.jison -o examples/output/ -x
	node examples/output/xregexp.js    						examples/inputData/xregexp.input.txt                    		examples/output/$@.test-run.tokens.json

examples_semwhitespace:
	$(LEX) --main examples/semwhitespace_lex.jison -o examples/output/ -x
	node examples/output/semwhitespace_lex.js    			examples/inputData/semwhitespace_lex.input.txt                  examples/output/$@.test-run.tokens.json

examples_tikiwikiparser:
	$(LEX) --main examples/tikiwikiparser.jison -o examples/output/ -x
	node examples/output/tikiwikiparser.js    				examples/inputData/tikiwikiparser.input.txt                    	examples/output/$@.test-run.tokens.json

examples_unicode:
	$(LEX) --main examples/unicode.jison -o examples/output/ -x
	node examples/output/unicode.js    						examples/inputData/unicode.input.txt                    		examples/output/$@.test-run.tokens.json

examples_unicode2:
	$(LEX) --main examples/unicode2.jison -o examples/output/ -x
	node examples/output/unicode2.js    					examples/inputData/unicode2.input.txt                    		examples/output/$@.test-run.tokens.json

examples_with_includes:
	$(LEX) --main examples/with-includes.jison -o examples/output/ -x
	node examples/output/with-includes.js    				examples/inputData/with-includes.input.txt                    	examples/output/$@.test-run.tokens.json

examples_with_custom_lexer:
	$(LEX) --main examples/with_custom_lexer.jison -o examples/output/ -x
	node examples/output/with_custom_lexer.js    			examples/inputData/with_custom_lexer.input.txt                  examples/output/$@.test-run.tokens.json



comparison:                                                                 \
		clean_comparison                                                    \
		examples                                                            \
		examples/reference-output/README.md
	# only run a DIFF once we have generated all outputs:
	# that way we get to see all diffs at once and probably have a
	# faster turn-around cycle when we go and fix any diffs observed
	# here.
	#-diff -C 1 -r -t --tabsize=4 -a -I ' generated by ' -B -E -Z -w examples/reference-output/ examples/output/    > ./comparison.diff-report.patch
	diff -q -r -t --tabsize=4 -a -I ' generated by ' -B -E -Z -w -X examples/comparison-diff-filter-extensions.txt examples/reference-output/ examples/output/



# increment the XXX <prelease> number in the package.json file: version <major>.<minor>.<patch>-<prelease>
bump:
	cd ../../ && node __patch_version_in_js.js

git-tag:

publish:
	npm run pub






clean_comparison:
	-rm -rf examples/output/

clean: clean_comparison
	-rm -rf dist/
	-rm -rf examples/output/

superclean: clean
	-rm -rf node_modules/
	-rm -f package-lock.json
	-find . -type d -name 'node_modules' -exec rm -rf "{}" \;



clean-dumpfiles:
	bash -c "find . -type f \( -iname '*fatal_*_dump*' -o -ipath '*reference-output*' -o -ipath '*/lex/output/*' -o -ipath '*/specs/output/*' -o -ipath '*/examples/output/*' \) -print -delete"


.PHONY: all prep npm-install build test examples clean_comparison clean superclean clean-dumpfiles bump git-tag publish examples_lex examples_include examples_basic2_lex examples_basic_lex examples_c99 examples_ccalc_lex examples_classy examples_codegen_feature_tester_base examples_comments examples_compiled_calc_parse examples_faking examples_floop examples_handlebars examples_issue_url_lexing examples_issue_x1 examples_issue_x2 examples_lex_grammar examples_lexer_comm_debug examples_pascal examples_regex examples_semwhitespace examples_tikiwikiparser examples_unicode2 examples_unicode examples_with_custom_lexer examples_with_includes comparison npm-update test-nyc

