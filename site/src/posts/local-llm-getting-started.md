---
layout: "layouts/post-with-toc.njk"
title: "Running AI Models on Your PC: A Guide to Local Large Language Models (LLMs)"
description: "Setting Up AI Models on Older Hardware - A Beginner’s Guide to Running Local LLMs with Limited Resources"
creationdate: 2024-11-02
keywords: local llm, ollama, gpt4all, vllm, qwen 2.5, llama model, ministral, AI on PC, local large language models
date: 2024-11-02
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

[llama.cpp](https://github.com/ggerganov/llama.cpp) is a framework designed for running large language model (LLM) inference in C/C++. It serves as a backend for execution engines like [GPT4All](https://www.nomic.ai/gpt4all) or [Ollama](https://ollama.com). While you can use it directly, its user interface might be more complex.

## GPT4All

[GPT4All](https://www.nomic.ai/gpt4all), developed by [Nomic AI](https://www.nomic.ai), is a tool that allows you to "Run Large Language Models Locally". You [download](https://docs.gpt4all.io/) the application installer based on your platform, run the installer and then [launch](https://docs.gpt4all.io/gpt4all_desktop/quickstart.html) the GPT4All Graphical User Interface (GUI). 

The GUI-based nature of this tool is both its strength and weakness.
On one hand, if you have a powerful computer with an appropriate graphics card, interacting with your local LLM through the familiar ChatGPT-like interface is convenient — you have everything in one place: an execution engine and a familiar ChatGPT-like GUI.
However, when working with remote machines or client-server setups without a GUI, it can be less helpful.

The application allows you to browse and download models using its own model repository, which while comprehensive, isn't as extensive as the [HuggingFace](https://huggingface.co) repository.
For our needs, we downloaded a specific model called `bartowski/Qwen2.5-7B-Instruct-GGUF` once and plan to use the `Qwen2.5-7B-Instruct-Q5_K_L.gguf` file across all of our execution engines.

To make this model available to GPT4All, place the `gguf` file in the `~/.local/share/nomic.ai/GPT4All/` folder and restart the application.
Then, select your desired model at the top of the `Chat` tab and start interacting via the chat-text input box at the bottom.
For more detailed instructions, check out the [quickstart](https://docs.gpt4all.io/gpt4all_desktop/quickstart.html) guide on the official documentation, which includes helpful screenshots.

That's essentially it!

### GPT4All on the CPU rather than the GPU

GPT4All is designed to work with both CPUs and GPUs.
While GPT4All automatically detects and utilizes your GPU if available, it's not a requirement.
If you don't have an appropriate GPU or prefer to use your CPU instead, that’s perfectly fine!
Running LLMs on your CPU will be slower compared to using a GPU, as indicated by the lower token per second speed at the bottom right of your chat window.
However, for smaller models, this can still provide satisfactory performance.

So, even without a GPU, you can still enjoy the benefits of GPT4All!

### Interlude: Making Local Knowledge Available to a Pre-Trained LLM

When you download a pre-trained LLM, it has been trained on general datasets that are large but limited. If you want to make proprietary local knowledge available to the LLM, there are two main ways: Fine-Tuning or Retrieval Augmented Generation (RAG):

1. Fine Tuning
    1. Full Fine Tuning
    1. Parameter Efficient Fine-Tuning (PEFT)
        1. LoRA
        1. QLoRA
1. Retrieval Augmented Generation (RAG)

For a more detailed understanding of fine-tuning, you can refer to the following articles: 
* For German speakers: [Feintuning großer Sprachmodelle – so gehts](https://www.heise.de/select/ix/2023/10/2322914442478696032).
* For English only speakers: [In-depth guide to fine-tuning LLMs with LoRA and QLoRA](https://www.mercity.ai/blog-post/guide-to-fine-tuning-llms-with-lora-and-qlora).

In addition to fine-tuning, there is another method called Retrieval Augmented Generation (RAG).
Here, no model weights are updated; instead, the model also accesses a type of knowledge database.
The training data is divided into blocks and converted into low-dimensional vectors, the embeddings.
The individual embeddings are stored in a vector database.
Before querying the model, a semantic search in the vector database determines the most relevant embeddings, which are then provided to the model along with the actual prompt.

To better understand what "embeddings" mean, I recommend checking out the [embeddings](https://course19.fast.ai/videos/?lesson=4) lesson from [fast.ai](https://www.fast.ai)


### LocalDocs: Chat with Local Documents

One unique aspect of GPT4All is its ability to chat with local documents that are yours.
A [LocalDocs](https://docs.gpt4all.io/gpt4all_desktop/localdocs.html) collection employs Nomic AI's free and fast on-device embedding models to index your folder into text snippets that each get an embedding vector.
This implies that the LocalDocs feature in GPT4All utilizes the Retrieval Augmented Generation (RAG) methodology for making your local data accessible to the Large Language Model (LLM).
These embedding vectors enable GPT4All to locate snippets from your files which are semantically similar to the queries and prompts you enter in your chats.
Subsequently, GPT4All incorporates these semantically relevant snippets into the prompt directed at the LLM.

### API Server

GPT4All offers a local API server that makes your Large Language Model (LLM) accessible via an HTTP API.
This API is compatible with the OpenAI API, meaning you can use any existing OpenAI-compatible clients and tools with your local models.
To start using this feature, activate the API server through the GUI (refer to the [documentation](https://docs.gpt4all.io/gpt4all_api_server/home.html#activating-the-api-server) for more details).

Here's how you can use this API server from Python using the openai python client library:


```python
import openai

def ask_openai_model(question, model="Qwen2.5-7B-Instruct-Q5_K_L.gguf", max_tokens=4096, temperature=0.28):
    client = openai.OpenAI(
        base_url="http://localhost:4891/v1",
        api_key="not-needed"  # API key is required by the client but not used
    )
    try:
        response = client.chat.completions.create(
            model=model,  # Use whatever model you have loaded in GPT4All
            messages=[
                {"role": "system", "content": "You are Qwen, created by Alibaba Cloud. You are a helpful assistant."},
                {"role": "user", "content": question}
            ],
            max_tokens=max_tokens,
            temperature=temperature,
            stream=False            
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"Error: {str(e)}")
        print("Make sure the GPT4All server is running on port 4891")
        return None
```


## Ollama

[Ollama](https://ollama.com) is another execution engine that lets you run local Large Language Models.
Unlike GPT4All, which was a GUI application, Ollama focuses on the client-server use-case.
Both engines share many similarities: they can run models on either GPU or CPU and offer an OpenAI-compatible API.

To get started with Ollama, [download](https://ollama.com) the installer that matches your platform and run it. Once installed, you can check the installation by:

```bash
systemctl status ollama.service
```

You can also explore the installed models using:

```bash
ollama list
```

Like GPT4All, Ollama allows you to download models from its own model repository. You could start a Large Language Model (LLM), use this command:

```bash
ollama run qwen2.5:0.5b
```

Recently, the Ollama team has integrated access to the [HuggingFace](https://huggingface.co) model repository using this syntax:

```bash
ollama run hf.co/bartowski/Qwen2.5-7B-Instruct-GGUF:Q5_K_L
```

Since we've already downloaded the `Qwen2.5-7B-Instruct-Q5_K_L.gguf` file, let's use it directly. To do so, create a `Qwen2.5-7B-Instruct-Q5_K_L.Modelfile` with this content:

```
FROM /home/user/.local/share/nomic.ai/GPT4All/Qwen2.5-7B-Instruct-Q5_K_L.gguf
```
Don't forget to adapt the `/user/` part of the file path to your user name.

Once you have the model file ready, make it available to Ollama using:

```bash
ollama create Qwen2.5-7B-Instruct:Q5_K_L -f Qwen2.5-7B-Instruct-Q5_K_L.Modelfile
```

Finally, run your LLM:

```bash
ollama run Qwen2.5-7B-Instruct:Q5_K_L
```

### API Server

As Ollama provides an [OpenAI compatible](https://ollama.com/blog/openai-compatibility) API, the Python code to use this API server is almost identical to that for GPT4All. The main difference lies in the server URL and model names.

The server URL uses a different port: `http://localhost:11434/v1`. Additionally, you should refer to the models by their Ollama names rather than using GGUF file names as with GPT4All.

Here’s how you can use this API server from Python using the openai python client library:


```python
import openai

def ask_openai_model(question, model="Qwen2.5-7B-Instruct:Q5_K_L", max_tokens=4096, temperature=0.28):
    client = openai.OpenAI(
        base_url="http://localhost:11434/v1",
        api_key="not-needed"  # API key is required by the client but not used
    )
    try:
        response = client.chat.completions.create(
            model=model,  # Use whatever model you have loaded in GPT4All
            messages=[
                {"role": "system", "content": "You are Qwen, created by Alibaba Cloud. You are a helpful assistant."},
                {"role": "user", "content": question}
            ],
            max_tokens=max_tokens,
            temperature=temperature,
            stream=False            
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"Error: {str(e)}")
        print("Make sure the GPT4All server is running on port 4891")
        return None
```

### Open WebUI

[Open WebUI](https://github.com/open-webui/open-webui) is a self-hosted WebUI designed to operate entirely offline. It supports various LLM runners, including Ollama and OpenAI-compatible APIs.

If you're looking for a GUI option for your Ollama LLM, consider installing Ollama and the models on a [remote server with a more powerful graphics card](https://massedcompute.com).
Then, install and use Open WebUI on your local machine by connecting to your remote server via the API (maybe tunneled through SSH).

For comprehensive guidance on how to use Open WebUI, please refer to its official [documentation](https://docs.openwebui.com).

## Which Models Should You Choose?

Above, I’ve worked through the examples using the `Qwen2.5-7B-Instruct` model, but it is by far not the only capable model you can choose from.
Below are two links that can help kickstart your search for your personal best LLM:

* [Top 5 AI Models YOU Can Run Locally on YOUR Device!](https://dev.to/best_codes/5-best-ai-models-you-can-run-locally-on-your-device-475h)
* [LLM Explorer](https://llm.extractum.io/)

## Conclusion

I'm pleasantly surprised by how well local LLMs perform even on older hardware with limited resources.
The main advantages are their potential cost-effectiveness if you already have the necessary hardware and ensuring your data privacy remains intact.
With GPT4All, it’s also easy to make your own proprietary documents available to your personal LLM, making interactions even more versatile.

I hope this blog post inspires you to try some experiments of your own.

### Potential Next Steps:

I'm currently exploring if an external Graphics Breakaway Box like a [Razer Core X](https://www.amazon.de/Razer-Externes-Grafikkarten-Geh%C3%A4use-Thunderbolt/dp/B07D4NBPBC) or [Sonnet eGFX](https://www.amazon.de/SoNNeT-Breakaway-750ex-Graka-GPU-750WEX-TB3/dp/B08Q755RQS), which connect via Thunderbolt 3/4 at 40 Gbit/s to your computer, could enhance the local use case even further.
A preliminary indication of such a solution can be found in [Generative AI using eGPU on Slackware Linux](https://www.tumfatig.net/2024/generative-ai-using-egpu-on-slackware-linux).

## Footnotes

[^jupyternotebooktherightway]: Look at [How to set up Anaconda and Jupyter Notebook the right way](https://towardsdatascience.com/how-to-set-up-anaconda-and-jupyter-notebook-the-right-way-de3b7623ea4a) for more details.
