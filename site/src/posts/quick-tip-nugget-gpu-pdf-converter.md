---
layout: "layouts/post-with-toc.njk"
title: "Quick Tip Nugget: Convert PDFs to Markdown on Runpod with marker-pdf and GPU Support"
description: "PDFs are a poor input format for AI, and the practical solution is to convert them into Markdown first."
keywords: PDF to Markdown, PDF to Markdown Converter, marker-pdf, Runpod, PDF for AI prompts, ChatGPT, GPU OCR, Markdown for LLMs
creationdate: 2026-03-20
date: 2026-03-20
tags: ['post']
---

## Rationale

A lot of frustration with AI and PDFs comes from treating the PDF itself as if it were already good prompt material.
Usually it is not.
The visible document may look fine to a human reader, but an AI system still has to reconstruct the actual text structure behind that layout.
That is why prompting directly from a PDF can fail even on simple tasks such as summarizing terms and conditions or extracting specific clauses.

The better workflow is to convert the PDF into Markdown first.
In this quick-tip nugget, I will show how to do that with [Runpod](https://www.runpod.io/) and the [marker-pdf](https://github.com/datalab-to/marker) library.
Runpod gives us an easy way to run GPU-backed jobs in the cloud, and marker-pdf gives us fast, accurate conversion into Markdown and JSON.
The combination is practical, reproducible, and accessible for technical hobbyists who want better inputs for AI.

This article focuses on turning a PDF into text that an AI can work with more reliably.
Instead of hoping that a model reads a PDF correctly, you prepare the content in a format that is easier to process further.

### Different Readers and Different Levels of Prior Knowledge

Different readers have different levels of prior knowledge, so it is hard to write one guide that fits everyone.
If the explanations below feel too short or too advanced for you, just copy the URL of this post into an AI assistant like ChatGPT and ask it to walk you through the sections you are not yet comfortable with.
For example, you can ask it to explain unfamiliar concepts or show the same steps for a different Linux distribution.

## Runpod vs. Modal vs. Datalab API

Before I explain the setup below, it is worth mentioning that [Datalab](https://www.datalab.to), the company behind `marker-pdf`, also offers a [hosted API](https://www.datalab.to/pricing).
Datalab describes its platform as a document intelligence service that converts PDFs, spreadsheets, images, and other files into structured, machine readable outputs.
It also offers a managed platform, on premises deployment for sensitive workloads, and open source tools for developers.

For some users, that will be the most direct option.
In my case, I decided not to use it.
At the time of writing, the pricing model starts with a monthly credit deposit and then moves to usage based billing.
For my use case, that felt like more commitment than I needed for occasional PDF to Markdown jobs.

Datalab has also published a [Usage with Modal](https://github.com/datalab-to/marker/blob/feat/modal-marker-demo/examples/README_MODAL.md) example for Marker.
[Modal](https://modal.com/pricing) is a good fit when you want to define the service in Python, deploy it from code, expose it as an API, and keep the setup reproducible.
That approach makes sense when you want a programmatic service instead of a machine that you log into manually.

> In Datalab's example, Modal provisions a GPU backed container for Marker and exposes a web endpoint that accepts a PDF and returns Markdown, HTML, or JSON.
> In practice, that turns Marker into a small conversion service that you can call from scripts or applications.

If your goal is to build a scripted, reusable pipeline, Modal is probably the stronger fit.
It is closer to application deployment than to renting a remote workstation.

If your goal is simpler, Runpod Pods are easier to reason about.
You rent a GPU machine, connect to it, run your batch job, and copy the results back.
That is the path I chose here because it keeps the moving parts visible.
For a technical hobbyist who mainly wants to convert PDFs into Markdown with GPU support, Runpod feels more direct.

## Runpod GPU PDF Conversion with marker-pdf

You can find the related GitHub repository at [cs224/runpod-gpu-marker-pdf-convert](https://github.com/cs224/runpod-gpu-marker-pdf-convert).
Inside the repository, you will also find the document [METHOD-COMPARISON.md](https://github.com/cs224/runpod-gpu-marker-pdf-convert/blob/main/METHOD-COMPARISON.md).
It compares several methods for converting PDFs to Markdown, and [marker-pdf](https://pypi.org/project/marker-pdf/) is the clearest winner in that comparison.
Its main limitation is speed. On a CPU only machine, the conversion can take long enough to become impractical for regular use.
That is why I created this project: it runs the PDF to Markdown conversion on a Runpod GPU instance instead.

> This is useful because PDF conversion is not just text extraction.
> A good converter also has to reconstruct headings, paragraphs, lists, tables, and reading order from a layout that was designed for visual display.
> GPU support can reduce waiting time significantly, especially for larger PDFs or scanned documents that require OCR.

To make the workflow easier to follow, here is a short high level walkthrough of how the project works.
You prepare your files locally, send the job to a Runpod instance, run the conversion there, and then copy the results back to your own machine.
This keeps the heavy processing on the GPU system while your local workstation remains unchanged.

1. Clone the repository.
2. Copy the PDF files you want to convert into the `pdfconvert-gpu` folder.
3. Start the Runpod instance.
4. Provision the Runpod instance.
5. Run the conversion process on the instance.
6. Copy the converted files back from the Runpod instance to your local machine.
7. Shut down the Runpod instance.

In practice, the output usually includes Markdown and, depending on your setup, structured data such as JSON.
Markdown is often the more useful format for AI workflows because it preserves document structure in plain text.
That makes it easier to review manually, split into smaller chunks, and reuse in prompts, RAG pipelines, or other LLM based processing steps.

In the following sections, I will assume that you have already cloned the [GitHub repository](https://github.com/cs224/runpod-gpu-marker-pdf-convert), copied the PDF files you want to convert into the `pdfconvert-gpu` folder,
and opened a command line session in that same `pdfconvert-gpu` folder.

> Running the commands from the `pdfconvert-gpu` folder matters because the scripts and file paths in the next steps expect that location.

### RunPod Account Setup

I already mentioned [Runpod](https://www.runpod.io/) in the [Bare Metal GPU Providers](../local-llm-large-llms/#bare-metal-gpu-providers) section of my blog post [Running private LARGE AI Models on Your Hardware: A Guide to Scaling Local LLMs](../local-llm-large-llms/) from last year.
If you followed that guide, you can simply reuse the same account.
Otherwise, you need to sign up, add some credit to your account, and configure your public SSH key under `Settings > SSH Public Keys`.

### RunPod Instance Setup

Next, open `Pod Templates` in the left side menu, search for `Runpod Pytorch`, and select the newest version.
At the time of writing, that is `RunPod PyTorch 2.8.0, runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404`.
After that, click `Configure Pod` and choose a GPU.

I usually pick an `A40` because it is often available at a good price and comes with `48 GB` of VRAM.
An `L4` is also sufficient for this task.
For converting PDFs with `marker`, you do not need an especially large GPU, but having some VRAM headroom can still make the setup more comfortable.

> For this specific job, the GPU is mainly there to accelerate the model based document processing steps.
> The task is much lighter than running a large language model for inference, so you do not need to rent an oversized machine.

For the pod options, you only need to enable `SSH Terminal Access`.
It does not hurt to also enable `Encrypt Volume`, but `Start Jupyter Notebook` is not needed here.
You can usually reduce both `Container Disk` and `Volume Disk` to `20 GB` each.

> Disk sizing note for GPU pods:
>
> 1. On the tested Runpod setup, after the initial `marker` and `Surya` model downloads, the storage footprint inside `/workspace` was about `13 GB`, based on `du -sh /workspace`.
> 2. You should treat that as the baseline for the conversion environment and model files, before adding your own PDFs, Markdown output, JSON output, or any other data.
> 3. In practice, anything below `20 GB` leaves very little headroom.

Then click `Deploy On-Demand`.

Once the instance has started, Runpod will show you an `SSH over exposed TCP` command similar to this:

> `ssh root@69.30.85.233 -p 22037 -i ~/.ssh/id_ed25519`

### RunPod Instance Provisioning

The following steps happen on your local workstation inside the `pdfconvert-gpu` folder.

The first step is to configure the environment with the SSH connection details.
You can do that with the following command:

> `make config-ssh SSH_CMD='ssh root@69.30.85.233 -p 22037 -i ~/.ssh/id_ed25519'`

This command writes the connection settings into the local `.runpod.mk` file.

Next, run:

> `make provision`

This copies the relevant project files to the remote Runpod instance over SSH.

Once the command has finished, you should see a message similar to this:

```txt
Provisioned /workspace/pdfconvert-gpu on root@69.30.85.233.
Next step on the pod:
  cd /workspace/pdfconvert-gpu && make all
```

At that point, the project directory is ready on the remote pod, and you can log in via SSH and continue the process there.

### RunPod PDF Conversion

For the next step, connect to the remote Runpod instance over SSH:

> `ssh root@69.30.85.233 -p 22037 -i ~/.ssh/id_ed25519`

Then change your current working directory to `/workspace/pdfconvert-gpu/`:

> `cd /workspace/pdfconvert-gpu/`

Once you are in that folder, run:

> `make all`

After that, you need to wait.

> **REALLY** ... patiently wait ...

On the first run, this step can take several minutes because the environment may still need to download models and prepare the conversion pipeline.
That means a slow start does not automatically mean that something is broken.
In some cases, the process may look inactive for a while, even though work is still happening in the background.

> I only would start worrying if the full run takes longer than about `10` to `15` minutes at most.

To give you a clearer idea of what happens during this step, here is the verbatim output from my shell session:

```txt
$ ssh root@69.30.85.233 -p 22037 -i ~/.ssh/id_ed25519
Welcome to Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-57-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

This system has been minimized by removing packages and content that are
not required on a system that users do not log into.

To restore this content, you can run the 'unminimize' command.
 _____                             _ 
|  __ \                           | |
| |__) |   _ _ __  _ __   ___   __| |
|  _  / | | | '_ \| '_ \ / _ \ / _` |
| | \ \ |_| | | | | |_) | (_) | (_| |
|_|  \_\__,_|_| |_| .__/ \___/ \__,_|
                  | |                
                  |_|                
For detailed documentation and guides, please visit:
https://docs.runpod.io/ and https://blog.runpod.io/


root@c22760e84fb8:/# cd /workspace/pdfconvert-gpu/
root@c22760e84fb8:/workspace/pdfconvert-gpu# make all
uv sync
Resolved 99 packages in 9ms
Prepared 1 package in 2m 44s
Installed 97 packages in 40.37s
 + annotated-types==0.7.0
 + anthropic==0.46.0
 + anyio==4.12.1
 + beautifulsoup4==4.14.3
 + certifi==2026.2.25
 + cffi==2.0.0
 + cfgv==3.5.0
 + charset-normalizer==3.4.6
 + click==8.3.1
 + cryptography==46.0.5
 + cuda-bindings==12.9.4
 + cuda-pathfinder==1.4.3
 + distlib==0.4.0
 + distro==1.9.0
 + einops==0.8.2
 + filelock==3.25.2
 + filetype==1.2.0
 + fsspec==2026.2.0
 + ftfy==6.3.1
 + google-auth==2.49.1
 + google-genai==1.68.0
 + h11==0.16.0
 + hf-xet==1.4.2
 + httpcore==1.0.9
 + httpx==0.28.1
 + huggingface-hub==0.36.2
 + identify==2.6.18
 + idna==3.11
 + jinja2==3.1.6
 + jiter==0.13.0
 + joblib==1.5.3
 + markdown2==2.5.5
 + markdownify==1.2.2
 + marker-pdf==1.10.2
 + markupsafe==3.0.3
 + mpmath==1.3.0
 + networkx==3.6.1
 + nodeenv==1.10.0
 + numpy==2.4.3
 + nvidia-cublas-cu12==12.8.4.1
 + nvidia-cuda-cupti-cu12==12.8.90
 + nvidia-cuda-nvrtc-cu12==12.8.93
 + nvidia-cuda-runtime-cu12==12.8.90
 + nvidia-cudnn-cu12==9.10.2.21
 + nvidia-cufft-cu12==11.3.3.83
 + nvidia-cufile-cu12==1.13.1.3
 + nvidia-curand-cu12==10.3.9.90
 + nvidia-cusolver-cu12==11.7.3.90
 + nvidia-cusparse-cu12==12.5.8.93
 + nvidia-cusparselt-cu12==0.7.1
 + nvidia-nccl-cu12==2.27.5
 + nvidia-nvjitlink-cu12==12.8.93
 + nvidia-nvshmem-cu12==3.4.5
 + nvidia-nvtx-cu12==12.8.90
 + openai==1.109.1
 + opencv-python-headless==4.11.0.86
 + packaging==26.0
 + pdftext==0.6.3
 + pillow==10.4.0
 + platformdirs==4.9.4
 + pre-commit==4.5.1
 + psutil==7.2.2
 + pyasn1==0.6.3
 + pyasn1-modules==0.4.2
 + pycparser==3.0
 + pydantic==2.12.5
 + pydantic-core==2.41.5
 + pydantic-settings==2.13.1
 + pypdfium2==4.30.0
 + python-discovery==1.2.0
 + python-dotenv==1.2.2
 + pyyaml==6.0.3
 + rapidfuzz==3.14.3
 + regex==2024.11.6
 + requests==2.32.5
 + safetensors==0.7.0
 + scikit-learn==1.8.0
 + scipy==1.17.1
 + setuptools==82.0.1
 + six==1.17.0
 + sniffio==1.3.1
 + soupsieve==2.8.3
 + surya-ocr==0.17.1
 + sympy==1.14.0
 + tenacity==9.1.4
 + threadpoolctl==3.6.0
 + tokenizers==0.22.2
 + torch==2.10.0
 + tqdm==4.67.3
 + transformers==4.57.6
 + triton==3.6.0
 + typing-extensions==4.15.0
 + typing-inspection==0.4.2
 + urllib3==2.6.3
 + virtualenv==21.2.0
 + wcwidth==0.6.0
 + websockets==16.0
test -n "visa-agb.pdf" || { echo "No PDFs found in /workspace/pdfconvert-gpu"; exit 1; }
eval "$(uv run --no-sync python scripts/resolve_marker_settings.py --torch-device 'auto' --marker-workers 'auto')"
printf 'Using marker settings: TORCH_DEVICE=%s MARKER_WORKERS=%s\n' "$TORCH_DEVICE" "$MARKER_WORKERS"
uv run --no-sync python scripts/prewarm_marker_models.py
rm -rf ".marker-input"
mkdir -p ".marker-input" "out/marker"
for pdf in visa-agb.pdf; do
ln -sf "/workspace/pdfconvert-gpu/$pdf" ".marker-input/$pdf"
done
TORCH_DEVICE="$TORCH_DEVICE" uv run marker ".marker-input" --output_dir "out/marker" --workers "$MARKER_WORKERS" --output_format markdown --disable_image_extraction
Using marker settings: TORCH_DEVICE=cuda MARKER_WORKERS=3
Ensuring layout model cache at /root/.cache/datalab/models/layout/2025_09_23
Downloading manifest.json: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 262/262 [00:00<00:00, 624kB/s]
Downloading vocab_math.json: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 20.1k/20.1k [00:00<00:00, 46.9MB/s]
Downloading preprocessor_config.json: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 419/419 [00:00<00:00, 2.09MB/s]
Downloading tokenizer_config.json: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 694/694 [00:00<00:00, 3.07MB/s]
Downloading specials.json: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 19.6k/19.6k [00:00<00:00, 65.3MB/s]
Downloading specials_dict.json: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 43.5k/43.5k [00:00<00:00, 35.1MB/s]
Downloading training_args.bin: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 7.45k/7.45k [00:00<00:00, 6.44MB/s]
Downloading config.json: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 50.4k/50.4k [00:00<00:00, 5.65MB/s]
Downloading README.md: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 5.05k/5.05k [00:00<00:00, 20.3MB/s]
Downloading special_tokens_map.json: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 278/278 [00:00<00:00, 277kB/s]
Downloading .gitattributes: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 1.48k/1.48k [00:00<00:00, 8.12MB/s]
Downloading processor_config.json: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 411/411 [00:00<00:00, 1.31MB/s]
Downloading model.safetensors: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 1.35G/1.35G [00:14<00:00, 101MB/s]
Downloading layout model to /root/.cache/datalab/models/layout/2025_09_23: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 12/12 [00:14<00:00,  1.25s/it]
Ensuring recognition model cache at /root/.cache/datalab/models/text_recognition/2025_09_23
Downloading manifest.json: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 262/262 [00:00<00:00, 520kB/s]
Downloading README.md: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 5.05k/5.05k [00:00<00:00, 15.5MB/s]
Downloading vocab_math.json: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 20.1k/20.1k [00:00<00:00, 36.3MB/s]
Downloading .gitattributes: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 1.48k/1.48k [00:00<00:00, 5.92MB/s]
Downloading preprocessor_config.json: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 419/419 [00:00<00:00, 1.75MB/s]
Downloading training_args.bin: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 7.45k/7.45k [00:00<00:00, 19.9MB/s]
Downloading specials.json: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 19.6k/19.6k [00:00<00:00, 43.8MB/s]
Downloading special_tokens_map.json: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 278/278 [00:00<00:00, 248kB/s]
Downloading specials_dict.json: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 43.5k/43.5k [00:00<00:00, 26.8MB/s]
Downloading tokenizer_config.json: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 694/694 [00:00<00:00, 2.93MB/s]
Downloading config.json: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 50.2k/50.2k [00:00<00:00, 6.24MB/s]
Downloading processor_config.json: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 411/411 [00:00<00:00, 1.59MB/s]
Downloading model.safetensors: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 1.34G/1.34G [01:19<00:00, 18.2MB/s]
Downloading text_recognition model to /root/.cache/datalab/models/text_recognition/2025_09_23: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 12/12 [01:20<00:00,  6.67s/it]
Ensuring table_rec model cache at /root/.cache/datalab/models/table_recognition/2025_02_18
Downloading manifest.json: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 106/106 [00:00<00:00, 249kB/s]
Downloading config.json: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 6.22k/6.22k [00:00<00:00, 19.7MB/s]
Downloading .gitattributes: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 1.48k/1.48k [00:00<00:00, 7.38MB/s]
Downloading README.md: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 33.0/33.0 [00:00<00:00, 179kB/s]
Downloading preprocessor_config.json: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 564/564 [00:00<00:00, 2.46MB/s]
Downloading model.safetensors: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 201M/201M [00:00<00:00, 292MB/s]
Downloading table_recognition model to /root/.cache/datalab/models/table_recognition/2025_02_18: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 5/5 [00:01<00:00,  4.70it/s]
Ensuring detection model cache at /root/.cache/datalab/models/text_detection/2025_05_07
Downloading manifest.json: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 127/127 [00:00<00:00, 290kB/s]
Downloading preprocessor_config.json: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 373/373 [00:00<00:00, 2.14MB/s]
Downloading training_args.bin: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 5.49k/5.49k [00:00<00:00, 3.84MB/s]
Downloading .gitattributes: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 1.48k/1.48k [00:00<00:00, 461kB/s]
Downloading README.md: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 393/393 [00:00<00:00, 228kB/s]
Downloading config.json: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 858/858 [00:00<00:00, 2.34MB/s]
Downloading model.safetensors: 100%|█████████████████████████████████root@c22760e84fb8:/workspace/pdfconvert-gpu# tree out/
out/
█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 73.4M/73.4M [00:00<00:00, 254MB/s]
Downloading text_detection model to /root/.cache/datalab/models/text_detection/2025_05_07: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 6/6 [00:00<00:00, 10.51it/s]
Ensuring ocr_error model cache at /root/.cache/datalab/models/ocr_error_detection/2025_02_18                                                                                                                                    | 0.00/858 [00:00<?, ?B/s]
Downloading manifest.json: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 161/161 [00:00<00:00, 388kB/s]
Downloading tokenizer_config.json: 100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 1.17k/1.17k [00:00<00:00, 2.71MB/s]
Downloading README.md: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 32.0/32.0 [00:00<00:00, 30.7kB/s]
Downloading .gitattributes: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 1.48k/1.48k [00:00<00:00, 1.08MB/s]
Downloading special_tokens_map.json: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 695/695 [00:00<00:00, 2.39MB/s]
Downloading config.json: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 647/647 [00:00<00:00, 1.14MB/s]
Downloading vocab.txt: 100%|███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 972k/972k [00:00<00:00, 18.9MB/s]
Downloading tokenizer.json: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 2.78M/2.78M [00:00<00:00, 38.5MB/s]
Downloading model.safetensors: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 258M/258M [00:00<00:00, 292MB/s]
Downloading ocr_error_detection model to /root/.cache/datalab/models/ocr_error_detection/2025_02_18: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 8/8 [00:01<00:00,  6.00it/s]
2026-03-20 12:58:52,454 [INFO] marker: Started NVIDIA MPS server for chunk 0
2026-03-20 12:58:52,495 [INFO] marker: Converting 1 pdfs in chunk 1/1 with 1 processes and saving to out/marker
Processing PDFs: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 1/1 [03:08<00:00, 188.46s/pdf]
Inferenced 2 pages in 188.74 seconds, for a throughput of 0.01 pages/sec for chunk 1/1
2026-03-20 13:02:01,256 [INFO] marker: Stopped NVIDIA MPS server for chunk 0
root@c22760e84fb8:/workspace/pdfconvert-gpu# tree out/
out/
└── marker
    └── visa-agb
        ├── visa-agb.md
        └── visa-agb_meta.json

3 directories, 2 files
```

The important part at the end is the output directory.
In this example, `marker` created both a Markdown file and a JSON metadata file.
The Markdown file is usually the most practical result for further AI workflows, because it gives you plain text with a much clearer structure than the original PDF.

### Fetch Results Back

Once the process has finished on the Runpod instance, you can copy the generated output back to your local workstation:

> `make fetch-out`

This command stores the results in a local `./out` folder.
The folder structure matches the output layout on the remote Runpod instance, so the Markdown and JSON files end up in the same relative location as on the pod.

### RunPod Instance Shutdown

When you have fetched the output, go back to the Runpod web interface and stop the instance:

> `Stop > Stop Pod`

After that, terminate the instance:

> `Terminate > Terminate Pod`

At that point, no further compute charges are incurred for that pod.

> Stopping the pod ends the active runtime, while terminating it removes the pod entirely.
> For short lived conversion jobs, terminating the pod is usually the safer choice because it reduces the chance that you forget an idle instance and continue paying for it.

## Conclusion

In this blog post, you learned how to use a Runpod GPU instance to convert PDFs into Markdown documents with `marker-pdf`.
That gives you text output that is usually much easier to inspect, search, and reuse in AI workflows than the original PDF.

The main practical lesson is this: do not treat the PDF itself as the final prompt input if you want reliable results.
Convert it first, inspect the Markdown, and then give the cleaned text to your LLM or downstream processing pipeline.

## Appendix

In the repository, you will also find two additional folders besides `pdfconvert-gpu/`: `pdfconvert-cpu/` and `officeconvert-cpu/`.

These folders cover related conversion workflows for cases where you either do not need a GPU at all or want to process document types other than PDFs.
That makes the repository more useful as a small conversion toolkit, not just as a single Runpod example.

### `pdfconvert-cpu/`

The `pdfconvert-cpu/` folder contains the setup for converting PDFs to Markdown on a CPU based machine with several different methods.
These methods are usually fast enough to run locally without GPU support, although the output quality can differ significantly depending on the PDF and the conversion approach.

> It is worth testing a few methods with the same sample files to see which one gives the best results for your documents.

### `officeconvert-cpu/`

The `officeconvert-cpu/` folder contains the setup for converting other office documents such as `.docx` or `.pptx` to Markdown.
Apart from the input format, the general workflow is similar to the one used in the other two folders.
