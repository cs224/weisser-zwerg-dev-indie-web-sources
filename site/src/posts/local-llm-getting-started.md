---
layout: "layouts/post-with-toc.njk"
title: "Running AI Models on Your PC: A Guide to Local Large Language Models (LLMs)"
description: "Setting Up AI Models on Older Hardware - A Beginner’s Guide to Running Local LLMs with Limited Resources"
creationdate: 2024-10-26
keywords: local llm, ollama, gpt4all, vllm, qwen 2.5, llama model, ministral, AI on PC, local large language models
date: 2024-10-26
tags: ['post']
---

## Rationale

Recently, I read a blog post titled [Alibaba Releases Qwen 2.5 Models, Raising the Bar for Open-Weight LLMs](https://www.deeplearning.ai/the-batch/alibaba-releases-qwen-2-5-models-raising-the-bar-for-open-weight-llms/).
This release sparked my interest in testing out these open-weight LLMs myself.
Therefore, I decided to see how they would run on my older 2017 PC, which has a [GeForce GTX 1080](https://www.nvidia.com/en-ph/geforce/products/10series/geforce-gtx-1080) graphics card with 8GB of VRAM.
If you're curious about running AI models on your own hardware, this post walks through my findings and shows what you can achieve even with older equipment.

## The Python Way

The first route to running a local Large Language Model (LLM) that we'll discuss involves using the programming language Python. As you delve into this approach, you'll gain insight into what's happening behind the scenes.

If your primary goal is to get started with a local LLM without diving deep into development details, feel free to skip ahead to later sections where alternative routes are described.
These alternatives cater specifically to individuals who aren't developers but still want to leverage the power of local language models.

### Setting up the environment

Before we begin, ensure that Conda is installed on your system. If not, refer to the [Installing Miniconda](https://docs.anaconda.com/miniconda/miniconda-install) guide to set it up.

We begin by creating a new conda environment named `ai`:

```sh
conda create -n ai python=3.11 -y && conda activate ai
```

Now, install the necessary Python packages for our project:

```sh
pip install torch
pip install git+https://github.com/huggingface/transformers
pip install git+https://github.com/huggingface/accelerate
pip install huggingface_hub
pip install --upgrade vllm
pip install --upgrade mistral_common
```

For a more interactive experience, I recommend using Jupyter Notebook. You can also directly input your Python commands into the interpreter prompt if that's more comfortable for you.
Let's go ahead and install the required Jupyter Notebook Python packages[^jupyternotebooktherightway]:

```sh
conda install -c conda-forge --override-channels notebook -y
conda install -c conda-forge --override-channels ipywidgets -y
```

Now we are ready to start the Jupyter Notebook:

```sh
jupyter notebook
```

#### Optional: Customize Jupyter Notebook cell width for a wider screen

I personally use a wide-screen monitor and prefer that my cells take up more space than the default settings.
For [Jupyter version 7](https://stackoverflow.com/questions/77030544/how-do-i-increase-the-cell-width-of-the-jupyter-version-7), you can do that by creating a `custom.css` file at `~/.jupyter/custom`:

```sh
mkdir -p ~/.jupyter/custom
echo "
.jp-Notebook {
  --jp-notebook-max-width: 70%;
}
" > ~/.jupyter/custom/custom.css
```

### Get Your Tokenizer Ready

First, you'll need to obtain a tokenizer. You can do this by copying and pasting the following Python code into a Jupyter notebook cell or directly into the Python interpreter prompt.

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

# model_name = "Qwen/Qwen2.5-7B-Instruct"
model_name = "Qwen/Qwen2.5-0.5B-Instruct"

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype="auto",
    device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained(model_name)
```

For our example, I've chosen to use the smallest qwen2.5 model with 0.5 billion parameters for faster processing. However, you can explore other models in the Qwen family on their [HuggingFace](https://huggingface.co/Qwen) site if needed.

### Communicating with the Language Model (LLM)

Now that we have our tokenizer and pre-trained model set up, let's interact with the Large Language Model (LLM) as follows:

```python
prompt = "How many r's are there in the word 'strawberry'?"
# prompt = "﻿Take the word 'strawberry' and enumerate each letter on a separate line and prefix it with the number 1.. up to the length of the word. Look at the result and tell me the prefix numbers of the letters 'r'. Look back at the result and tell me ﻿how many r's are there in the word 'strawberry'?"
# prompt = "Which letter appears most in the word 'Volleyball'?"
# prompt = "Write 10 sentences ending with the word beauty."
# prompt = "Write me a research paper on dataset preparation for an AI model. Come up with some new idea. Give as much detail as possible."

messages = [
    {"role": "system", "content": "You are Qwen, created by Alibaba Cloud. You are a helpful assistant."},
    {"role": "user", "content": prompt}
]
text = tokenizer.apply_chat_template(
    messages,
    tokenize=False,
    add_generation_prompt=True
)
model_inputs = tokenizer([text], return_tensors="pt").to(model.device)
generated_ids = model.generate(
    **model_inputs,
    max_new_tokens=512
)
generated_ids = [
    output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
]
response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
print(response)
```

Great job! You now have a basic understanding of what it takes to get a local LLM running. To recap: load a pre-trained model from [HuggingFace](https://huggingface.co) or similar platforms in a format compatible with your system, and follow the specific instructions provided by the model creators for interacting with the model.

## Interlude: Sharding and Quantization

In this section, I'll discuss the process of sharding and quantization for large language models. For a more detailed explanation, you can check out [Which Quantization Method is Right for You? (GPTQ vs. GGUF vs. AWQ): Exploring Pre-Quantized Large Language Models](https://newsletter.maartengrootendorst.com/p/which-quantization-method-is-right).

When training large language models, it's crucial to work with floating point numbers of sufficient [precision](https://blog.demofox.org/2017/11/21/floating-point-precision). Higher precision means better approximation of the number you have in mind but at the cost of increased memory usage. During the training phase, high precision is important for [gradient descent](https://en.wikipedia.org/wiki/Stochastic_gradient_descent) algorithms to function well. However, once the model is trained and used for inference (providing answers), higher precision isn't necessary. You can lower floating point precision significantly without noticeably affecting the pre-trained LLM's performance.

As we aim to run a large language model on moderate hardware with limited resources, we need a model with several billion parameters but want to fit it into our available 8GB of VRAM.
This is where quantization comes in. The article mentioned above will guide you through the process of quantizing models yourself using Python and discuss sharding as another technique for fitting large models into smaller VRAM amounts.

Fortunately, there are helpful individuals who have already done the hard work for us!
Quantized model results can be stored in various formats; we'll use GGUF because it works well with execution engines like [GPT4All](https://www.nomic.ai/gpt4all) or [Ollama](https://ollama.com).

Go ahead and download the pre-quantized model `Qwen2.5-7B-Instruct-Q5_K_L.gguf` from HuggingFace [bartowski/Qwen2.5-7B-Instruct-GGUF](https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF). That is the [Q5_K_L](https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF/blob/main/Qwen2.5-7B-Instruct-Q5_K_L.gguf) version.

### A note about llama.cpp

[llama.cpp](https://github.com/ggerganov/llama.cpp) is a framework designed for running large language model (LLM) inference in C/C++. It serves as a backend for execution engines like[GPT4All](https://www.nomic.ai/gpt4all) or [Ollama](https://ollama.com). While you can use it directly, its user interface might be more complex.

## Footnotes

[^jupyternotebooktherightway]: Look at [How to set up Anaconda and Jupyter Notebook the right way](https://towardsdatascience.com/how-to-set-up-anaconda-and-jupyter-notebook-the-right-way-de3b7623ea4a) for more details.
