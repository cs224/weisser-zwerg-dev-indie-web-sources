---
layout: "layouts/post-with-toc.njk"
title: "ChatGPT - Open AI API for Proofreading Markdown Blog Posts"
description: "How to use the Open AI ChatGPT API to proofread and correct the sections of a markdown blog post."
seodescription: "Proofread Markdown blog posts with the OpenAI ChatGPT API: split Markdown sections to fit token limits, fix grammar and spelling, and review diffs with Redlines."
creationdate: 2023-05-08
keywords: ChatGPT, Open AI, API, proofread, correct
date: 2023-05-08
tags: ['post']
draft: false
---

## Rationale

Recently, I had the opportunity to participate in the free [ChatGPT Prompt Engineering for Developers](https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers) course by Andrew Ng and Isa Fulford.
This course reignited my interest in using AI to fine-tune my writing. While tools like MS Word can catch simple grammar and spelling mistakes, I wanted an AI that could take my writing to the next level.
I wanted to create a more compelling and engaging reading experience for my audience. In this blog post, I'll share my first steps towards achieving that goal.

For the impatient readers among you looking at the following [Jupyter notebook](https://nbviewer.org/gist/cs224/92b6f7dd9f0a1d131b47dc6a82a818a4)[^gist] might provide all the information you need.

## Get Started

To begin with, you'll need a paid account on [platform.openai.com](https://platform.openai.com/) to access the API version of ChatGPT. While some users have already received beta access to `GPT-4`, for our purposes, we'll be using `gpt-3.5-turbo` with the API,
which is more than sufficient. Don't worry about the costs, as it only amounts to a few cents, even for extended usage of the API. In fact, I've never spent more than $1 so far. To give you an idea, all my efforts for this blog post only cost me USD 0.02.

Once you have access to [platform.openai.com](https://platform.openai.com/), the next step is to create an API key and add it to a `.env` file, like this:


```
OPENAI_API_KEY=sk-...
```

## The Code

### Jupyter Notebook / Python Init

I am using a [Juypter](https://jupyter.org/) notebook and python to access the API. The below explains step by step what I was doing.

You start by setting up the API and defining a helper function:

```python
import openai
import os

from dotenv import load_dotenv, find_dotenv
_ = load_dotenv(find_dotenv()) # read local .env file

openai.api_key  = os.getenv('OPENAI_API_KEY')

def get_completion(prompt, model="gpt-3.5-turbo", temperature=0):
    messages = [{"role": "user", "content": prompt}]
    response = openai.ChatCompletion.create(
        model=model,
        messages=messages,
        temperature=temperature,
    )
    return response.choices[0].message["content"]
```


After that I defined a little markdown text block as a playground. **Replace the single backtick, single quote, single backtick sequence with a triple
backtick sequence**:


```python
mark_down = '''
# Header 1
Some text under header 1.

## Header 2
More text under header 2.

`' `python
import pigpio

handle = pi.i2c_open(1, 0x58)

def horter_byte_sequence(channel, voltage):
    voltage = int(voltage * 100.0)

    output_buffer = bytearray(3)

    high_byte = voltage >> 8
    low_byte  = voltage & 0xFF;
    output_buffer[0] = (channel & 0xFF)
    output_buffer[1] = low_byte
    output_buffer[2] = high_byte

    return output_buffer

v = horter_byte_sequence(0, 5.0)
pi.i2c_write_device(handle, v)
`' `

### Header 3
Even more text under header 3.

## Another Header 2
Text under another header 2.
'''
```

### Split Markdown at Headings

Having a [syntax](https://daringfireball.net/projects/markdown/syntax) reference for Markdown close by is always helpful. As you can read on
[learn.microsoft.com](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/how-to/chatgpt?pivots=programming-language-chat-completions):

> The token limit for gpt-35-turbo is 4096 tokens. These limits include the token count from both the message array sent and the model response. The
> number of tokens[^numtokens] in the messages array combined with the value of the max_tokens parameter must stay under these limits or you'll receive an error.

This means that you can't send your entire blog post in one go to the ChatGPT API. Instead, you have to process it in pieces. This approach will also
make it easier for you to integrate the AI's suggestions into your blog post later on.

After some searching, I found that it wasn't as easy as I hoped to find a Python library that would allow me to easily split the input blog post at headings.
Eventually, I settled on using [markdown-it-py](https://github.com/executablebooks/markdown-it-py). However, `markdown_it` is meant to be used to translate Markdown-to-HTML and out of the box does not work as a Markdown-to-Markdown converter.
After some digging, I found at the bottom of its
[using](https://markdown-it-py.readthedocs.io/en/latest/using.html) documentation page that you can use
[mdformat](https://github.com/executablebooks/mdformat) in combination with `markdown_it`.

Additionally, I remove any `fence` token that does not belong to the standard text flow of the blog post. This results in the following helper function:

```python
import markdown_it
import mdformat.renderer

def extract_md_sections(md_input_txt):
    md = markdown_it.MarkdownIt()
    options = {}
    env = {}
    md_renderer = mdformat.renderer.MDRenderer()

    tokens = md.parse(md_input_txt)
    md_input_txt = md_renderer.render(tokens, options, env)
    tokens = md.parse(md_input_txt)

    sections = []
    current_section = []

    for token in tokens:
        if token.type == 'heading_open':
            if current_section:
                sections.append(current_section)
            current_section = [token]
        elif token.type == 'fence':
            continue
        elif current_section is not None:
            current_section.append(token)

    if current_section:
        sections.append(current_section)

    sections = [md_renderer.render(section, options, env) for section in sections]
    return sections
```

If you're wondering about the double call to `md.parse()`, I'm not entirely sure if it's necessary, but I noticed that some `fence` tokens might be missed otherwise.

Now, you can try the splitting function on our dummy Markdown text block:

```python
sections = extract_md_sections(mark_down)
for section in sections:
    print(section)
    print('---')
```

and see the following result:
```
# Header 1

Some text under header 1.

---
## Header 2

More text under header 2.

---
### Header 3

Even more text under header 3.

---
## Another Header 2

Text under another header 2.

---
```

### Multi Step Prompts

Now you can walk through every section one by one:

```python
from redlines import Redlines

i = 0
print(sections[i])
```

The first prompt should extract the raw text from the mix of markdown and HTML markup:


```python
prompt = f"""
Below a text delimited by `'` is provided to you. The text is a snipet from a blog post written in a mix of Markdown and HTML markup.

As a first step extract the pure text. In this first step keep the markup for ordered or unordered list but pay close attention to remove all other markup and especially ignore embedded images no matter if the images are embedded via Markdown or HTML tags.

As a second step use the output of the first step and ensure that newlines are only used to separate sections and at the end of enumeration items of an ordered or unordered list.

Provide as your response the output of the second step.

`'`{sections[i]}`'`
"""

response = get_completion(prompt)
print(response)
```


The second prompt will focus on the bare minimum to make the text grammatically and spelling wise correct:


```python
prompt = f"""Proofread and correct the following section of a blog post. Stay as close as possible to the original and only make modifications to correct grammar or spelling mistakes. Text: ```{response}```"""
response2 = get_completion(prompt)
print(response2)
```

We can use the [redlines](https://github.com/houfu/redlines) python package to display a visual diff of our original version and the corrected version:

```python
diff = Redlines(response,response2)
display(Markdown(diff.output_markdown))
```

Finally, we want an improved version of the text:


```python
prompt = f"""
Below a text delimited by triple quotes is provided to you. The text is a snipet from a blog post.

Walk through the blog post snipet paragraph by paragraph and make a few limited yet impactful changes for a smooth and engaging reading experience targeting a technical hobbyist audience.

Text: ```{response2}```
"""

response3 = get_completion(prompt)
print(response3)
```

The output of this final prompt will be so far away from our original input that the use of the `redlines` library does not make sense anymore. You
will have to pick and choose based on your own taste which improvements you want to integrate into your solution or not.

### Using GPT-4 for Prompt Engineering

While you don't have access to GPT-4 via the API yet, you can have access to it via the paid (20 USD per month)
[chat.openai.com](https://chat.openai.com/chat) interface. I was trying to use it to improve my prompts from above. Here are a few examples:

Input:

> Below, between triple quotes, I will provide to you a prompt that is meant for a Large Language Model AI to produce a better version of a human written text. Rewrite the prompt to be maximum effective.
> ```Proofread and correct the following section of a blog post. Stay close to the original in length and style, but make it more compelling where it helps the flow of reading. Ensure it targets an advanced reader.```

ChatGPT:

> Revise the following blog post excerpt, maintaining its original length and style, while enhancing its appeal for a sophisticated audience. Ensure a
> smooth and engaging reading experience by proofreading and correcting the text as needed.

Input:

> Ensure that the LLM AI makes only a small number of modifications.

ChatGPT:

> Refine the following blog post excerpt with minimal alterations, preserving its original length and style, while enhancing its appeal for a
> discerning reader. Make limited yet impactful changes for a smooth and engaging reading experience.


In the end these modified prompts created wildly different output texts that were for my taste too far away from my original input text and therefore
switched to the above version that asks the AI to walk through the blog post paragraph by paragraph and make limited modifications on that reduced
scope only. But I would be happy to hear about your experiments and what worked for you.


## Footnotes

[^numtokens]: Open AI offers the [tiktoken](https://github.com/openai/tiktoken) library for you to keep track of the number of tokens processed, so
    that you can react to it programmatically.
[^gist]: https://gist.github.com/cs224/92b6f7dd9f0a1d131b47dc6a82a818a4
