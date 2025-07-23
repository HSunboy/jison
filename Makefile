
NANOC := $(shell command -v nanoc 2> /dev/null)

ROLLUP = node_modules/.bin/rollup
BABEL = node_modules/.bin/babel
MOCHA = node_modules/.bin/mocha



all: build
	echo "done"

everything:                         \
		clean                       \
		npm-update                  \
		prep                        \
		all                         


prep: subpackages-prep npm-install

dynamic-analysis: analyze-coverage check-coverage


lexer-comparison: build
	cd packages/jison-lex && make comparison




build:                                                                  \
		subpackages                                                     \
		prep_util_dir                                                   \
		packages/ebnf-parser/ebnf.y                                     \
		packages/ebnf-parser/bnf.y                                      \
		packages/ebnf-parser/bnf.l                                      \
		packages/lex-parser/lex.y                                       \
		packages/lex-parser/lex.l

npm-install:
	npm install

npm-update: subpackages-npm-update
	ncu -a --packageFile=package.json

prep_util_dir:
	#@[ -d  node_modules/jison-gho/dist ] || echo "### FAILURE: Make sure you have run 'make prep' before as the jison compiler backup utility files are unavailable! ###"
	#@[ -f  node_modules/jison-gho/dist/cli-cjs-es5.js ] || echo "### FAILURE: Make sure you have run 'make prep' before as the jison compiler backup utility files are unavailable! ###"
	-mkdir -p dist
	#+[ -f dist/cli-cjs-es5.js     ] || ( cp node_modules/jison-gho/dist/cli-cjs-es5.js      dist/cli-cjs-es5.js      && touch -d 1970/1/1  dist/cli-cjs-es5.js     )





subpackages: helpers-lib lex-parser jison-lex ebnf-parser json2jison jison2json jison

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
jison:
	cd packages/jison && make


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


clean:

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
superclean: clean
	-rm -rf node_modules/
	-rm -f package-lock.json

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
		comparison lexer-comparison                              \
		build npm-install                                                           \
		subpackages                                                                 \
		clean superclean git prep_util_dir                                          \
		bump                                                                        \
		git-tag subpackages-git-tag                                                 \
		publish subpackages-publish                                                 \
		npm-update subpackages-npm-update                                           

