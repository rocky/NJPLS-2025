Anyone for a talk on Debuggers or Decompilers

have been working on compilers, debuggers, and most recently decompilers for the last 30 years or so. I have written debuggers the POSIX shells (bash, zsh, ksh), GNU Make (!), and more conventional programming languages like Python, Ruby, Perl, and most recently, an open-source Mathematica. I have also written a couple of decompilers too. The code for some of these (but not all!) is collected at https://github.com/Trepan-Debuggers


Even though debuggers and decompilers are as old as programming languages, one constant thread I encountered is how little there is written or discussed about these topics in general. You might glibly assume that this is because it is all ad hoc and there is no theory. I submit that this is not necessarily so.

At one time, compilers could have been thought of like that too: ad hoc. Then the Dragon book came out, and now parser and lexical-analysis generators are pretty standard

Also standard:
* an Abstract Syntax Tree
* Code generation via an intermediate language (e.g., LLVM, JVM, WASM)

Nowadays, a compiler or interpreter is typically written in a graduate-level compiler course.

There are well over 40 books on compilers, but for decompilers, I can find but two, and the same can be said for debuggers as well. In contrast to compiler books which span many editions and translations into other human and implementation languages, except for maybe one, no book on debuggers has survived more than the initial edition, and none for decompiler books.

But here's the thing... in my experience debuggers and decompilers are important. And there are certain things a programming language designer might do or consider to make debugging possible or better.

-------------------
