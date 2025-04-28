Outline
-------

* Survey
* What I am going to talk about
* Why error reporting tracing and debuggers are important
  - High-volume production environments
* Position information
   Lines, columns, ranges
   Jane Street code.
* Debuggers
  - Debuggers for Interpreters Languages
    + eval/exec
	+ model off of gdb and bashdb ddd story
  - Debugging in Optimized code

* Suggestions

  - Think about and note a container in positions
  - Have a way to verify the source text that the user sees is the one that the compiler used.
  - Use better granularity in poistions. than a line. line column (or offset), and better yet consider ranges.
  - Adding a debugger generally forces more accurate positions
