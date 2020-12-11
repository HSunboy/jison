PATH        := ../../node_modules/.bin:${PATH}


ROLLUP = ../../node_modules/.bin/rollup
MOCHA = ../../node_modules/.bin/mocha
NYC = ../../node_modules/.bin/nyc      --clean=false --temp-directory ../../.nyc_output

ifndef FULL_CODE_COVERAGE
	# `node --inspect-brk` for debugging with ChromeDev
	LEX = node ./dist/cli-cjs.js
else
	LEX = $(NYC) --reporter=lcov -- node ./dist/cli-cjs.js
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
	$(ROLLUP) -c rollup.config-cli.js
	node __patch_nodebang_in_js.js

test:
	$(MOCHA) --timeout 18000 --check-leaks --globals assert tests/

test-nyc:
	-rm -rf ./coverage/
	$(NYC) --reporter=lcov --reporter=html --reporter=text --exclude 'tests/specs/003-issue-*.js'  -- $(MOCHA) --timeout 18000 --check-leaks --globals assert tests/


examples:                                           \
		examples_basic2_lex                         \
		examples_basic_lex                          \
		examples_c99                                \
		examples_ccalc                              \
		examples_classy                             \
		examples_codegen_feature_tester_base        \
		examples_comments                           \
		examples_compiled_calc_parse                \
		examples_faking                             \
		examples_floop                              \
		examples_gitgraph							\
		examples_gnucobol							\
		examples_handlebars                         \
		examples_icl_grammar						\
		examples_include                            \
		examples_issue1								\
		examples_issue51							\
		examples_issue_url_lexing                   \
		examples_issue_custom_parseError            \
		examples_issue_x1                           \
		examples_issue_x2                           \
		examples_jslex								\
		examples_lex                                \
		examples_lex_grammar                        \
		examples_lexer_comm_debug                   \
		examples_mermaid							\
		examples_pascal                             \
		examples_pplex								\
		examples_regex                              \
		examples_semwhitespace                      \
		examples_seval								\
		examples_shapemap							\
		examples_shex								\
		examples_tikiwikiparser                     \
		examples_unicode                            \
		examples_unicode2                           \
		examples_with_custom_lexer                  \
		examples_custom_lexers 						\
		examples_with_includes 						\
		examples_with_includes_test					\
		examples_xregexp

# Note:
# One or more examples will OVERRIDE the '-o path' argument by specifying it a second time.
# That's perfectly fine with the way our current CLI arg parser works.
LEX_XMPL_MAIN = $(LEX) --main -o examples/output/ -x

examples_gitgraph:
	$(LEX_XMPL_MAIN) examples/gitGraph.jison
	node examples/output/gitGraph.js    					examples/inputData/gitGraph.input.txt                    			examples/output/$@.test-run.tokens.json

examples_pplex:
	# compile the (f)lex spec: the C code in its action blocks WILL NOT permit the generated output to run in NodeJS
	$(LEX_XMPL_MAIN) examples/gnucobol-pplex.l
	# this 'port' of the above code, while absolutely *minimal*, WILL run in NodeJS:
	$(LEX_XMPL_MAIN) examples/gnucobol-pplex.jisonlex
	node examples/output/gnucobol-pplex.js    						examples/inputData/gnucobol-pplex.input.txt                    			examples/output/$@.test-run.tokens.json

examples_gnucobol:
	# compile the (f)lex spec: the C code in its action blocks WILL NOT permit the generated output to run in NodeJS
	$(LEX_XMPL_MAIN) examples/gnucobol-scanner.l
	# this 'port' of the above code, while absolutely *minimal*, WILL run in NodeJS:
	$(LEX_XMPL_MAIN) examples/gnucobol-scanner.jisonlex
	node examples/output/gnucobol-scanner.js    			examples/inputData/gnucobol-scanner.input.txt                    			examples/output/$@.test-run.tokens.json

examples_icl_grammar:
	$(LEX_XMPL_MAIN) examples/icl-grammar.jisonlex
	node examples/output/icl-grammar.js    					examples/inputData/icl-grammar.input.txt                    			examples/output/$@.test-run.tokens.json

