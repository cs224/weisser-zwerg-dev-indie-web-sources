---
layout: "layouts/post-with-toc.njk"
title: "Quick Tip Nugget: Export ChatGPT Chats to Markdown for Desktop Search (DocFetcher, Recoll)"
description: "ChatGPT's built-in chat search is limited. Exporting your chat history, converting it to Markdown, and making it full-text searchable with a local desktop search engine fixes this."
keywords: ChatGPT, desktop full-text search, Markdown, DocFetcher, Recoll
creationdate: 2025-12-01
date: 2025-12-01
tags: ['post']
---

## Rationale

If you use ChatGPT a lot, you have probably noticed that searching in your chat history sucks.
The built-in search for past conversations is limited and often does not find what you need.

In this quick-tip nugget, I'll show you how exporting your ChatGPT chat history, converting it to Markdown, and making it full-text searchable with a local desktop search engine like [DocFetcher](https://docfetcher.sourceforge.io/) or [Recoll](https://www.recoll.org/) can solve this problem.
This way you get fast, offline, powerful search across all your past ChatGPT conversations.

### Different Readers and Different Levels of Prior Knowledge

Different readers have different levels of prior knowledge, so it is hard to write one guide that fits everyone.
If the explanations below feel too short or too advanced for you, just copy the URL of this post into an AI assistant like ChatGPT and ask it to walk you through the sections you are not yet comfortable with.
For example, you can ask it to explain unfamiliar concepts or show the same steps for a different Linux distribution.

## Step 1: Export your ChatGPT chat history

