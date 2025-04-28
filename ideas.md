Ideas
-----

* Feynman quote on talking about something old rather than new and obstruse and novel
* Optimizing compiler excuse. Analogous to NP complete. (Hamiltonian example). Optimization can log optimizations performed:
  - overall
  - on a function
  - on a region of code (noted by source code info).
  In short, make an _effort_ to be helpful.
* Importance of debuggers and good error messages. (In production environments, e.g. financial markets, for sysadmins).
* how position information improves when a debugger is added.
* `bashdb` `TRAP` behavior and how that's wrong as a debugging callback.
* `ddd` experience by following `gdb` in `bashdb` for "yes" and "no"
* The wrong position of a multiline string (at the end) in Python and Ruby and how that was noticed and fixed independently
* Using the Jane Street Annotation OCaml `sexp` library and the notion of a container.
* Offer to give talk or class in compiler class or seminar talk.

- Find paper on compacting debug info
- mention go's "Pos" for compacting.

Survey. Find out and go over
-----------------------------

Taught course on compilers? If so, mention debuggers or runtime support for debuggers. Decompilers?

Have written or worked on a compiler or interpreter. Compile to machine code? Compile to bytecode? Tree evaluator?

Have written or worked on a debugger?
Have written or worked on a decompiler?
Have used Jane Street Library sexpr. If so, have used Annotate submodule?

Implementing
------------

Interpreters versus compilers.
Debugger structure
Debugger as callback pass event and have a way to get the frame (pc, call stack, environment)
Location: Line vs. column vs. range. Noting end inside DWARF.
Variable info.
Problem of compact information. Find reference for large debug tables. Etherium representation Jane-street representation.


Decompilers?

References
----------

* rocky.github.io
* Ubuntu NYC conference on debuggers
* Dyla 2010
* Pycon Columbia talk
* BlackHat Asia 2024
* Dwarf standard
* Decompiler paper and talks
