---
layout: "layouts/post-with-toc.njk"
title: "Uncover the Corresponding Version Tag for the 'Latest' Docker Image: A Comprehensive Guide"
description: "This guide will provide the necessary details and insights into how to determine the corresponding version tag when you're utilizing 'latest' Docker tags."
creationdate: 2023-06-16
keywords: Docker, Docker-Hub, skopeo, regctl, Docker-Image-Version-Tag, Docker-Tag-Management, Docker-Latest-Tag
date: 2023-06-16
tags: ['post']
draft: false
---

## Introduction

If you've used Docker, chances are you've come across the `latest` Docker image tag. While some experts advise against using it, there are valid
reasons for doing so. For instance, I use the `ghcr.io/home-assistant/home-assistant:stable` image reference to run [Home
Assistant](https://www.home-assistant.io/) and update it whenever[^imgupd] a new version is available. Although there are other ways to check the current
version of Home Assistant, using tags like `latest` has its valid use cases.

## The Problem

However, problems arise when the `latest` tag no longer corresponds to the latest version tag, which can happen after a few months. At this point, you
may want to know which version you're currently running to estimate the probability of upgrade issues or to figure out a valid upgrade
path. Alternatively, you may want to check the version after encountering problems post-upgrade and need to roll back to the previous working version.

## The Solution

While there are several resources available on how to do this reverse mapping, none of them are entirely satisfactory. Two examples include:

* [Find Version Tag for Latest Docker Image](https://ryandaniels.ca/blog/find-version-tag-latest-docker-image/)
* [How do I check if my local docker image is outdated, without pushing from somewhere else?](https://stackoverflow.com/questions/42137511/how-do-i-check-if-my-local-docker-image-is-outdated-without-pushing-from-somewh/64309017)

For those who are impatient, you can find all the information you need in the following Jupyter notebook:

* [https://nbviewer.org/gist/cs224/b67f985f9c807c4b4c6ab6dea4bbf41d](https://nbviewer.org/gist/cs224/b67f985f9c807c4b4c6ab6dea4bbf41d)[^gist]

## Getting started

In order to follow along you need to install the command line tool [regctl](https://github.com/regclient/regclient). Just go to its github site and
follow the instructions.

## Find the version tag that corresponds to your local docker image

For this example, I am using the Home Assistant `stable` image:

```python
image = 'ghcr.io/home-assistant/home-assistant:stable'
image_base = 'ghcr.io/home-assistant/home-assistant'
```

The first step is to retrieve the available tags for your `image_base`:

```python
def get_image_tags(image_ref, pattern=r'^.*$'):
    cmd = f'regctl tag ls {image_ref}'
    cmd = [itm for itm in cmd.split(' ') if itm != '']
    result = run_cmd(cmd).strip()
    result = result.split('\n')
    result = [r for r in result if re.match(pattern, r)]
    return result

get_image_tags(image_base)[-50:]

['2023.6.0.dev20230530',
 '2023.6.0.dev20230531',
 '2023.6.0b0',
 '2023.6.0b1',
 ...
 '2023.6.0b5',
 '2023.6.0b6',
 '2023.6.1',
 '2023.6.2',
 '2023.7.0.dev20230601',
 '2023.7.0.dev20230602',
 ...
 '2023.7.0.dev20230615',
 '2023.7.0.dev20230616',
 'beta',
 'dev',
 'latest',
 'rc',
 'stable']
```

However, the output may contain many tags that you're not interested in. To streamline the process, filter the tag list using a regex pattern:

```python
get_image_tags(image_base, pattern=r'^\d\d\d\d\.\d+\.\d+$')[-50:]
['2022.8.1',
 '2022.8.2',
 ...
 '2023.6.0',
 '2023.6.1',
 '2023.6.2']
```

Filtering the tags is also helpful because the next step is a slow process that requires calling the Docker registry API iteratively several times.

Once you've filtered the tags, generate the digest overview:

```python
ldf = generate_docker_image_overview(image_base, tag_pattern=r'^\d\d\d\d\.\d+\.\d+$', tag_limit=10)
```

You can see the output at the bottom of the [notebook](https://nbviewer.org/gist/cs224/b67f985f9c807c4b4c6ab6dea4bbf41d).

You may also store this output as an Excel file for later use.

Next, determine which digest your local Docker image is using by running `docker image ls --digests` on the machine where your Docker image is
located. The output may resemble the following:

```sh
docker image ls --digests

REPOSITORY                              TAG          DIGEST                                                                    IMAGE ID       CREATED        SIZE
ghcr.io/home-assistant/home-assistant   stable       sha256:d1dadb8e6ae23c76875c24b72c7af85cbf0e35fd0f6fbfdb27f6ec56741bb7b9   b47dfdcdb2f9   7 days ago     1.75GB
```

Finally, take a portion of the digest and search for it in your digest overview:

```python
repo_digest_part = 'd1dadb8e6'
ldf[ldf['digest'].str.contains(repo_digest_part)]
```

The answer will appear in the `tag` column of the Pandas dataframe as `2023.6.1`.

## Conclusion

In conclusion, while it's generally recommended to steer clear of tags like `latest`, there may be instances where they're necessary.
If you find yourself in this situation, the procedure outlined above can be a useful tool for identifying the specific image you're running.

I welcome any comments or suggestions you may have, so please feel free to share them below.

## Footnotes

[^imgupd]: If you update Docker images regularly, you'll be glad to know that there are tools like [Watchtower](https://containrrr.dev/watchtower/) or
    [Diun](https://crazymax.dev/diun) that can make your Docker image update process a breeze.
[^gist]: https://gist.github.com/cs224/b67f985f9c807c4b4c6ab6dea4bbf41d