In [ChatGPT](https://chatgpt.com/), go to the lower left corner, click your profile icon, and choose 'Settings'. In the 'Data controls' section, click 'Export data', then confirm with 'Export'.
ChatGPT will show a short message that you will receive an email with a download link for your export.

Depending on how much you use ChatGPT, the export file can be quite large (150MB and larger), because it contains all your conversations and some account related data.

> Be patient. This can take 20 minutes or longer, especially if you have many chats.

When the email arrives, click the download link and save the exported chat history as a zip file on your computer.

> If you do not see the email after some time, check your spam or junk folder.
> The download link is usually time limited, so it is a good idea to download the file shortly after you receive the email.

## Step 2: Extract the zip somewhere on your file system

Find a folder on your hard disk where you want to extract the zip file from the ChatGPT export.

The main files in the extracted folder are `chat.html` and `conversations.json`. If your chat history is still small, you can double click on `chat.html` and your full chat history will open in your browser.
There you can use the standard search function of your browser, for example with `Ctrl + F` or `F3`.

> `chat.html` is mainly for reading and quick manual search.
> The `conversations.json` file contains the same data in a structured format.
> In the next step you will use this JSON file as the input for the converter that creates one Markdown file per conversation.

If your chat history is large, opening `chat.html` in the browser is no longer practical. The file will load very slowly and can even freeze or crash your browser.

## Step 3: Convert to Markdown

The next step is to convert your chat history to Markdown, with one Markdown file per chat.

For this we will use the tool [chatgpt-conversation-extractor](https://github.com/slyubarskiy/chatgpt-conversation-extractor).
The install instructions in the official [user guide](https://github.com/slyubarskiy/chatgpt-conversation-extractor/blob/master/docs/USER_GUIDE.md) are helpful, but they are not fully correct, so I show a working variant here.

The extractor reads `conversations.json` and writes files like `some-topic.md` into an output directory.
Each Markdown file contains the full conversation, usually including metadata such as creation time, model, and the link back to the original ChatGPT chat.

> I use the [UV](../openpgp-card-hardware-keys-remotely/#venv-set-up) Python package manager here, but feel free to use [conda](https://www.anaconda.com/docs/getting-started/miniconda/main), the built in [venv](https://docs.python.org/3/library/venv.html), or any other tool for managing Python environments.

```bash
# Inside the folder that contains conversations.json
git clone https://github.com/slyubarskiy/chatgpt-conversation-extractor.git
cd chatgpt-conversation-extractor
mkdir -p output

# Create and activate venv
uv venv .venv
source .venv/bin/activate

# Install third party dependencies (PyYAML, etc.)
uv pip install -r requirements.txt

# Install this repo itself into the venv so `chatgpt_extractor` is importable
uv pip install -e .

uv run python -m chatgpt_extractor ../conversations.json ./output --output-format markdown
```

You can also run the tool directly from GitHub with `uvx` without cloning the repository.
Because the project is a normal Python package with `setup.py` but is not published on PyPI, you need to tell `uvx` to install it from GitHub via the `--from git+...` option.
```bash
uvx --from git+https://github.com/slyubarskiy/chatgpt-conversation-extractor.git python -m chatgpt_extractor \
  /path/to/conversations.json /path/to/output --output-format markdown

# Or if you prefer a concrete version or branch:
uvx --from git+https://github.com/slyubarskiy/chatgpt-conversation-extractor.git@master python -m chatgpt_extractor ...
```

What this does:

* `uvx` creates a temporary cached virtual environment.
* It installs the package from that GitHub repository using its `setup.py`.
* It then runs `python -m chatgpt_extractor ...` inside that environment.

You do not need to clone or manually install anything yourself in this mode.
`uvx` handles that and reuses the cached environment on later runs, which makes it quite efficient once it is set up.

> If you prefer conda or a plain `venv`, the important part is that `chatgpt_extractor` must be installed into the active environment (for example with `pip install -e .` inside the cloned repository) so that `python -m chatgpt_extractor` works.

## Step 4: Adapt the file timestamps (Optional)

This step is optional but very useful.
The created Markdown files will have a metadata front matter that looks like this:

```txt
---
id: 686...97f
title: ...
created: "2025-07-07T19:31:52.312252Z"
updated: "2025-07-20T14:08:17.331480Z"
model: o3
starred: False
archived: False
chat_url: "https://chatgpt.com/c/686...97f"
total_messages: 6
code_messages: 0
message_types: reasoning_recap, text, thoughts
---
```


If you go into the folder where the Markdown files have been created, for example `./output/md`, and then run the following bash script (just copy and paste it into your terminal), it will adapt the file modification timestamps to the `created:` timestamp from the front matter.
```bash
for f in *.md; do  # Loop over all files in the current directory that end with .md, assigning each filename to variable "f"
  ts=$(sed -n 's/^created:[[:space:]]*"\(.*\)".*/\1/p' "$f" | head -n1)  # Use sed to extract the value of the "created" field from the file and store it in ts (first match only)
  [ -z "$ts" ] && ts=$(sed -n 's/^updated:[[:space:]]*"\(.*\)".*/\1/p' "$f" | head -n1)  # If ts is empty, extract the "updated" field instead and store that in ts
  [ -z "$ts" ] && continue  # If ts is still empty (no created/updated field found), skip this file and move to the next
  ts=${ts%Z}           # Remove a trailing "Z" (denotes UTC in ISO 8601) from the timestamp string
  ts=${ts%%.*}         # Remove the fractional seconds part (everything after the first dot) from the timestamp
  touch -d "$ts UTC" "$f"  # Use the cleaned timestamp (interpreted as UTC) to set the file's modification time
done  # End of the loop over all .md files
```

> This script assumes a GNU userland, for example a typical Linux system where `touch -d` is available.
> On macOS you might need to install GNU coreutils and use `gdate` or adjust the command accordingly.
> Also make sure that you run the script in the correct directory, that is the one that actually contains your `.md` files.

## Step 5: Use a Desktop Search Engine

Now you can choose a desktop search engine that you want to use. A few options are:
* [DocFetcher](https://docfetcher.sourceforge.io/)
* [Recoll](https://www.recoll.org/)
* ... and [many others](https://de.wikipedia.org/wiki/Liste_von_Desktop-Suchprogrammen) ...

I installed Recoll via `apt`:
```bash
sudo apt update
sudo apt install recoll recollgui
# (Optional but useful) Install helpers for more formats, for example:
sudo apt install poppler-utils antiword catdoc libimage-exiftool-perl
```

Once installed, you configure the directory `./output/md` (where your Markdown files live) as a search root in your desktop search engine and let it index the files.

After indexing, you can search these files using the full text search of your desktop search engine, with all the usual features like queries, filters, and result ranking.

> If you have adapted the file timestamps to the created timestamp, then in Recoll you can sort by date using the blue up and down "Sort by dates..." arrows.

This makes it very easy to find the newest conversations for a given search term or to work through older results in chronological order.

## Step 6: Adapt VSCode / VSCodium "Explorer" file view by date

> I use [VSCodium](https://vscodium.com/) instead of [VSCode](https://code.visualstudio.com/). VSCodium is a community driven, freely licensed binary distribution of Microsoft's editor VSCode with the Microsoft bits removed.
> In that regard it relates to VSCode in a similar way as the [LibreWolf](https://librewolf.net/) browser relates to the [Firefox](https://www.firefox.com/) browser.

Here is how to sort the Explorer view by last modified date and then switch back to alphabetical order when you want to.

**Sort Explorer by *last modified date***
1. Press `Ctrl` + `,` to open **Settings**.
2. In the search box at the top, type:
   `explorer.sortOrder`
3. You will see the setting **Explorer: Sort Order**.
4. Change its value to **Modified** from the dropdown.

This makes the Explorer sort files and folders by the last modified date.

> If you only want this for your current project, click the **Workspace** tab in Settings first and change it there.

**Switch back to alphabetical (by name)**

Repeat the same steps, but now set **Explorer: Sort Order** to:
* **Default** (folders first, then files, all in alphabetical order), or
* **Files First** (also alphabetical, just with files grouped first),

depending on what you prefer.

The `touch` script from the previous step updated the modified time of the Markdown files, so using **Modified** as the sort order lines up the file list with the `created` timestamps from the front matter.

This is especially handy when you open a folder that contains many exported chats. You immediately see the most recent conversations at the top, just like in the ChatGPT interface, but now as local Markdown files.

## Step 7: Makefile

Here you find a Makefile that performs the installation and timestamp adaptation in one go.

You start again by cloning the `chatgpt-conversation-extractor` project into the folder where you extracted your ChatGPT export zip file.

```bash
git clone https://github.com/slyubarskiy/chatgpt-conversation-extractor.git
cd chatgpt-conversation-extractor
```

Then you create the following GNU Makefile in this directory:

```make
# Makefile for chatgpt-conversation-extractor using uv

UV       ?= uv
PYTHON   ?= python
VENV_DIR  = .venv

# Defaults - override on the command line, for example:
#   make extract INPUT=/path/to/conversations.json OUTPUT=/tmp/out FORMAT=markdown
INPUT    ?= ../conversations.json
OUTPUT   ?= output
FORMAT   ?= markdown

# Directory containing markdown files produced by the extractor
MD_DIR   ?= $(OUTPUT)/md

# Timestamp preference: primary then secondary (can be overridden)
# Example:
#   make fix-timestamps TS_PRIMARY=updated TS_SECONDARY=created
TS_PRIMARY   ?= created
TS_SECONDARY ?= updated

.PHONY: help venv install extract extract-script fix-timestamps extract-and-fix clean

help:
	@echo "Usage:"
	@echo "  make install                    # create .venv and install deps + package"
	@echo "  make extract        INPUT=... OUTPUT=... [FORMAT=markdown|html|raw]"
	@echo "  make extract-script INPUT=... OUTPUT=... [FORMAT=markdown|html|raw]"
	@echo "  make fix-timestamps             # touch .md files based on created/updated headers"
	@echo "  make extract-and-fix            # extract, then fix timestamps"
	@echo "  make clean                      # remove .venv"
	@echo
	@echo "Current defaults:"
	@echo "  INPUT  = $(INPUT)"
	@echo "  OUTPUT = $(OUTPUT)"
	@echo "  FORMAT = $(FORMAT)"

# Create the uv-managed virtualenv at .venv (idempotent)
venv:
	test -d $(VENV_DIR) || $(UV) venv $(VENV_DIR)

# Install third-party deps AND this package into .venv
install: venv
	$(UV) pip install -r requirements.txt
	$(UV) pip install -e .

# Run the documented entrypoint: python -m chatgpt_extractor ...
extract: install
	mkdir -p "$(OUTPUT)"
	$(UV) run -- $(PYTHON) -m chatgpt_extractor \
		"$(INPUT)" "$(OUTPUT)" --output-format "$(FORMAT)"

# Alternative: run via the extract.py script directly
extract-script: install
	mkdir -p "$(OUTPUT)"
	$(UV) run -- $(PYTHON) extract.py \
		"$(INPUT)" "$(OUTPUT)" --output-format "$(FORMAT)"

# Fix timestamps of markdown files based on created/updated headers
fix-timestamps:
	@echo "Updating timestamps in $(MD_DIR)/*.md (primary=$(TS_PRIMARY), secondary=$(TS_SECONDARY))"
	@mkdir -p "$(MD_DIR)"
	@for f in "$(MD_DIR)"/*.md; do \
		[ -e "$$f" ] || continue; \
		ts=$$(sed -n 's/^$(TS_PRIMARY):[[:space:]]*"\(.*\)".*/\1/p' "$$f" | head -n1); \
		if [ -z "$$ts" ] && [ -n "$(TS_SECONDARY)" ]; then \
			ts=$$(sed -n 's/^$(TS_SECONDARY):[[:space:]]*"\(.*\)".*/\1/p' "$$f" | head -n1); \
		fi; \
		[ -z "$$ts" ] && continue; \
		ts=$${ts%Z}; \
		ts=$${ts%%.*}; \
		touch -d "$$ts UTC" "$$f"; \
	done

# Convenience: run extraction and then fix timestamps
extract-and-fix: extract fix-timestamps

clean:
	rm -rf $(VENV_DIR)
```

You can override the defaults when calling `make`, for example:
```bash
make extract-and-fix INPUT=../conversations.json OUTPUT=./output FORMAT=markdown
```

This will create the virtual environment, install the tool, run the extractor, and finally fix the timestamps of the generated Markdown files in one command.

## Conclusions

I hope this quick tip nugget is useful to you and improves the way you work with your ChatGPT chat history.
With Markdown exports plus a local desktop search engine, your past conversations become a searchable knowledge base that you fully control on your own machine.