examples_issue51:
	$(LEX_XMPL_MAIN) examples/issue-51-gho.jisonlex
	node examples/output/issue-51-gho.js    				examples/inputData/issue-51-gho.input.txt                    			examples/output/$@.test-run.tokens.json

examples_issue1:
	$(LEX_XMPL_MAIN) examples/issue-crash-1.jison
	node examples/output/issue-crash-1.js    				examples/inputData/issue-crash-1.input.txt                    			examples/output/$@.test-run.tokens.json

examples_jslex:
	$(LEX_XMPL_MAIN) examples/js-lex.jisonlex
	node examples/output/js-lex.js    						examples/inputData/js-lex.input.txt                    			examples/output/$@.test-run.tokens.json

examples_mermaid:
	$(LEX_XMPL_MAIN) examples/mermaid.jison
	node examples/output/mermaid.js    						examples/inputData/mermaid.input.txt                    			examples/output/$@.test-run.tokens.json

examples_seval:
	$(LEX_XMPL_MAIN) examples/seval.jisonlex
	node examples/output/seval.js    						examples/inputData/seval.input.txt                    			examples/output/$@.test-run.tokens.json

examples_shapemap:
	$(LEX_XMPL_MAIN) examples/ShapeMapJison.jison
	node examples/output/ShapeMapJison.js    				examples/inputData/ShapeMapJison.input.txt                    			examples/output/$@.test-run.tokens.json

examples_shex:
	$(LEX_XMPL_MAIN) examples/ShExJison.jison
	node examples/output/ShExJison.js    					examples/inputData/ShExJison.input.txt                    			examples/output/$@.test-run.tokens.json

examples_with_includes_test:
	$(LEX_XMPL_MAIN) examples/with-includes.test.lex
	node examples/output/with-includes.test.js    			examples/inputData/with-includes.test.input.txt                    			examples/output/$@.test-run.tokens.json

examples_lex:
	$(LEX_XMPL_MAIN) examples/lex.l
	node examples/output/lex.js    							examples/inputData/lex.input.txt                    			examples/output/$@.test-run.tokens.json

examples_include:
	$(LEX_XMPL_MAIN) examples/with-includes.test.lex
	node examples/output/with-includes.test.js    			examples/inputData/with-includes.test.input.txt                 examples/output/$@.test-run.tokens.json

examples_basic2_lex:
	$(LEX_XMPL_MAIN) examples/basic2_lex.jison
	node examples/output/basic2_lex.js    					examples/inputData/basic2_lex.input.txt                    		examples/output/$@.test-run.tokens.json

examples_basic_lex:
	$(LEX_XMPL_MAIN) examples/basic_lex.jison
	node examples/output/basic_lex.js    					examples/inputData/basic_lex.input.txt                    		examples/output/$@.test-run.tokens.json

examples_c99:
	$(LEX_XMPL_MAIN) examples/c99.l
	node examples/output/c99.js    							examples/inputData/c99.input.txt                    			examples/output/$@.test-run.tokens.json

examples_ccalc:
	# compile the (f)lex spec: the C code in its action blocks WILL NOT permit the generated output to run in NodeJS
	$(LEX_XMPL_MAIN) examples/ccalc-lex.l
	# this 'port' of the above code, while absolutely *minimal*, WILL run in NodeJS:
	$(LEX_XMPL_MAIN) examples/ccalc-lex.jisonlex
	node examples/output/ccalc-lex.js    				examples/inputData/ccalc-lex.input.txt                    		examples/output/$@.test-run.tokens.json

examples_classy:
	$(LEX_XMPL_MAIN) examples/classy.jisonlex
	node examples/output/classy.js    						examples/inputData/classy.input.txt                    			examples/output/$@.test-run.tokens.json

examples_codegen_feature_tester_base:
	$(LEX_XMPL_MAIN) examples/codegen-feature-tester-base.jison
	node examples/output/codegen-feature-tester-base.js    	examples/inputData/codegen-feature-tester-base.input.txt        examples/output/$@.test-run.tokens.json

