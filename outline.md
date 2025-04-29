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

  - Include a way to get the container in a positions. Note: Containers don't change that often, and sometimes they stay the same for an entire program.
    But see for example how DWARF handles this, or etherium solidity.
  - Have a way to verify the source text that the user sees is the one that the compiler used.
  - Use better granularity in positions than a line number. line column (or offset), and better yet consider ranges.
  - Design Keeping in mind how one might add a debugger. Adding a debugger generally forces more accurate positions.
  - If you do write a debugger, please don't invent a new command-language and terminology. Please follow one of the existing debuggers that exist. I have used `gdb`.
  - If you are using bytecode consider adding a DEBUG opcode which runs a "breakpoint" callback.
