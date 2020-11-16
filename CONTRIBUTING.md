Contributing to Jison
=======

Fork, make your changes, run tests and/or add tests then send a pull request.

## Required tools for Development

- NodeJS
- NPM
- GNU make  (make sure you can run the `make` command from your (bash) shell command line)

When you are working on the Microsoft Windows OS, you can obtain the prerequisite tools
by installing Git-for-Windows **and its Developer SDK**
(as only the latter includes *GNU make*, for example, at the time of writing: April 2017):

- [Git-for-Windows](https://git-for-windows.github.io/)
- [Git-fo-Windows Developer SDK](https://github.com/git-for-windows/build-extra/releases/latest)


## Installing

JISON consists of the main project and a couple of git modules; when you work on JISON itself you MUST install those submodules too:

```
$ git submodule update --init
```

should fetch the submodules listed in this project's `.gitmodules` file and you're good to go!

The next step would be to install the required NPM packages for all modules. `make` to the rescue:

```
$ make prep
```


## Building the app

Simply run `make`; this includes running the unit tests for every module as the app is assembled:

```
$ make
```

### BIG FAT WARNING for when that `make` fails :: the need to PATCH `/node_modules/jison-gho/dist/`

`jison` (and therefor `jison-gho` as well) use a bootstrapping technique to (re)build itself: it uses an (of course always older!) official `npm` release of itself to compile its parts until a new jison app is available in `/dist/`.

The first caveat here is that you'll often find the makefiles using the `node_modules/jison-gho/dist/cli-cjs-es5.js` binary (or 
`node_modules/jison-gho/dist/cli-cjs.js` if you live in a world somewhat removed from November 2020AD when this is written about the bleeding edge of development) when there's *apparently* a good jison already sitting in `/dist/`.

Doesn't matter why, the fact remains that the makefiles go for that `npm` installed jison release for bootstrap help at the slightest whiff of trouble.

Now `jison-gho` is a fickle beast, so the next bit of advice will apply at other times as it does now that we're working on
the beginning of a major, pardon, minor version bump to 0.7.0-BUILDNUMBER: **the current grammars WILL NOT compile successfully
using ANY OLDER JISON/JISON-GHO release**.

#### Why?

For several reasons, including:

- the new bnf / ebnf / lex grammars using features which were NOT available in the latest `npm` release but only in older dev commits.
- the new code (0.7.0-BUILDNUMBER) having been migrated to a ES6 language level, where we freely enjoy `let` and `const` and 
  any older `jison` / `jison-gho` will produce a parser JavaScript output (IFF they succeed at all!) which will then be
  riddled with `let` variable collisions due to *shared scope* of the many user action chunks in a generated parser (and lexer)
  in its main `switch`/`case` code chunk. Only bleeding edge will support this properly.

**So the key here is to use the bleeding edge to bootstrap the next bleeding edge.**

#### What to do then?

- First you install all `npm` packages, including that old `jison`/`jison-gho`, as prescribed by `package.json`.
  
  Nothing fancy or new here.
- Next, you find yourself a commit in the bleeding which has a 'known good enough' status for the files in '/dist/'. 
  + One such a commit might be SHA-1: ef64b15e1feeb6f63a704a6625809ec9a727d59d
  + I'm rather sloppy about marking my commits and sometimes push broken code. So you'll have to try a few commits if you're riding the *edge of the edge* and `/dist/cli-cjs.js` doesn't deliver, but crashes instead. Bugger!
- Having decided on a commit, you get **all the files in `/dist/` and copy the entire bunch over the same-named ones in `/node_modules/jison-gho/dist/`.
- you have now successfully "upgraded" the installed bootstrapper `jison-gho` so all your lex/bnf/ebnf grammars will be compiled using that bleeding-edge-forom-`/dist/` as if it were a `npm` release!

This "copy `/dist/*` over `/node_modules/jison-gho/dist/`" approch often works very well if you observe the makefiles failing to
build any of the `*.y` and/or `*.l` files which are critical to produce a new, working `jison-gho`.

Those critical files would be:

- packages/lex-parser/lex.l
- packages/lex-parser/lex.y
- packages/ebnf-parser/bnf.l
- packages/ebnf-parser/bnf.y
- packages/ebnf-parser/ebnf.y


#### Do I always have to this "patching" or is this for special occasions only?!

It's for special occasions only. Generally, it would happen when I'm a bit fast gunning for a new release and doing more or less major work on those critical `*.l` / `*.y` files listed above.

I may have scared the Bejeezus out of you with the above Warning Note, but you'ld be very much **stuck** without it when you'ld be doing some feature work on the grammars yourself, particularly when you're like me, not afraid to introduce (small?) features in a release and *immediately* use those in the `jison`-critical grammars to, kind of, "eat your own dogfood" at the Edge of the Universe. Or something like that.

> I'm making a little fun of it, but here's the gun. Safety's *off*. Here's the end that goes goes *bang* and that bit there is the trigger. Point *down-range*, have fun, but, *ah*, *grown-up like*, a'right?


### Oh, and what do we do when the `make` run fails in any bunch of tests -- lighting up the console all *red* and stuff?!

Well, you MAY want to try to **nuke the test reference files** (against which the generated test outputs are compared in a rather nit-picky fashion) by running this command to auto-rewrite all test reference files:

    make clean-dumpfiles ; make

Of course, a more-or-less risk-averse individual would do well to then go and compare those new generated files in all those
`.../reference-output/` directories against the ones already checked into the git repository -- I use TortoiseGit plus [Scooter Software's very commendable 'Beyond Compare' tool](https://scootersoftware.com/) to speed up that process and ease the pain of diffing the goods.

---

This one and the patch trickery described above should get you going as a `jison` / `jison-gho` developer.

### And before we leave you at the controls...

> Do note that the kernel code sections are compiled into the application using scripts, which are invoked by the makefiles at the appropriate times.
> 
> `lib/jison.js`, for instance, MAY look like an original source file, but a large part of it is injected by these scripts from several of the files listed below. 
> 
> Ditto for the `packages/jison-lex/regexp-lexer.js` source file.
> 
> ---
> 
> A quick glance at where the **Source of these Sources** resides: <sup>as taken from [the otherwise unrelated issue tracker comment here](https://github.com/GerHobbelt/jison/issues/59#issuecomment-728311164)</sup>
> 
> > The lexer and parser kernel codes in bleeding edge have been separated out into separate JS files to make life a little easier for me:
> > + lexer kernel code is in `packages/jison-lex/jison-lexer-kernel.js`
> > + lexer kernel error "class" definition is in `packages/jison-lex/jison-lexer-error-code.js`
> > + the above two chunks would end up in any generated lexer. `jison-gho` doesn't do any serious feature stripping in the lexer *YET*.
> > + parser kernel code is in `lib/jison-parser-kernel.js` -- this one is postprocessed by a regex-based "intelligent" (*koff koff koff*) feature stripper in the code generator.
> > + the parser error "class" is in `lib/jison-parser-error-code.js`
> > + the parser default `parseError()` function is in `lib/jison-parser-parseError-function.js`
> > + `jison --main` will also inject a default "main()" code chunk to run the parser as if it were a (very simple) CLI app: this code is in `lib/jison-parser-commonJsMain-function.js`
> > + helper APIs, etc. which are included in every parser class are located in `lib/jison-parser-API-section1.js` -- with the single top line `const API =` being there to make `eslint` *et al* happy.
> > 
> >   That line will be stripped off *before* being dumped in a generated parser.
> > + all the above stuff is included in more-or-less stripped-down form in a generated parser+lexer output by `jison-gho`.
     <sup>Have a look at a generated parser and you'll recognize the various chunks in there coming from these files.</sup>
> > \[...\]
> > 
> > Anyway, that's how `jison-gho` is "organized".
> > 


## Running tests

Run tests with:

    make test

Run the examples in `/examples/` with:

    make examples

Several other `make` targets are available. Alas, it's RTFC for now: open the `Makefile`s to have a look.


## Building the site

To build the site, as well as the Browserified web version of Jison, run:

    make site

Then you can also preview the site by doing:

    make preview

Note that you will need `nanoc` and `adsf` in order to build/preview the site. `gem install` them if you haven't.

> ### Note
>
> The `make site` build command will print a WARNING message when `nanoc` is not available,
> but WILL NOT fail the `site` build task. This behaviour has been specifically chosen to
> allow (pre)release build runs to complete and deliver a new jison revision when everything
> but the web pages has compiled successfully.
>


## Building a new (beta-)release

Bump all packages' versions (revision/build number: the **fourth** number in the SEMVER) by running

	make bump

which will patch all `package.json` files.

You can now run

    make
    make site

to build all files, but when you want to be absolute sure and/or need to update some of the core files using your latest jison compiler, then push jison and all its submodules to github and run

    make superclean

which will nuke 100% of the installed NPM packages, *including* jison's dependency upon *itself*.

Next you must re-install the npm packages, which will fetch these from the repositories:

	make prep

and then execute your regular full-build command:

	make site

When you are happy with the result, you can apply the new (previously bumped) version as a TAG to the current commit (which is not necessarily the commit where you ran `make bump` if you found some stuff to do along the way here ;-) ):

	make git-tag


### Doing all this in one go

You can accomplish all the above (and a few other cleanups and checks along the way) by invoking
the bash shell script:

```
./git-tag-and-bump-and-rebuild.sh
```


---


## TL;DR

Run these commands to bump your version, nuke all installed NPM packages and thus erase any and all dependencies on some older bit of jison; then fetch the latest of the repositories and build all:

	make bump

	make superclean
	make prep
	make site

	make git-tag

---