examples_comments:
	$(LEX_XMPL_MAIN) examples/comments.jison
	node examples/output/comments.js    					examples/inputData/comments.input.txt                    		examples/output/$@.test-run.tokens.json

examples_compiled_calc_parse:
	$(LEX_XMPL_MAIN) examples/compiled_calc_parse.jison
	node examples/output/compiled_calc_parse.js    			examples/inputData/compiled_calc_parse.input.txt                examples/output/$@.test-run.tokens.json

examples_faking:
	$(LEX_XMPL_MAIN) examples/faking-multiple-start-rules-alt.jison
	node examples/output/faking-multiple-start-rules-alt.js    examples/inputData/faking-multiple-start-rules-alt.input.txt         examples/output/$@.test-run.tokens.json

examples_floop:
	$(LEX_XMPL_MAIN) examples/floop.l
	node examples/output/floop.js    						examples/inputData/floop.input.txt                    			examples/output/$@.test-run.tokens.json

examples_handlebars:
	$(LEX_XMPL_MAIN) examples/handlebars.jison.l
	node examples/output/handlebars.jison.js    			examples/inputData/handlebars.jison.input.txt                   examples/output/$@.test-run.tokens.json

examples_issue_x1:
	$(LEX_XMPL_MAIN) examples/issue-19-jison_lex-fixed.jison
	node examples/output/issue-19-jison_lex-fixed.js    	examples/inputData/issue-19-jison_lex-fixed.input.txt           examples/output/$@.test-run.tokens.json

examples_issue_x2:
	$(LEX_XMPL_MAIN) examples/issue-19-jison_lex.jison
	node examples/output/issue-19-jison_lex.js    			examples/inputData/issue-19-jison_lex.input.txt                 examples/output/$@.test-run.tokens.json

examples_issue_url_lexing:
	$(LEX_XMPL_MAIN) examples/issue-357-url-lexing.jison
	node examples/output/issue-357-url-lexing.js    		examples/inputData/issue-357-url-lexing.input.txt               examples/output/$@.test-run.tokens.json

examples_issue_custom_parseError:
	$(LEX_XMPL_MAIN) tests/specs/016-continue-on-yyerror.jison
	node examples/output/016-continue-on-yyerror.js    		examples/inputData/issue-custom-parseError.input.txt            examples/output/$@.016.test-run.tokens.json
	$(LEX_XMPL_MAIN) tests/specs/017-continue-on-yyerror.jison
	node examples/output/017-continue-on-yyerror.js    		examples/inputData/issue-custom-parseError.input.txt            examples/output/$@.017.test-run.tokens.json
	$(LEX_XMPL_MAIN) tests/specs/017A-continue-on-yyerror.jison
	node examples/output/017A-continue-on-yyerror.js    	examples/inputData/issue-custom-parseError.input.txt            examples/output/$@.017A.test-run.tokens.json

examples_lex_grammar:
	$(LEX_XMPL_MAIN) examples/lex_grammar.jisonlex
	node examples/output/lex_grammar.js    					examples/inputData/lex_grammar.input.txt                    	examples/output/$@.test-run.tokens.json

examples_lexer_comm_debug:
	$(LEX_XMPL_MAIN) examples/parser-to-lexer-communication-test-w-debug.jison
	node examples/output/parser-to-lexer-communication-test-w-debug.js    examples/inputData/parser-to-lexer-communication-test-w-debug.input.txt       examples/output/$@.test-run.tokens.json

examples_pascal:
	# compile the (f)lex spec: the C code in its action blocks WILL NOT permit the generated output to run in NodeJS
	$(LEX_XMPL_MAIN) examples/pascal.l
	# this 'port' of the above code, while absolutely *minimal*, WILL run in NodeJS:
	$(LEX_XMPL_MAIN) examples/pascal.jisonlex
	node examples/output/pascal.js    						examples/inputData/pascal.input.txt                    			examples/output/$@.test-run.tokens.json

