Preamble
---------

"I'd like to talk about a part of physics that is *known* rather than unknown. People are always asking form the latest developments in the unification of this theory with that theory, and they don't give us a chance to tell them about the theories we know pretty well."

Richard Feynman in the introduction of QED (Quantum Electrodynamics)


Survey
------

Let me start off with a little Survey.

[Fill in]


Overview
--------

Today, I'd like to talk a little bit about what a compiler needs to do to provide error position information at run time. And what is needed to support run-time debugging.
Clearly, there is a lot of knowledge contained inside the code of virtually every industial-strength compiler for this.

However, I don't think you'll find this available or packaged in a form that someone starting writing a compiler just pick up and use.

Compare this with vast amount of information on writing a compiler, structuring it into phases consisting of scannering, parsing, producing intermedate code, and then either interpreting this or producing low-level code from the intermediate language. Not only is there a broad description of how to write a compiler by breaking compilation into phases, but there is a lot of detail for how to write each of those phases.

Here are some popular current books on compilers.

None of these, as far as I know have anything regarding run-time support for debugging, let alone debuggers.
One of the books on advanced optimization, mentions that optimization can obscure mapping from the source text to the code.


Okay, so we have a challenge here. But no mention on how that challenge can be addressed.

It reminds me of the NYC policeman stationed at a street closures who only knew where *couldn't* go, but was clueless in helping me figure out how I could get to where I need to get to.

Or in the old declaring a problem NP-complete as an excuse for not providing *any* algorithm for accomplishing what needed to be done.

By the way, In the face of even highly-optimized code, there is a lot of information a compiler *can* provide to assist understanding where in the program the computer is at any given point. I'll describe some of this later.

Importance
----------

But is providing runtime position information or debugging support even necessary? Nowadays, we have computer-assisted program verification systems, there is Test-Driven Development (TDD) or Behavior-Driven development and you can write continuous integration test suites. And can't you just put "print" statements into your program, possibly turned on when a "debug" or "log" flag is given.

In some situations, this might be acceptable. However, there are certain mission-critical environments where this kind of thing isn't enough. For example you are sending a satellite into space. You've done everything to prove that the code is flawless and can't occur. But an error occurs anyway, and a subsystem crashes. (Maybe it was gamma rays).

The satellite is in motion, and if the problem isn't fixed quickly a million-dollar mission might be aborted.

Okay, maybe that's rare. But how about here in the finanical markets and trading? When an error occurs in a system, you want to pinpoint and understand the problem quickly. And if that isn't done quickly, again, money is lost.

