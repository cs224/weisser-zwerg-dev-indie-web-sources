---
layout: "layouts/post-with-toc.njk"
title: "Running private LARGE AI Models on Your Hardware: A Guide to Scaling Local LLMs"
description: "How to Set Up AI Models Across Multiple GPUs for Powerful Inference"
creationdate: 2025-02-21
keywords: local llm, multi-GPU setup, vllm, Text Generation Inference, TGI
date: 2025-02-21
tags: ['post']
---

## Rationale

In my previous blog post, [Running AI Models on Your PC: A Guide to Local Large Language Models (LLMs)](../local-llm-getting-started), I showed how to run AI models on older hardware like the GeForce GTX 1080 with 8 GB of RAM.
While that setup is useful for small-scale projects, it has clear limitations when you need more power.

This post takes it to the next level by explaining how to run LARGE Large Language Models (LLMs) across multiple GPUs for inference.
If you're working on projects that require more computational power, this guide will walk you through the process step by step.

## Before You Begin: Exploring API Services


If your main goal is to use LARGE Large Language Models for inference, you might want to consider using API services first, for example platforms like:
* [Groq](https://groq.com) or
* [together.ai](https://www.together.ai)

These services provide access to state-of-the-art models through an OpenAI API, with a cost-effective, pay-per-million tokens approach.
They're great options if you're looking for convenience and scalability without managing hardware yourself.

Only continue reading this guide if:
* You need a model that isn't available on Groq, together.ai, or similar services.
* Privacy and control over your hardware and data are top priorities for you.

## Model Selection

When selecting a model for your use case, [Artificial Analysis](https://artificialanalysis.ai) is an excellent starting point.
This platform offers independent evaluations of AI models and API providers, helping you navigate the complex AI landscape to find the best model and provider for your specific needs.

Additionally, the [Open LLM Leaderboard](https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard#/) is another valuable resource to explore.
It provides comprehensive insights and rankings of various LLMs, assisting you in making an informed decision.

## The Hardware

### Bare-Metal GPU Providers

To make it easy for everyone to follow along, I'll guide you through the process using rented hardware. Here are two excellent options:

* [Massed Compute LLC](https://massedcompute.com/): This provider offers on-demand GPU and CPU resources with flexible pricing and direct access to hardware without intermediaries. Located in [Kansas, Oklahoma, United States](https://www.crunchbase.com/organization/massed-compute), Massed Compute is a great choice for those who prefer a more hands-on approach to their hardware.
* [RunPod](https://www.runpod.io/): RunPod is a cloud platform designed specifically for GPU usage, allowing developers to deploy customized AI applications. Based in [Mount Laurel, New Jersey, United States](https://www.crunchbase.com/organization/runpod), RunPod focuses on containerization and uses virtual CPUs. They also offer persistent [network volumes](https://docs.runpod.io/pods/storage/create-network-volumes), which is crucial for managing large files. I personally rent 100GB of storage for $7.00 per month, which is a cost-effective solution for my needs.

One thing to note is that Massed Compute feels more like "real hardware" but doesn't currently offer a persistent storage solution for large files when using their ephemeral GPU services.
This means you'll need to manage your data carefully and be prepared to repeatedly set-up everything from scratch if you're using their temporary services.

Renting a system with 2 x NVIDIA A40 GPUs, for example, costs with either service approximately $0.90 per hour.
This is a great option for those who need powerful hardware without the long-term commitment.

### Apple Silicon

Apple's transition to its own custom system-on-a-chip (SoC) designs, collectively known as Apple Silicon, introduced the [Unified Memory Architecture](https://www.macobserver.com/columns-opinions/understanding-apples-unified-memory-architecture/) (UMA).
This architecture places the CPU, GPU, and other specialized accelerators on the same die, allowing them to share a common pool of high-bandwidth, low-latency memory.
In Apple's desktop-class SoCs, like the M1 Ultra or M2 Ultra, this unified memory pool can be configured with capacities up to 192 GB, which is substantial for a single system, especially for development or mid-sized inference tasks.

However, for large-scale, real-time, or high-throughput inference, discrete high-end GPUs still outperform Apple's integrated GPU.
But for local experimentation, prototyping, or smaller-scale deployments, Apple Silicon can be quite capable.
The unified memory often provides a smoother experience than lower-end discrete GPUs because it avoids the overhead of CPU-GPU transfers.

If you prefer Linux over macOS like I do, the [Asahi Linux](https://en.wikipedia.org/wiki/Asahi_Linux) project is dedicated to porting the Linux kernel and related software to Apple Silicon-powered Macs.
However, this is still a work in progress as it involves reverse-engineering Apple's SoCs, which lack official documentation.

For those interested in renting bare-metal hardware, [MacStadium, Inc](https://www.macstadium.com/bare-metal-mac), headquartered in Atlanta, Georgia, offers such services.

**\[Addendum 2025-02-26\]**: A new player has entered the system-on-a-chip (SoC) arena: [Framework | Introducing the Framework Desktop](https://frame.work/de/de/blog/introducing-the-framework-desktop)

> The top-end Ryzen AI Max+ 395 configuration with 128GB of memory starts at just $1999 USD. This is excellent for gaming, but it is a truly wild value proposition for AI workloads.

Apple isn't the only one leveraging shared memory between the CPU and GPU anymore. This architecture means you can run large LLM models locally - and not on macOS, but on Linux!

**\[Addendum 2025-04-30\]**: Another system to consider is [NVIDIA DGX Spark](https://www.nvidia.com/en-us/products/workstations/dgx-spark): A Grace Blackwell AI supercomputer on your desk. It is also based on 128 GB of Coherent Unified System Memory.
It is advertised to be able to run AI models up to 200 billion parameters and when connecting two NVIDIA DGX Spark systems together to work with AI models up to 405 billion parameters.

### NVIDIA GPUs

To get started with running large language models locally, understanding your GPU's capabilities is crucial. Visit NVIDIA’s [GPU Compute Capability](https://developer.nvidia.com/cuda-gpus#compute) page to learn more about their current lineup and specifications.

For example, my older GeForce GTX 1080 runs on [Compute Capability](https://en.wikipedia.org/wiki/CUDA) 6.1.
However, modern architectures like [Ampere](https://en.wikipedia.org/wiki/Ampere_(microarchitecture)), [Ada Lovelace](https://en.wikipedia.org/wiki/Ada_Lovelace_(microarchitecture)), and [Hopper](https://en.wikipedia.org/wiki/Hopper_(microarchitecture)) boast Compute Capability 8.0+.
This is important because both `vLLM` and Text Generation Inference (`TGI`) require at least Compute Capability 7.0 to work properly.
They rely on the [flash-attention](https://github.com/Dao-AILab/flash-attention) module, which isn't compatible with older architectures.
If you're working with legacy hardware, and really want to try compiling the above packages for older compute capabilities I suggest you start by googling for the following environment variables:
* `TORCH_CUDA_ARCH_LIST="6.1"`
* `CUDA_ARCH_LIST="6.1"`
* `FORCE_CUDA_CC=61`

When it comes to high-end models, the `X100` series (like the `A100` or `H100`) stand out.
These GPUs offer 80 GB of VRAM, making them ideal for demanding workloads.

For inference, VRAM size is the most critical factor, so don' t overlook the `X40` series, such as the `A40` or `L40`.
Both of these cards provide 48 GB of VRAM, which is good for running many models locally.

If you're looking for workstation-grade GPUs, the RTX A6000 (Ampere) and RTX 6000 (Ada Lovelace) are excellent choices.
These are essentially consumer versions of the data center GPUs `A40` and `L40`, with similar performance but tailored for workstation use.
They also come with 48 GB of VRAM.

For smaller projects, the `A10`, `A30`, and `L4` cards are great options, offering 24 GB of VRAM.

Finally, if you're aiming for maximum scalability, the largest standard systems available on [Massed Compute](https://massedcompute.com/home-old/pricing/) feature an impressive 640 GB of VRAM (achieved by combining 8 x 80 GB GPUs).
This kind of setup is perfect for running the most demanding models smoothly.

## The Software

### Execution Engines: vLLM or TGI

In my previous blog post, we used execution engines like [GPT4All](https://www.nomic.ai/gpt4all) or [Ollama](https://ollama.com) to run LLMs on older hardware.
However, for multi-GPU setups in data centers, we need more powerful tools.
As far as I know, GPT4All and Ollama don't support running LLMs across multiple GPUs.

For multi-GPU setups, we'll focus on two systems: [vLLM](https://github.com/vllm-project/vllm) and [Text Generation Inference (TGI)](https://huggingface.co/docs/text-generation-inference/index).
Both of these tools can directly use models stored on [Hugging Face](https://huggingface.co/), which is like a [GitHub](https://github.com/) for LLM models.
`vLLM`'s [documentation](https://docs.vllm.ai/en/latest/features/quantization/index.html) mentions support for several [quantization methods](https://newsletter.maartengrootendorst.com/p/which-quantization-method-is-right), including `AutoAWQ`, `BitsAndBytes`, `GGUF`, `INT4 W4A16`, `INT8 W8A8`, and `FP8 W8A8`.

`GGUF` is designed for `llama.cpp`, which is what GPT4All and Ollama use internally.
It can run on CPUs, GPUs, or Metal (for macOS).
I used `GGUF` in my previous blog post for running LLMs on older hardware because it offers a lot of flexibility.
It allows you to choose from 2-bit to 8-bit quantization levels, giving you fine control over the trade-off between model size and accuracy.
I started out for this blog post with `GGUF` because I already had experience with it and appreciated its flexibility.
However, `vLLM` added support for `GGUF` only recently and it caused compatibility issues and too much trouble during setup.

`AutoAWQ`, on the other hand, provides a reliable 4-bit quantization method.
It's designed to handle outliers better than basic 4-bit approaches, often resulting in higher accuracy.
Because of these benefits, I decided to go with `AutoAWQ` for this project.

### Python Packages: UV

To get started, we need to install some essential Python packages.
For this, we'll use a Python package manager.
While many of you might be familiar with the traditional combination of `venv` and `pip`, we'll be using [`uv`](https://docs.astral.sh/uv) in this guide.
`uv` is a remarkably fast Python package and project manager built with Rust, making it an excellent choice for our needs.

To install `uv`, simply run the following command:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Once `uv` is installed, you can create a new Python environment and activate it using the following steps:
```bash
uv venv vllm --python 3.12 --seed
source vllm/bin/activate
python --version
# Python 3.12.9
```

### Downloading Models

#### Gated Models

Some models on Hugging Face are "gated", meaning they are private or require you to accept specific license conditions or a use policy.
To access these models, you'll need to create a Hugging Face account and obtain a token.

On the other hand, unrestricted models can be downloaded without an account or token.
The Qwen2.5 models are a great example of unrestricted models, which is why we'll be using them in this guide.

If you're interested in using gated models, you can store your credentials in the [`~/.netrc`](https://everything.curl.dev/usingcurl/netrc.html) file for easy access.
You can [format](https://gist.github.com/technoweenie/1072829) the file as follows:
`~/.netrc`
```
machine huggingface.co
login YOUR_HF_USERNAME
password hf_AbCdEfGh123456789
```

Alternatively, you can use the [`huggingface-cli`](https://huggingface.co/docs/huggingface_hub/en/guides/cli) `login` command to authenticate with a token from your Hugging Face account settings (<huggingface.co/settings/tokens>).

#### Fewer Large vs. Several Small Files

When it comes to downloading models, you might wonder whether it's better to use fewer larger files or several smaller ones.
Initially, I thought that fewer larger files would be the way to go, but it turns out that Hugging Face limits single file downloads to `40.0 MB/s`.
As a result, downloading several smaller files is actually much faster.
This is an important consideration when you have the option to choose between different quantizations, where one might be stored in fewer larger files and another in more smaller files.
In such cases, opting for the version with more smaller files can significantly shorten your download time.

#### Git and Git LFS

When downloading models from Hugging Face, you might consider using [git](https://en.wikipedia.org/wiki/Git) and [git-lfs](https://git-lfs.com) (Git Large File Storage (LFS)) directly on their repositories.
Git LFS is a useful tool that replaces large files, such as datasets and graphics, with text pointers inside Git, while storing the actual file contents on a remote server.

For example, you can use the following commands to download models:
```bash
GIT_LFS_SKIP_SMUDGE=1 git clone https://huggingface.co/Qwen/Qwen2.5-72B-Instruct-AWQ
cd Qwen2.5-72B-Instruct-AWQ
git lfs pull
```

Alternatively, you can [pull only specific files](https://graphite.dev/guides/how-to-use-git-lfs-pull) using:
```bash
GIT_LFS_SKIP_SMUDGE=1 git clone https://huggingface.co/bartowski/Qwen2.5-72B-Instruct-GGUF
cd Qwen2.5-72B-Instruct-GGUF
git lfs pull --include="Qwen2.5-72B-Instruct-Q5_K_M/*"
git lfs pull --include="Qwen2.5-72B-Instruct-Q3_K_M.gguf" --include="Qwen2.5-72B-Instruct-Q4_0.gguf"
```

By default, Git LFS will also download the large files when you clone a repository, but you would not see any progress indiactors.
However, you can use the `GIT_LFS_SKIP_SMUDGE=1` environment variable to prevent this auto-download and download the large files in a separate step.
While this approach provides some basic progress indicators, they are limited, even when splitting the `git clone` and `git lfs pull` into two steps.

One major drawback of using Git and Git LFS is that it doesn't support resuming interrupted downloads. If your download is interrupted, you'll have to start from scratch.

In summary, while `git` and `git-lfs` can be used to download models from Hugging Face,
it's not the most efficient approach. Instead, I recommend using the `huggingface-cli`, which provides a more streamlined and reliable download experience.

#### Hugging Face CLI

The `huggingface-cli` is a Python package that can be easily installed via:
```bash
uv pip install -U "huggingface_hub[cli]"
```

Once installed, you can use the `huggingface-cli` like this:
```bash
huggingface-cli download Qwen/Qwen2.5-72B-Instruct-AWQ --local-dir Qwen2.5-72B-Instruct-AWQ
```
By default, the Hugging Face CLI stores models in its cache at `~/.cache/huggingface/hub/`.
Even when using the `--local-dir` option, the models will still be stored in this cache.
However, the `--local-dir` option is useful when working with a persistent volume (also known as "cold storage"), as it ensures your downloads are stored in the correct location.

It's worth noting that `vllm` has the Hugging Face CLI functionality built-in.
When you download models directly using `vllm`, they will be stored in the Hugging Face CLI cache at `~/.cache/huggingface/hub/`.

### Open-WebUI

To provide a user-friendly interface for interacting with the Large Language Model (LLM) running remotely, I'll be using [Open WebUI](https://github.com/open-webui/open-webui) on my local system.
To connect to the remote LLM I will use standard `ssh` port forwarding, allowing Open WebUI on my local computer to communicate with the LLM running on the bare-metal hardware provider.


You can run Open WebUI with a single `docker run` command line:
```bash
docker run --rm -ti --add-host=host.docker.internal:host-gateway -p 3000:8080 -e WEBUI_AUTH=False -e WEBUI_DEFAULT_BACKEND=openai -e OPENAI_API_BASE_URL="http://host.docker.internal:8000/v1" -e OPENAI_API_KEY="not-needed" -e OPENAI_API_MODEL="Qwen/Qwen2.5-72B-Instruct" -e RAG_EMBEDDING_ENGINE="ollama" -e AUDIO_STT_ENGINE="openai" --mount type=tmpfs,destination=/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main
```

Alternatively, I prefer using a `docker-compose.yaml` file and running it with `docker compose up`:
```yaml
# * https://docs.openwebui.com/faq
# * https://github.com/open-webui/open-webui
# * https://docs.openwebui.com/tutorials/tips/reduce-ram-usage#longer-explanation

name: webui
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    extra_hosts:
      - host.docker.internal:host-gateway
    ports:
      - 3000:8080
    environment:
      - WEBUI_AUTH=False
      - WEBUI_DEFAULT_BACKEND=openai
      - OPENAI_API_BASE_URL=http://host.docker.internal:8000/v1
      - OPENAI_API_KEY=not-needed
      - OPENAI_API_MODEL=Qwen/Qwen2.5-1.5B-Instruct
      - RAG_EMBEDDING_ENGINE=ollama
      - AUDIO_STT_ENGINE=openai
    tmpfs:
      - /app/backend/data
```

To simplify things, I've reduced Open WebUI's functionality to a single-user system without authentication by setting `-e WEBUI_AUTH=False`.
I've also disabled features like speech-to-text, RAG embedding engine, and image generation engine by setting `-e RAG_EMBEDDING_ENGINE="ollama"` and `-e AUDIO_STT_ENGINE="openai"`, as explained in Open WebUI's [Reduce RAM Usage](https://docs.openwebui.com/tutorials/tips/reduce-ram-usage#longer-explanation) documentation page.

Additionally, I've configured Open WebUI to use a `tmpfs` partition for its `/app/backend/data` directory, so it won't retain any settings between restarts.

Normally, you would set up `ssh` port forwarding like this:
```bash
ssh -L 8000:localhost:8000 Ubuntu@64.247.196.5
```
However, since we're working with Docker, this approach won't work because the `localhost` inside the Docker container is different from the `localhost` on our local machine[^dockernetworknamespace].
To resolve this issue, we need to find the IP address of our `docker0` network interface:
```bash
ifconfig -a | grep -A 1 docker0
# docker0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
#          inet 172.17.0.1  netmask 255.255.0.0  broadcast 172.17.255.255
```
Typically, this will be `172.17.0.1`. Then, we can set up port forwarding using:
```bash
ssh -L 172.17.0.1:8000:localhost:8000 Ubuntu@64.247.196.5
```
This will forward the remote port `8000` to the local port `8000` on the `docker0` network interface.
We can make this available as `host.docker.internal:8000` inside the Docker container by setting `--add-host=host.docker.internal:host-gateway`.

I admit that this process can be a bit complex, but once set up, it will work seamlessly with any remote OpenAI-compatible LLM API server.
If you've found a simpler Web UI for interacting with remote LLMs, I'd love to hear about it - please share your experience in the [Feedback](#feedback) section below.

## Multi-GPU vLLM

You will have to start by renting a setup with at least 2 GPUs to try a multi-GPU setup.
I chose a 2 x A40 setup with 2 x 48 GB = 96 GB of vRAM.
This configuration provides a good balance between performance and cost.

**Setting Up Access**: Once you've picked your system, I suggest setting up an SSH key to facilitate access to those systems. Both Massed Compute and RunPod offer SSH access to their systems. This step is crucial for secure and convenient access to your rented setup.

**Choosing the Right System**:

For Massed Compute, I used a `> Base Category > Ubuntu Server 22.04 Server w/ drivers` with 20 vCPUs and 64 GB of RAM system.
For RunPod, I used a `RunPod Pytorch 2.1` pod with 19 vCPUs and 100 GB of RAM system.
These configurations provide a good foundation for running large language models.

**SSH Access Methods**: RunPod offers you two kinds of `ssh` access methods. They will look like:
```bash
ssh 3nwqwog2pyh2cd-644112e5@ssh.runpod.io
ssh -p 22031 root@69.30.85.50
```
I suggest using the second method, as the first one caused trouble with port forwarding.


**Workflow with vLLM**: Below, the approach with Massed Compute is shown, but besides the actual SSH command, all other commands will be the same.
```bash
# --- in terminal 1 ---
ssh Ubuntu@64.247.196.5
nvidia-smi                                 # check your NVIDIA set-up
sudo su
apt update && apt upgrade
shutdown -r now                            # reboot after the upgrade
# and wait a couple of seconds before you try to reconnect
ssh Ubuntu@64.247.196.5
sudo su
apt install wajig emacs-nox python-is-python3 tree jq git git-lfs curl wget
python --version
# Python 3.10.12
curl -LsSf https://astral.sh/uv/install.sh | sh
# ------------------------------------------------------------------------------------------------------
# cd /workspace : if you use RunPod you may want to do the venv set-up in the persistent network volume.
# ------------------------------------------------------------------------------------------------------
uv venv vllm --python 3.12 --seed
source vllm/bin/activate
python --version
# Python 3.12.9
uv pip install -U "huggingface_hub[cli]"
uv pip install vllm # v0.7.2
vllm serve Qwen/Qwen2.5-1.5B-Instruct      # first test with a small model
# --- in terminal 2 ---
ssh -L 172.17.0.1:8000:localhost:8000 Ubuntu@64.247.196.5
curl http://localhost:8000/v1/models | jq  # check that the Open AI compatible API server is working on the remote system.
# --- in terminal 3 ---
curl http://172.17.0.1:8000/v1/models | jq # check that the Open AI compatible API server is working on your local system.
# start Open WebUI
docker run --rm -ti --add-host=host.docker.internal:host-gateway -p 3000:8080 -e WEBUI_AUTH=False -e WEBUI_DEFAULT_BACKEND=openai -e OPENAI_API_BASE_URL="http://host.docker.internal:8000/v1" -e OPENAI_API_KEY="not-needed" -e OPENAI_API_MODEL="Qwen/Qwen2.5-1.5B-Instruct" -e RAG_EMBEDDING_ENGINE="ollama" -e AUDIO_STT_ENGINE="openai" --mount type=tmpfs,destination=/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main
# connect to http://localhost:3000 with your web-browser and verify that the remote vllm LLM is working: "How many r's are there in the word 'strawberry'?"
```

The above is the full workflow with vLLM. For large LLMs, the following changes are necessary:

1. We download the large model to a directory and do not use vLLM's built-in Hugging Face CLI capability.
1. We run the model across our two GPUs via: `--tensor-parallel-size 2`.

```bash
# --- in terminal 1 ---
# https://huggingface.co/Qwen/Qwen2.5-72B-Instruct-AWQ
# ------------------------------------------------------------------------------------------------------
# cd /workspace : if you use RunPod you may want to do the downloading in the persistent network volume.
# ------------------------------------------------------------------------------------------------------
huggingface-cli download Qwen/Qwen2.5-72B-Instruct-AWQ --local-dir Qwen2.5-72B-Instruct-AWQ
du -sh Qwen2.5-72B-Instruct-AWQ/
# 39G     Qwen2.5-72B-Instruct-AWQ/
vllm serve ./Qwen2.5-72B-Instruct-AWQ --tensor-parallel-size 2
```

**Startup Timing and Performance**: I provide a couple of log messages here, so you get a feeling for the startup timing:
```bash
# INFO 02-20 15:42:31 __init__.py:190] Automatically detected platform cuda.
# INFO 02-20 15:42:35 api_server.py:206] Started engine process with PID 8447
# ...
# INFO 02-20 15:43:27 llm_engine.py:234] Initializing a V0 LLM engine (v0.7.2) with config: model='./Qwen2.5-72B-Instruct-AWQ', speculative_config=None, tokenizer='./Qwen2.5-72B-Instruct-AWQ', skip_tokenizer_init=False, tokenizer_mode=auto, revision=None, override_neuron_config=None, tokenizer_revision=None, trust_remote_code=False, dtype=torch.float16, max_seq_len=32768, download_dir=None, load_format=LoadFormat.AUTO, tensor_parallel_size=2, pipeline_parallel_size=1, disable_custom_all_reduce=False, quantization=awq_marlin, enforce_eager=False, kv_cache_dtype=auto,  device_config=cuda, decoding_config=DecodingConfig(guided_decoding_backend='xgrammar'), observability_config=ObservabilityConfig(otlp_traces_endpoint=None, collect_model_forward_time=False, collect_model_execute_time=False), seed=0, served_model_name=./Qwen2.5-72B-Instruct-AWQ, num_scheduler_steps=1, multi_step_stream_outputs=True, enable_prefix_caching=False, chunked_prefill_enabled=False, use_async_output_proc=True, disable_mm_preprocessor_cache=False, mm_processor_kwargs=None, pooler_config=None, compilation_config={"splitting_ops":[],"compile_sizes":[],"cudagraph_capture_sizes":[256,248,240,232,224,216,208,200,192,184,176,168,160,152,144,136,128,120,112,104,96,88,80,72,64,56,48,40,32,24,16,8,4,2,1],"max_capture_size":256}, use_cached_outputs=True, 
# WARNING 02-20 15:43:27 multiproc_worker_utils.py:300] Reducing Torch parallelism from 48 threads to 1 to avoid unnecessary CPU contention. Set OMP_NUM_THREADS in the external environment to tune this value as needed.
# ...
# (VllmWorkerProcess pid=8719) INFO 02-20 15:43:52 multiproc_worker_utils.py:229] Worker ready; awaiting tasks
# (VllmWorkerProcess pid=8719) INFO 02-20 15:43:52 cuda.py:230] Using Flash Attention backend.
# ...
# (VllmWorkerProcess pid=8719) INFO 02-20 15:44:48 model_runner.py:1110] Starting to load model ./Qwen2.5-72B-Instruct-AWQ...
# Loading safetensors checkpoint shards:   0% Completed | 0/11 [00:00<?, ?it/s]
# ...
# INFO 02-20 15:48:43 model_runner.py:1115] Loading model weights took 19.3952 GB
# (VllmWorkerProcess pid=8719) INFO 02-20 15:48:43 model_runner.py:1115] Loading model weights took 19.3952 GB
# (VllmWorkerProcess pid=8719) INFO 02-20 15:49:49 worker.py:267] model weights take 19.40GiB; non_torch_memory takes 0.32GiB; PyTorch activation peak memory takes 5.66GiB; the rest of the memory reserved for KV Cache is 14.63GiB.
# INFO 02-20 15:50:15 launcher.py:21] Available routes are:
curl http://localhost:8000/v1/models | jq
```
The overall startup process takes roughly 8 minutes.

And here you can also see the memory utilization across the two GPUs using `nvidia-smi`:
```bash
nvidia-smi 
# Thu Feb 20 15:51:17 2025       
# +-----------------------------------------------------------------------------------------+
# | NVIDIA-SMI 565.57.01              Driver Version: 565.57.01      CUDA Version: 12.7     |
# |-----------------------------------------+------------------------+----------------------+
# | GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
# | Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
# |                                         |                        |               MIG M. |
# |=========================================+========================+======================|
# |   0  NVIDIA A40                     On  |   00000000:CE:00.0 Off |                    0 |
# |  0%   43C    P0             80W /  300W |   36091MiB /  46068MiB |      0%      Default |
# |                                         |                        |                  N/A |
# +-----------------------------------------+------------------------+----------------------+
# |   1  NVIDIA A40                     On  |   00000000:D6:00.0 Off |                    0 |
# |  0%   44C    P0             80W /  300W |   36075MiB /  46068MiB |      0%      Default |
# |                                         |                        |                  N/A |
# +-----------------------------------------+------------------------+----------------------+
#                                                                                          
# +-----------------------------------------------------------------------------------------+
# | Processes:                                                                              |
# |  GPU   GI   CI        PID   Type   Process name                              GPU Memory |
# |        ID   ID                                                               Usage      |
# |=========================================================================================|
# +-----------------------------------------------------------------------------------------+
```

And here you can see the performance in the RunPod web console:<br>
<a href="/img/2025-02-20-1633-runpod-io.png" target="about:blank"><img src="/img/2025-02-20-1633-runpod-io.png" alt="RunPod Web Console" style="max-height: 200px; max-width: 100%"></a>

## Multi-GPU Text Generation Inference (TGI)

Although I haven't personally tried TGI, online comments suggest that vLLM is currently the top choice.
For those interested in exploring TGI, I recommend checking out the blog post [Best Llama 3 Inference Endpoint – Part 2](https://massedcompute.com/best-llama-3-inference-endpoint-part-2/) on the Massed Compute blog, dated 2024-04-26, or visiting the official [Text Generation Inference (TGI)](https://huggingface.co/docs/text-generation-inference/index) documentation directly.


## Detours

The whole process is quite simple, once you know it, but it took much longer than you might expect from the above straightforward walkthrough.
Here, I'd like to share some of the detours I took and what I learned from them.

### vLLM on Old Hardware

I usually like to test things out on my local system with a small example before scaling up to a larger use case on a remote system.
So, I tried to get vLLM and Text Generation Inference (TGI) working on my older GeForce GTX 1080 with Compute Capability 6.1.
After spending a whole day trying to make it work, I finally gave up.
My takeaway from this experience is that for smaller systems, `Ollama` with `GGUF` quantization is a better choice, while for larger systems, `vLLM` with `AWQ` quantization is the way to go.

### Multi-GPU with `torchrun`

I asked `ChatGPT o1 pro` for help with setting up a multi-GPU configuration with vLLM, and it recommended using `torchrun`, even after I provided it with parts of the vLLM documentation. The suggested command line was:
```bash
torchrun --standalone --nproc_per_node=2 /workspace/vllm/bin/vllm serve ./Qwen2.5-72B-Instruct-AWQ --tensor-parallel-size 2
```
However, after some time, the process just hung, and I eventually got an error message:
```bash
# [E220 15:40:19.862248270 socket.cpp:1011] [c10d] The client socket has timed out after 600000ms while trying to connect to (192.168.6.2, 53489).
# [W220 15:40:19.894087820 TCPStore.cpp:358] [c10d] TCP client failed to connect/validate to host 192.168.6.2:53489 - retrying (try=0, timeout=600000ms, delay=88516ms): The client socket has timed out after 600000ms while trying to connect to (192.168.6.2, 53489).
# Exception raised from throwTimeoutError at ../torch/csrc/distributed/c10d/socket.cpp:1013 (most recent call first):
# frame #0: c10::Error::Error(c10::SourceLocation, std::string) + 0x96 (0x7f249136c446 in /workspace/vllm/lib/python3.12/site-packages/torch/lib/libc10.so)
```

The lesson here is not to blindly trust AI assistants, but to fall back on good old habits like reading the documentation, specifically the sections on [Distributed Inference and Serving](https://docs.vllm.ai/en/stable/serving/distributed_serving.html).

### Other issues

There were several other issues that slowed me down, including:
* Researching and evaluating bare-metal GPU providers.
* Starting out with `GGUF` quantization that does not work reliably with `vLLM` just yet.
* Resolving `localhost` issues with the Open WebUI Docker container.
* Trying to stick with `git` and `git-lfs` before eventually switching to `huggingface-cli`[^fewertoolslargerversatility].
* And a few other detours that I don't recall right now ..


## Conclusion

In conclusion, setting up a multi-GPU setup for running large local LLMs may seem complex at first, but once you understand the process, it's actually quite manageable.
However, if you have the option to use OpenAI API based services like Grok, together.ai, or similar services, it might be a more convenient and hassle-free route to explore.

### A Shift in Plans: The Limitations of Older Hardware

One key takeaway is that my initial plan to use older hardware, a few years behind the current state of the art, to run a capable Local Large Language Model (LLM) locally may not be feasible.
The main issue is that older hardware, such as my GeForce GTX 1080, quickly becomes outdated and is no longer supported by execution engines like vLLM after just a few years.
Although this might change as the LLM space matures, for now, it's not a viable option.

If I were to use my own hardware, I'd need to consider more modern and powerful options.
For example, a system with an RTX 6000 and an eGPU enclosure like the Razer Core X, connected via Thunderbolt, could work - but it comes with a hefty price tag of around €8,000.
Alternatively, an Apple Mac Studio M2 Ultra with 24 cores, 128 GB of RAM, and a 2 TB SSD could be another option, costing around €5,200.
However, for that amount of money, I could rent many hours of bare-metal cloud systems, which might be a more cost-effective solution.

## Appendix

### Further Resources

* [Introduction to vLLM and PagedAttention](https://blog.runpod.io/introduction-to-vllm-and-how-to-run-vllm-on-runpod-serverless)
  * [How to run vLLM with RunPod Serverless](https://blog.runpod.io/how-to-run-vllm-with-runpod-serverless-2)

### CPU Offload / Sequential Loading

Although I haven't personally tried, you can run a model on a single GPU even if the model is larger than that GPU's available VRAM - although it requires some form of sharding and offloading so that the model's full parameters do not have to be loaded into GPU memory all at once.

[DeepSpeed](https://www.deepspeed.ai/tutorials/zero-offload/) ([ZeRO-Infinity](https://www.microsoft.com/en-us/research/blog/zero-infinity-and-deepspeed-unlocking-unprecedented-model-scale-for-deep-learning-training/), [GitHub](https://github.com/microsoft/DeepSpeed)):
* **What it does**: Uses stage-based "ZeRO" optimizations for both training and inference. Part of this includes CPU offload and memory swapping so that not all model weights have to live on the GPU simultaneously.
* **How it helps**: At inference time, DeepSpeed can keep portions of the model on CPU and stream them to the GPU when needed.
* **Considerations**: 
  * Slower than having everything in GPU memory, but can still be practical for inference if you have a fast CPU and a decent PCIe bandwidth.
  * More complexity to set up (DeepSpeed config, etc.).

Hugging Face [Accelerate](https://huggingface.co/docs/accelerate/index) / CPU Offload:
* **What it does**: Hugging Face's accelerate library can automatically shard your model and offload pieces to CPU or GPU.
* **How it helps**: Similar idea: only part of the model is on the GPU at any moment; the rest is stored in CPU RAM.
* **Considerations**: Slower than purely GPU-based, but you can run larger models on smaller GPU memory footprints.

Bottom Line: you can run a large model on one GPU in a "sequential" or partially-offloaded manner by using CPU offload/model sharding tools (DeepSpeed ZeRO, Hugging Face Accelerate, etc.).

As far as I am aware there is at the moment no execution environment available like `vLLM` or any other which implements a built-in CPU offload or "ZeRO"-style sharding.

## Footnotes

[^dockernetworknamespace]: This means it will run in a separate [network namespace](https://blog.kubesimplify.com/docker-networking-demystified).
[^fewertoolslargerversatility]: Personally, I prefer to use a limited set of tools and learn them thoroughly, rather than relying on a large collection of tools that I only know superficially.