examples_regex:
	$(LEX_XMPL_MAIN) examples/regex.jison
	node examples/output/regex.js    						examples/inputData/regex.input.txt                    			examples/output/$@.test-run.tokens.json

examples_xregexp:
	$(LEX_XMPL_MAIN) examples/xregexp.jison
	node examples/output/xregexp.js    						examples/inputData/xregexp.input.txt                    		examples/output/$@.test-run.tokens.json

examples_semwhitespace:
	$(LEX_XMPL_MAIN) examples/semwhitespace_lex.jison
	node examples/output/semwhitespace_lex.js    			examples/inputData/semwhitespace_lex.input.txt                  examples/output/$@.test-run.tokens.json

examples_tikiwikiparser:
	$(LEX_XMPL_MAIN) examples/tikiwikiparser.jison
	node examples/output/tikiwikiparser.js    				examples/inputData/tikiwikiparser.input.txt                    	examples/output/$@.test-run.tokens.json

examples_unicode:
	$(LEX_XMPL_MAIN) examples/unicode.jison
	node examples/output/unicode.js    						examples/inputData/unicode.input.txt                    		examples/output/$@.test-run.tokens.json

examples_unicode2:
	$(LEX_XMPL_MAIN) examples/unicode2.jison
	node examples/output/unicode2.js    					examples/inputData/unicode2.input.txt                    		examples/output/$@.test-run.tokens.json

examples_with_includes:
	$(LEX_XMPL_MAIN) examples/with-includes.jison
	node examples/output/with-includes.js    				examples/inputData/with-includes.input.txt                    	examples/output/$@.test-run.tokens.json

examples_with_custom_lexer:
	$(LEX_XMPL_MAIN) examples/with_custom_lexer.jison
	node examples/output/with_custom_lexer.js    			examples/inputData/with_custom_lexer.input.txt                  examples/output/$@.test-run.tokens.json

examples_custom_lexers:
	$(LEX_XMPL_MAIN) tests/specs/001-custom-lexer-baseline.jison
	node examples/output/001-custom-lexer-baseline.js    		examples/inputData/$@.input.txt            					examples/output/$@.001.test-run.tokens.json
	$(LEX_XMPL_MAIN) tests/specs/002-custom-lexer-extra-code-chunks.jison
	node examples/output/002-custom-lexer-extra-code-chunks.js    		examples/inputData/$@.input.txt            			examples/output/$@.002.test-run.tokens.json



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
	bash -c "find . -type f \( -iname '*fatal_*_dump*' -o -ipath '*reference-output*' -o -ipath '*/lex/output/*' -o -ipath '*/lex-parser/output/*' -o -ipath '*/specs/output/*' -o -ipath '*/examples/output/*' \) -print -delete"


.PHONY: all prep npm-install build test examples clean_comparison clean superclean clean-dumpfiles bump git-tag publish comparison npm-update test-nyc \
		examples_basic2_lex                         \
		examples_basic_lex                          \
		examples_c99                                \
		examples_ccalc                              \
		examples_classy                             \
		examples_codegen_feature_tester_base        \
		examples_comments                           \
		examples_compiled_calc_parse                \
		examples_faking                             \
		examples_floop                              \
		examples_gitgraph							\
		examples_gnucobol							\
		examples_handlebars                         \
		examples_icl_grammar						\
		examples_include                            \
		examples_issue1								\
		examples_issue51							\
		examples_issue_url_lexing                   \
		examples_issue_custom_parseError            \
		examples_issue_x1                           \
		examples_issue_x2                           \
		examples_jslex								\
		examples_lex                                \
		examples_lex_grammar                        \
		examples_lexer_comm_debug                   \
		examples_mermaid							\
		examples_pascal                             \
		examples_pplex								\
		examples_regex                              \
		examples_semwhitespace                      \
		examples_seval								\
		examples_shapemap							\
		examples_shex								\
		examples_tikiwikiparser                     \
		examples_unicode                            \
		examples_unicode2                           \
		examples_with_custom_lexer                  \
		examples_custom_lexers 						\
		examples_with_includes 						\
		examples_with_includes_test					\
		examples_xregexp