[slide: Equation 1: t == $  (Time is money).

After leaving IBM Research, I worked in an environment like this. I was a systems administrator. Basically, a high-tech boiler operator. Because I could build such diagnostic tools to pinpoint errors in code that *others* wrote, I suspect was a big part of the reason that they gave me a $20K at the end of the year.

Position Information
--------------------

Now let's dig into details.

I am going to talk only about associating source-text position information with the code that gets run. This part is pretty is needed in both compilers that produce machine code and interpreteres which work off of some intermediate representation, such as an bytecode or some sort of tree representation.

When the end result is machine code which is produced by a compiler, there is also the problem of associating memory and registers with specific source-code variables or literals that possibly have a specific type.

Technically, what we want to have at runtime is a mapping from a given instruction to some source code text. The domain or result of looking up an instruction I will call a *position* in the source text.

But what is a position?

Informally, it like a street address, like  250 Vesey St, New York, NY.

Street addresses are hierarchical. 250 is a building number on Vesey Street. Vesey Steet is one of the Streets in New York City. And NYC is one of the cities in New York.

Although, I don't think this idea has been widely disseminated for progarms, a position inside programs I think should be thought of as being hierarchical too. I'll say more about this later, but the first broad subdivision is between *container* of the position, and the *location* inside that container.

The source text of a program can come from a number of places, and it is useful know where it came from. The most common situation is a file in a file system. But the program could have also been entered interactively. The program might be a member inside an archive-format file. In Java, "jars" hold Java classes. In Python, "wheels" are compressed zip-formatted archive files.

Another possibility is a string or AST data-structure created inside a program at runtime. Some old AI self-learning systems did this.

HTML templating systems for Web frameworks might generate code in a high-level language, like Python or Javascript. Wikipedia lists over [30 or so web templating engines](
https://en.wikipedia.org/wiki/Comparison_of_web_template_engines).

What I see here, at least for Jinja inside Python Django project is that the location is with respect some auto-generated Python code. Translating that location back to a location inside the templated Jinja HTML code is unspecified. Here is a case where one might want to make use of the hierachical nature of positions. That is, note that some position in Python source text corresponds to some particular position inside a web template.

Container-like issues
----------------------

The reason we want to store a container name is so that debuggers can find the source text or so report that container in an runtime error message. Often the file mentioned will be opened and the source position will be shown in a debugger or in such an error message.

But this opens up the possibility for another problem: the source text that the compiler or interpreter read the program isn't the same as what the programmer or rather programmer's IDE sees.

One common example of this kind if situation is when source text has been modified since the time that the compiler or interpreter read the source text. It also happens in remote debugging - you are debugging some code server that is not the computer that is running an IDE from which you are viewing the code. It can happen in Continuous Integration where the server running the testing checks out from a version-control-system, like *git*, a version of the code that is different from what a person might have installed locally.

One way to detect this problem is to store a checksum or hash of the source text. Python has the ability to store a SIP hash inside bytecode for the purpose of making sure source code matches. Python selected the SIP hash to be relatively fast, while also keeping the possibility of for hash collisions low.

Another possibility that is sometimes used, is to store the source text inside a debug file. The debug tables for Etherium Solidity work this way. The downside of this is that it might lead to huge debug files. Solidity programs however are generally very short

Another technique used a bit in remote debugging is to have the the source text sent across the network on request. So a local IDE doesn't try to access the source text in certain cases, even if the source text exists locally. A downside of this is that a lot of information might be passed over the network if you are not careful and information isn't cached.

Note that mismatches might also be detected due to mismatches in the hierarchy surrounding a container. A file name might be indicated, but not the directory the file is under, or on the same underlying storage (the file might be on a different require a machine name, or git repository checkout version. In the street address analogy, there are other building named 250 but not 25 Vesey Street. And there can be other 250 Vesey Streets, just not in New York city.

Location inside a container
---------------------------

Now that we've described containers we can focus on the part that most people think of when talking about a position: the location inside that container.

Historically, a location inside a program was a line number. But using line numbers is pretty crude.

I recently gave a lecture in a compiler class showing how to beef up the compiler they were writing for the class so that it tracked positions. In their compiler, programs could only be one line long!

So to saying that there's an error on line one is basically saying there's an error somewhere in the program and is of no help.

Lest you think this rare. Here is an error reported from Python 3.12:

```
$ python
Python 3.12.10 (main, Apr 25 2025, 08:59:20) [GCC 13.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> x, y = 1, 0
>>> 6 / x / y
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ZeroDivisionError: float division by zero
>>>
```

I am pleased to report that in Python 3.13 this has been corrected, *somewhat*. The line is still reported as line one but there is now a cursor on the specific division that caused the problem.

Why it took over 25 years for Python to address something like this is sad. And if you try the same thing in Ruby or Perl. You'll get something similar to the pre 3.13 behavior where you get a line number with no indication *where* on the line, which divide, the problem lies. (Javascript will say the computation is Infinity, so I can't compare its behavior using this example).

Nowadays, the trend in more enlightend compilers is to move to the more finer-grained location by giving both line and column number (inside a container). This certainly helps in that example where one might wonder which of two divides an error is coming from.

But more useful is note a position as a range of text from the start and end position. The Jane Street parsing library for S-Expressions has this. So let's take a look at this.

Since looking at output can get long quickly, I am just going to show some the most trivial exmaple, parsing a single atom. Even though this is simple, it's enough to get the idea.

[Run sexp. example]

Everything I show here you can replicate yourself; no special setup is needed other than having OCaml installed and the "sexplib" imported.

I'm just showing the difference between *Sexp* and *Sexp.Annotated*, which is coming up next.

There's what you get now.

And if you jut put in that *Annotated* in there, you get that instead.

Here, I have copied the output line, and I reformatted it. So it is easier to understand.
*Sexp.Annotated.Atom* goes from being a string into now a tuple. And the first element of this tuple is this is a *range*.

And that range has a start position and it has an end position.

Now lets look at the definition of an expression inside the interface module *sexp_intf.ml*.

There's a type defined *t* whether you're using *Sexp.Annotated* or *Sexp*.

And that can be either an *Atom* or a *List* and that doesn't change.

But both *Atom* and *List* are  a tuple objects.

In contrast to when you omit "Annotated", they have that extra <i>range</i> part in them.

A range is two *pos*'s.

And a <i>pos</i> are these three things
* a line number,
* a column number,
* and an offset.

The offset is basically a compact way to indicate both a line number and an offset as one number — the number of byte from the start of the program.

But what's interesting here is that nowhere in here, do you see information about a container. As a user of this library, you have to keep track of the container outside.

Also, this library assumes that each parsed item lives in the *same* container. This kind of thing would not be true in a C-like language where there is macro form tokens and parsable text fragments from many different "#include" files. However C and C derivatives are a little bit odd in this respect. Most programming languages do not allow this kind of mixed filename, or more generally, container, inclusion.

What we see here, is that the Jane Street's scanning and parsing library marks regions of text, called "ranges". If you are writing an interpreter, you typically control the way debug information is stored. So saving the entire range can be done. Many interpreters such as for Python, Perl, or Ruby don't do this though. But Etherium Solidity's debug tables do in fact capture this.

I you are compiling to machine code, the position information will need to invariably be stored DWARF format which does not support rangess.

What is DWARF? Dr. Brian Russell at Bell labs designed and implemented this debugging format and humorously named it "DWARF" to go along with the ELF which is an object deck format. He proposed the "Debugging With Arbitrary Record Formats" as a backronym. Even though the ELF format is not used on OS's like MacOS and and MS Windows, the debugging format they use is still DWARF.

DWARF does not support mapping an instruction to a range of source text, but one thing that can be done is to mark the ending instruction.

Can anything be done to get more accurate position numbers in those programming languages that only report line numbers, like Perl or the versions of Python for the first 25 years? Actually, yes.


What I have done for both of these, is write a decompiler. This starts out with the code produced and reconstructs source code. This is easier done when high-level bytecode is involved as in the case of Python, or where the interpretation is done on a tree structure which happens in Perl5 and Korn Shell.

After writing the decompiler, I then hooked this into a gdb-like debugger.

Let me show this...

First I show the source text. It is what we had before but put into a string that is evaluated at runtime. with two divide in them where one of the divisons raises a *ZeroDivision* error.



Mention it used in my Python debugger's decompile command.
