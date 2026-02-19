ank@trifork.com
tartanllama@gmail.com>

---

Background is in debuggers and compiers for GPU's - what do you know about Mojo?

Stack unwinding and differences with archtectures - doesn't gdb have a library for this?

Compatibility across version xdis (libcdio).

Threading...  processes and/or threads in Windows and Linux (Tasks)

-----

Live in different worlds: compilers side version OS side
interpreters vs machine code.


-----

Note to self
-------------

Memory breakpoints: how to do in Python (object breakpoints)?
Note inline frames, interrupt handlers, stack unwinding.

Note for MaPLe - look at how stack frame is implemented.

Book
----

Note sdb existed in Unix. It referred to the stream debugger. I would have used sydb. And that's kind of another thing as an old timer, have been more sensitive to. I now will err on the side of clarity over cleverness.

"Compilation is a lossy". I know what you mean, but to me this hides and fuzzes over what to me is an important truth. Compilation is *not* lossy for the part is considered important: the semantics. The compilation process does not have to be lossy. A compiler can chose to copy the entire source text into debug information. And then, there is no loss whatsoever.


--------------

Hi -

Recently I gave a short talk at for a local programing seminar group on What Compiler Writers should know about Runtime Debugging support. Through that and Mike Shah I came across https://www.youtube.com/watch?v=lWPLgm52ICs and I watched and like that.

It feels like we are in parallel worlds, tugging at the same or similar problem(s) from different directions.

My current focus has been on trying to get compiler writers and books on compilers to be aware of how to provide useful information for debuggers, and secondarily common aspects of debuggers. My goal has been to treat debugging as a general topic in the same way one might treat a compiler. The most popular books on compilers that are used in universities are totally silent about what a compiler write needs to do to make the compiler system more amenable to debuggers, profilers, or tracing tools.

So when I hear that this book is teaching a person about OS system level stuff, while that is neat, it is coming at the topic from the other direction.

My own personal take, which I said in the talk, is that this feels like a couple of places I worked were the was a department of computer backups and another department of computer restores. The backup department was the group to work in; it was a relaxed and casual environment while the department of restores was always under pressure and could never get its act together.


I have written a number of debuggers (GNU Make, bash, and more generally the POSIX shells (ksh, zshdb), Perl5, Python. What's different here is that these are (largely) interpreters. They live in an easier world. So when you commiserate about the limitations and difficulty ptrace and DWARF, that largely does necessarily not apply to interpreters. Interpreters define their own runtime environment. And in Python in particular, there have been huge changes to the runtime environment between one release and the next.

Okay. So a couple of things. For Sy, I have a lot comments on the book. Down the line, if this goes into a revision, I'd be happy to offer thought and suggestions. However you might find these a little too picky and I think they'd change the book too much. The first statement I came across is: "Compilation is a lossy".


I know what you mean, and in a broad sense it is true and gets across an commonly-experienced misconception that many people have regarding what debuggers can provide.

But to me this, if you want to be fully honest, it hides and fuzzes things. Compilation is *not* lossy *and can't be* for the part is considered important: the semantics. So if names are lost, well, names of variables used aren't part of the semantics. A compilation process is not *necessarily* lossy, it might be *convenient* but not necessary. Interpreters which intpret off of a high-level intermediate form does preserve the names of variables and the types for example.

And even going to machine code, a  compiler can chose to copy the entire source text into a string table somewhere and put it in debug information. So here there is no loss whatsoever.

Lest you think this weird, the Solidity compiler for Ethereum in fact does this when debugging is turned on! (Solidity programs are pretty short).

If this is too picky, yeah, I understand. But there is a part of me that feels getting at debugging as a topic needs more work.

As for Tim, if you are looking for material you want the Alice and Wonderland view from the other side, e.g. interpreters and compilers, I'd be happy provide content of some form.

The recent talk I gave I was not recorded and I don't have the slides in a form I want to share yet. At some point though I'll record and make it available.

However the material in longer form is at https://vimeo.com/1073214507. It is long because the class was supposed to be 75 minutes. The middle part is very specific to the course compiler and probably not of interest. So I have broad section marks. (And use the transcript of subtitles if you have problems understanding what I say).

One thing I find interesting here is that you'll see that even though we are talking ostensibly about the same things, there is almost no overlap between this and "Building a Debugger!"
