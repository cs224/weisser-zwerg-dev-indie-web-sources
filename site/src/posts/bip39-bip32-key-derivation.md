---
layout: "layouts/post-with-toc.njk"
title: "BIP-39 and BIP-32: Key Derivation and Wallet Recovery"
description: "From seed phrases to derived keys: Python notebooks, wallet interoperability, and Trezor recovery"
seodescription: "Understand BIP-39 and BIP-32 key derivation with Python notebooks, wallet recovery and interoperability, and Trezor-backed SSH, GPG, and FIDO2 keys."
creationdate: 2026-11-26
keywords: BIP-39, BIP-32, key derivation, key derivation functions, key derivation systems, seed phrases, recovery phrases, PBKDF2, HMAC-SHA512, hierarchical deterministic wallets, HD wallets, BIP-44, BIP-49, BIP-84, SLIP-44, derivation paths, hardened derivation, wallet recovery, wallet interoperability, account discovery, Bitcoin, Ethereum, Litecoin, Zcash, shielded Zcash, wallet birthday, bip_utils, Python, Jupyter notebooks, Trezor, hardware wallets, SSH, GPG, OpenPGP, FIDO2, passkeys, YubiKey
date: 2026-11-26
tags: ['post']
---

## Rationale

In [The Case for Remembering Strong Passwords](../the-case-for-remembering-strong-passwords/), I showed how we can construct different passwords from private ingredients we remember, a service name, and a set of consistent rules.
We also used hash functions to turn those inputs into reproducible passwords.
In principle, we were already using a **key derivation system**, although I did not call it that at the time.
We had a secret starting point, some variable input, and a recipe for deriving further secrets.

The useful idea is that we do not have to create and retain every secret independently.
If we keep the starting secret and the derivation recipe, we can reconstruct the secrets we need.
For cryptographic keys, standardized algorithms make that recipe precise enough for different implementations to reproduce the same results.

You may already have encountered this when setting up a cryptocurrency wallet.
The wallet asks you to back up a recovery phrase, often consisting of 12 or 24 words, which you can later use to restore access on another device.
How can a short sequence of words represent the starting point for keys used across different accounts and cryptocurrencies?
And why can entering the same words into two wallets sometimes produce different receiving addresses?

This is where [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) and [BIP-32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) come in.
BIP-39 describes how to represent computer-generated randomness as a recovery phrase and how to derive a binary seed from that phrase and an optional passphrase.
BIP-32 describes how to derive a tree of key pairs from a seed.
To recover a particular account, we also need to know which path through that tree the wallet used.
The starting secret and the recipe belong together, just as they did in the previous article.

In this post, I want to follow that process from the initial randomness through the recovery phrase and seed to the keys and addresses we actually use.
Two companion Jupyter notebooks let you follow along in Python: one uses `bip_utils` for a concise version, while the other works through the intermediate steps using more basic cryptographic primitives.
The aim is to understand what our recovery words represent and what else we need to reproduce the same keys in another wallet.

## Prerequisites

### Read the Notebooks in Your Browser

You can follow the next sections with the two notebooks open in separate browser tabs.
[nbviewer](https://nbviewer.jupyter.org/) displays their code and saved outputs without requiring a local Python installation.

* Open the [notebook using `bip_utils`](https://nbviewer.jupyter.org/github/cs224/bip39-bip32-key-derivation/blob/main/bip39-bip32-key-derivation-bip-utils.ipynb?flush_cache=true) for the concise version.
* Open the ["by foot" notebook](https://nbviewer.jupyter.org/github/cs224/bip39-bip32-key-derivation/blob/main/bip39-bip32-key-derivation-by-foot.ipynb?flush_cache=true) to follow the intermediate steps using more basic primitives.

These are read-only views.
If you want to execute the code, change the inputs, or explore further, run the notebooks locally as described below.

### Run the Notebooks Locally

The notebooks and their Python environment are in the [bip39-bip32-key-derivation project on GitHub](https://github.com/cs224/bip39-bip32-key-derivation).
You need Git, [uv](https://docs.astral.sh/uv/getting-started/installation/), and Python 3.12 or newer.
Clone the project and install its dependencies:

```bash
git clone https://github.com/cs224/bip39-bip32-key-derivation.git
cd bip39-bip32-key-derivation
uv sync --locked
```

The last command creates the project's `.venv` environment and installs the dependency versions recorded in `uv.lock`.

From the project directory, start the modern **Notebook 7** interface:

```bash
uv run jupyter notebook
```

For the classic notebook interface provided by **nbclassic**, use:

```bash
uv run jupyter nbclassic
```

Either command starts a local Jupyter server and opens its file browser in your browser.
If no browser window opens automatically, copy the local URL printed in the terminal.
Open `bip39-bip32-key-derivation-bip-utils.ipynb` and `bip39-bip32-key-derivation-by-foot.ipynb` from the file browser, using the **Python 3 (ipykernel)** kernel if prompted.
Run the cells from top to bottom; **Shift+Enter** executes the current cell and moves to the next one.
Keep the notebooks open alongside this article as we work through the derivation process.

## By Foot

I prefer to start with the individual steps so that we can see what the library will later do for us.
If you prefer to use the library directly, skip ahead to the part using `bip_utils`; the [concise notebook](https://nbviewer.jupyter.org/github/cs224/bip39-bip32-key-derivation/blob/main/bip39-bip32-key-derivation-bip-utils.ipynb?flush_cache=true) follows that approach.
For this part, keep the ["by foot" notebook](https://nbviewer.jupyter.org/github/cs224/bip39-bip32-key-derivation/blob/main/bip39-bip32-key-derivation-by-foot.ipynb?flush_cache=true) open alongside the article.
The code spells out the derivation and address encoding using Python's standard library, with `coincurve` for elliptic-curve primitives.

### BIP-39

[BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) defines both how to represent initial random bytes as a recovery phrase and how to derive a seed from that phrase.
We will follow those two stages separately.
The random bytes, the recovery phrase, and the seed are related, but they are three different values at different stages of the process.

#### Each Word Represents 11 Bits

The [English BIP-39 word list](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt) contains **2,048 words** in a defined order.
Since `2048 = 2 ** 11`, each word can represent exactly 11 bits.
The indices start at zero, so the first word, `abandon`, represents `00000000000`, and the last word, `zoo`, represents `11111111111`.

| Index | 11-bit representation | Word |
| --- | --- | --- |
| 0 | `00000000000` | `abandon` |
| 1 | `00000000001` | `ability` |
| 3 | `00000000011` | `about` |
| 102 | `00001100110` | `art` |
| 2047 | `11111111111` | `zoo` |

The project includes this list as `english.txt`, so the notebook can read it locally.
Use the exact list in its original order: a word means the index at which it appears in that list.

```python
from pathlib import Path

wordlist = Path("english.txt").read_text(encoding="utf-8").splitlines()
assert len(wordlist) == 2048
assert len(set(wordlist)) == 2048

for index in (0, 1, 3, 102, 2047):
    print(f"{index:4d}  {index:011b}  {wordlist[index]}")
```

The format `:011b` displays an integer in binary, padded to 11 digits with leading zeroes.
Those leading zeroes matter when we later join the groups back into one bit sequence.

#### Starting with Entropy and Adding a Checksum

Twelve words give us `12 * 11 = 132` bits, while 24 words give us `24 * 11 = 264` bits.
The original random input accounts for 128 or 256 of those bits.
BIP-39 calls that input **entropy** and appends a short checksum calculated from it.

The checksum length is the entropy length divided by 32.
To calculate it, we first apply SHA-256 to the **raw entropy bytes**, in their existing order.
The hexadecimal and binary strings we use to display those bytes are just representations; the hash function receives the bytes themselves.
SHA-256 returns a 32-byte digest, or 256 bits.

We read the digest from its first byte onward, taking each byte's bits from most significant to least significant.
This is the same order as writing the complete digest as a **big-endian binary integer**, padded to 256 bits so that leading zeroes are preserved.
The checksum consists of the leftmost bits in that representation: four bits for 128 bits of entropy, or eight bits for 256 bits of entropy.
We append those selected checksum bits to the end of the original entropy bits, keeping the same first-byte-first, most-significant-bit-first order for the entropy.

This gives the following combinations:

| Entropy bits | Checksum bits | Total bits | Words |
| --- | --- | --- | --- |
| 128 | 4 | 132 | 12 |
| 160 | 5 | 165 | 15 |
| 192 | 6 | 198 | 18 |
| 224 | 7 | 231 | 21 |
| 256 | 8 | 264 | 24 |

We will use the 12- and 24-word cases.
For a reproducible example, start with 128 zero bits; changing `ENTROPY_BITS` to `256` gives the longer example.
The optional BIP-39 passphrase will come into play when we derive the seed.

```python
ENTROPY_BITS = 128  # Use 256 for the 24-word example.
BIP39_PASSPHRASE = ""
```

In Python, `bytes(16)` gives us 16 zero bytes, or 128 zero bits.
For the longer example, `bytes(32)` gives us 256 zero bits.
These are deliberately predictable public examples.
For a real wallet, the starting bytes need to come from a cryptographically secure random generator, such as `secrets.token_bytes()`.
Hashing a memorable value such as `1234` would give us bytes of the right size, but they would remain as guessable as the original value.

```python
import hashlib
import secrets

entropy = bytes(ENTROPY_BITS // 8)
# For fresh random starting bytes, use:
# entropy = secrets.token_bytes(ENTROPY_BITS // 8)

entropy_bits = "".join(f"{byte:08b}" for byte in entropy)
checksum_length = len(entropy_bits) // 32
checksum_hash = hashlib.sha256(entropy).digest()
checksum_bits = f"{checksum_hash[0]:08b}"[:checksum_length]
bits = entropy_bits + checksum_bits

print("Entropy (hex):", entropy.hex())
print("Entropy bits:", len(entropy_bits))
print("Checksum bits:", checksum_bits)
print("Total bits:", len(bits))
```

We format each byte as eight binary digits and join them to preserve the full entropy, including its leading zeroes.
The checksum is at most eight bits long, so its bits fit within the first byte of the SHA-256 digest.
For 16 zero bytes, the digest begins with the hexadecimal byte `37`, whose binary representation is `00110111`.
We take its leftmost four bits, `0011`, and append them to the 128 entropy bits, giving us 132 bits in total.
For 32 zero bytes, the digest begins with `66` in hexadecimal, or `01100110` in binary.
Here we take all eight bits of that first byte and append them to the 256 entropy bits, giving us 264 bits.
The checksum is calculated from the entropy and adds no fresh randomness.

##### Entropy and Checksum Bits in the Last Word

Each word represents 11 bits, but the checksum occupies only the final four or eight bits of the combined sequence.
The upper bits of the last word still belong to the original entropy:

| Phrase length | Entropy bits in the last word | Checksum bits in the last word |
| --- | --- | --- |
| 12 words | 7 | 4 |
| 24 words | 3 | 8 |

Suppose we have fixed the first eleven words of a 12-word phrase.
Those words account for `11 * 11 = 121` of the 128 entropy bits, leaving seven entropy bits to choose.
There are `2 ** 7 = 128` possible combinations for those remaining bits.
For each combination, we calculate SHA-256 over the complete 128 entropy bits and take its first four bits as the checksum.
The seven chosen entropy bits followed by those four calculated checksum bits give us the index of the last word.

Consequently, **there are 128 valid last words for any fixed sequence of eleven preceding words**.
These valid endings are spread across the full word list, and the particular set depends on the preceding words.
Changing the upper seven bits also requires recalculating the lower four checksum bits.

For example, with the first eleven words fixed as `abandon`, the first few possibilities are:

| Remaining entropy bits | Recalculated checksum | Word-list index | Last word |
| --- | --- | --- | --- |
| `0000000` | `0011` | 3 | `about` |
| `0000001` | `0111` | 23 | `actual` |
| `0000010` | `0110` | 38 | `age` |
| `0000011` | `1000` | 56 | `alpha` |

For a 24-word phrase, fixing the first 23 words accounts for `23 * 11 = 253` of the 256 entropy bits.
The remaining three entropy bits allow `2 ** 3 = 8` combinations, each with its own calculated eight-bit checksum.
There are therefore **eight valid last words for any fixed sequence of 23 preceding words**.

Our public examples produce specifically `about` or `art` because we fixed every entropy bit to zero, including the entropy bits in the last word.
With different entropy, the last word can use any part of the full 2,048-word list.
Each alternative ending changes the entropy and the completed recovery phrase, giving us a different seed when we perform the derivation below.

#### Splitting the Bits into Words

We now split the combined sequence into groups of 11 bits.
Each group becomes an integer, and that integer selects a word from the list.

```python
groups = [bits[offset:offset + 11] for offset in range(0, len(bits), 11)]
indices = [int(group, 2) for group in groups]
mnemonic = " ".join(wordlist[index] for index in indices)

for position, (group, index) in enumerate(zip(groups, indices), start=1):
    print(f"{position:2d}  {group}  {index:4d}  {wordlist[index]}")

print("\nRecovery phrase:", mnemonic)
```

For the 128-bit example, the first eleven groups contain only zeroes, so each selects `abandon`.
The last group consists of the remaining seven entropy bits and the four checksum bits: `0000000` followed by `0011`.
Together they form `00000000011`, which is index 3, or `about`.

The resulting 12-word phrase is therefore `abandon` repeated eleven times, followed by `about`.

For the 256-bit example, the first 23 groups again select `abandon`.
The last group contains three remaining entropy bits followed by eight checksum bits: `000` followed by `01100110`.
The resulting `00001100110` is index 102, or `art`.

That gives us `abandon` repeated 23 times, followed by `art`.
The last word contains both entropy and checksum bits; it is not simply a separate checksum word.
A wallet creating a BIP-39 phrase generates the random bytes first and calculates the words from them.

#### Recovering the Entropy and Checking the Phrase

When restoring a wallet, we usually start with the words.
We can reverse the encoding: look up each word, write its index as 11 bits, join the groups, and separate the entropy from the checksum.
For the allowed phrase lengths, the checksum has `word_count // 3` bits.

```python
words = mnemonic.split()
if len(words) not in (12, 15, 18, 21, 24):
    raise ValueError("Invalid BIP-39 word count")

recovered_bits = "".join(f"{wordlist.index(word):011b}" for word in words)
received_checksum_length = len(words) // 3
recovered_entropy_bits = recovered_bits[:-received_checksum_length]
received_checksum = recovered_bits[-received_checksum_length:]

recovered_entropy = int(recovered_entropy_bits, 2).to_bytes(
    len(recovered_entropy_bits) // 8, "big"
)
expected_checksum = f"{hashlib.sha256(recovered_entropy).digest()[0]:08b}"[
    :received_checksum_length
]
if received_checksum != expected_checksum:
    raise ValueError("BIP-39 checksum does not match")

assert recovered_entropy == entropy
print("Recovered entropy:", recovered_entropy.hex())
print("Checksum matches:", received_checksum == expected_checksum)
```

The fixed length passed to `to_bytes()` restores leading zero bytes that the integer representation would otherwise lose.
A word outside the list fails the lookup, an unsupported phrase length is rejected, and a checksum mismatch raises an error.
The checksum catches many transcription mistakes, but some changed phrases still have a valid checksum.
It cannot tell us whether a valid phrase is the one that belongs to our wallet.

#### Deriving the Seed from the Recovery Phrase

We now have a recovery phrase and can recover its original entropy.
The next BIP-39 stage uses the **text of the recovery phrase**, together with an optional passphrase, to derive a **64-byte seed**.
That seed will become the input to BIP-32.

**PBKDF2 stands for Password-Based Key Derivation Function 2**, defined in the **PKCS #5** standard.
It is a **key derivation function (KDF)**: it takes a starting secret and additional parameters and deterministically produces binary key material.
Here, the recovery phrase is our starting secret, and the seed is the derived key material.
Python implements this KDF in [`hashlib.pbkdf2_hmac(...)`](https://docs.python.org/3.12/library/hashlib.html#hashlib.pbkdf2_hmac).

BIP-39 selects HMAC-SHA512 as PBKDF2's underlying keyed hash construction, with 2,048 iterations and a 64-byte output.
The **starting secret** (the `password` argument) is the selected recovery phrase, including its last word, with the words separated by single spaces and encoded as UTF-8 bytes.
The **additional input** (the `salt` argument) is the literal text `mnemonic` followed by the optional BIP-39 passphrase, also encoded as UTF-8 bytes.
With an empty passphrase, the salt is simply `b'mnemonic'`.

A salt is an additional input that allows the same starting secret to produce different derived keys when the salt changes.
The exact way it is combined with the other inputs depends on the KDF.
In [PBKDF2-HMAC](https://www.rfc-editor.org/rfc/rfc8018.html#section-5.2), the password serves as the HMAC key, while the salt followed by a block counter forms the message for the first HMAC iteration.
We pass `password` and `salt` separately to Python's implementation, which performs those steps for us.
The expression `"mnemonic" + BIP39_PASSPHRASE` constructs the salt itself.

Before encoding either input as UTF-8, we apply [Unicode NFKD normalization](https://docs.python.org/3.12/library/unicodedata.html#unicodedata.normalize).
This gives equivalent Unicode spellings a consistent representation for the computation.
Our English example uses plain ASCII, but a passphrase can contain other characters.

```python
import unicodedata

password = unicodedata.normalize("NFKD", mnemonic).encode("utf-8")
salt = unicodedata.normalize(
    "NFKD", "mnemonic" + BIP39_PASSPHRASE
).encode("utf-8")

print(f"password = {password!r}")
print(f"salt = {salt!r}")

seed = hashlib.pbkdf2_hmac("sha512", password, salt, 2048, dklen=64)

print("Seed:", seed.hex())
print("Seed length (bytes):", len(seed))
print("Seed length (bits):", len(seed) * 8)
```

For our 12-word example with an empty passphrase, the first two printed lines are:

```text
password = b'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
salt = b'mnemonic'
```

These are the actual byte strings supplied to the key derivation function.
The `b'...'` notation is Python's representation of a byte string.
If we set the additional BIP-39 passphrase to `TREZOR`, the salt becomes `b'mnemonicTREZOR'`.

For further reading on key derivation and its inputs, see [8.6 Key derivation with HKDF](https://livebook.manning.com/book/real-world-cryptography/chapter-8#102) in *Real-World Cryptography*.
HKDF is another key derivation function with its own construction; the BIP-39 computation here uses PBKDF2.

These parameters belong to the BIP-39 format; changing them produces a different seed.
The optional passphrase is also part of the derivation input, rather than merely a password used to unlock a wallet application.
Every different normalized passphrase produces another seed, with no indication that a passphrase was mistyped.
To recover the same seed, we need both the same recovery phrase and the same passphrase, including the empty string if that was our choice.

Both the 12-word and the 24-word examples produce 512 output bits.
That output length does not turn 128 bits of original randomness into 512 bits of randomness.
The process is deterministic, and the output remains reproducible from its inputs.

The notebook also checks both examples against the [published BIP-39 test vectors](https://github.com/trezor/python-mnemonic/blob/master/vectors.json).
Those reference vectors use the additional passphrase `TREZOR`, so their seeds differ from our default example with an empty passphrase.

We have now followed BIP-39 from the starting bytes through the words to the seed.
Next, we can use that seed as the starting point for BIP-32 key derivation.

### BIP-32

We now have a seed from BIP-39.
[BIP-32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) describes how to derive a whole tree of private and public keys from that seed.
We will follow one branch down to a Bitcoin private key, then apply the same calculation to an Ethereum path.

#### Bitcoin Account Types and BIP-84

Bitcoin wallets have used several account conventions over time.
Earlier conventions include BIP-44 legacy accounts and BIP-49 nested SegWit accounts.
We will use BIP-84 native SegWit for our example.
These account types can coexist in the same wallet; the choice also determines how the resulting public keys are used to construct addresses.

| Bitcoin account type | Purpose | First receiving key path | Mainnet address prefix |
| --- | --- | --- | --- |
| Legacy P2PKH ([BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)) | `44'` | `m/44'/0'/0'/0/0` | `1...` |
| Nested SegWit P2SH-P2WPKH ([BIP-49](https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki)) | `49'` | `m/49'/0'/0'/0/0` | `3...` |
| Native SegWit P2WPKH ([BIP-84](https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki)) | `84'` | `m/84'/0'/0'/0/0` | `bc1q...` |

All three use BIP-32 key derivation.
The purpose number selects a branch of the key tree, and the account specification assigns that branch its meaning.
This helps explain why restoring the same recovery phrase can lead to different receiving addresses when two wallets select different account types.

##### Taproot (SegWit Witness Version 1)

Taproot also exists on Bitcoin.
[BIP-341](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki) defines its **SegWit witness version 1** spending rules; the output type is called **P2TR**, or Pay to Taproot.
[Litecoin also adopts Taproot](https://github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp), with the same witness-version distinction.

The P2WPKH accounts described by BIP-84 use **witness version 0**.
However, "SegWit v0" is broader than BIP-84: BIP-49's nested SegWit accounts also use a version-0 witness program, wrapped inside P2SH.
The numbers `0` and `1` identify the witness-program version; they are separate from the account's derivation-purpose number.

For **single-key Taproot accounts**, [BIP-86](https://github.com/bitcoin/bips/blob/master/bip-0086.mediawiki) specifies the familiar account hierarchy with purpose `86'` instead of `84'`.
Both conventions use BIP-32 child-key derivation.
When a wallet follows these conventions, the first receiving keys have these paths:

| Network | Account type | First receiving key path | Mainnet address prefix |
| --- | --- | --- | --- |
| Bitcoin | Native SegWit P2WPKH, witness v0 | `m/84'/0'/0'/0/0` | `bc1q...` |
| Bitcoin | Taproot P2TR, witness v1 | `m/86'/0'/0'/0/0` | `bc1p...` |
| Litecoin | Native SegWit P2WPKH, witness v0 | `m/84'/2'/0'/0/0` | `ltc1q...` |
| Litecoin | Taproot P2TR, witness v1 | `m/86'/2'/0'/0/0` | `ltc1p...` |

An address such as `bc1q...` is a **text encoding of a public payment destination**.
That destination is constructed from binary data, such as a public-key hash; an address format specifies how to write it as characters that we can copy, type, or put into a QR code.

**Bech32**, defined by [BIP-173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki), is one such address-encoding format.
It represents the destination bytes using an alphabet of 32 characters, with each character representing five bits because `2 ** 5 = 32`.
It also includes a readable network prefix and a six-character **checksum** to help detect typing and copying errors.
This checksum protects the address text; the BIP-39 checksum we discussed earlier protects the recovery phrase.

For the addresses in our table, `bc` means Bitcoin mainnet and `ltc` means Litecoin mainnet.
The following `1` is a separator.
The next character represents the witness version: `q` for `0`, or `p` for `1`.
The encoded destination data follows, and the final six characters are the checksum.
This explains the visible prefixes `bc1q...`, `bc1p...`, `ltc1q...`, and `ltc1p...`.

**Bech32m**, defined by [BIP-350](https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki), keeps the same alphabet and overall layout but changes the checksum rule to address an error-detection weakness in the original format.
Native witness-version-0 addresses use Bech32; addresses for witness version 1 and later, including Taproot, use Bech32m.
Both formats operate on public destination data after the keys have been derived.

Address construction follows key derivation.
For BIP-86, the derived public key selects the Taproot **internal key**, and the BIP-341 **TapTweak** calculation produces the output key used in the address.
We will work through that calculation and the address encoding in Python under [Constructing a Taproot Address with BIP-86](#constructing-a-taproot-address-with-bip-86).
For now, the point to keep in mind is that changing the path to `86'` alone does not construct a Taproot address.
We first derive the BIP-84 key below, then build both native SegWit and Taproot addresses.

#### Reading a Derivation Path

Our first example uses this path:

```text
m/84'/0'/0'/0/0
```

The structure follows the hierarchy introduced by BIP-44:

```text
m / purpose' / coin_type' / account' / change / address_index
```

| Element | Role | Meaning in our Bitcoin example |
| --- | --- | --- |
| `m` | Master node | Starting point of the private key tree |
| `84'` | Purpose | BIP-84 native SegWit account convention |
| First `0'` | Coin type | Bitcoin mainnet |
| Second `0'` | Account | First account, numbered zero |
| First plain `0` | Change | External chain for receiving; `1` selects the internal change chain |
| Last `0` | Address index | First key on that chain; subsequent keys use `1`, `2`, and so on |

Each slash means another child derivation.
The four zeroes after the purpose have different roles because of their positions in the path.
For example, `m/84'/0'/0'/0/1` selects the second receiving key, while `m/84'/0'/0'/1/0` selects the first change key.

#### What the Apostrophe Means

The apostrophe marks **hardened derivation**.
Every child index is encoded as an unsigned four-byte integer.
Normal indices occupy the range from `0` to `2**31 - 1`; hardened indices occupy the range from `2**31` to `2**32 - 1`.
Writing `84'` is shorthand for `84 + 2**31`, or `2147483732`, whose four-byte big-endian encoding is `80000054` in hexadecimal.
Similarly, `0'` is encoded as `80000000`, while plain `0` is `00000000`.

**Normal derivation lets a watch-only wallet follow an account without holding its private keys.**

> Here, "following an account" means monitoring payments and balances across its receiving and change addresses, including new addresses derived later.
> A wallet can generate a fresh receiving address by incrementing `address_index` while staying within the same account.
> The appendix section [Why Do Wallets Generate New Receiving Addresses?](#why-do-wallets-generate-new-receiving-addresses?) explains why wallets do this and how it affects privacy and recovery.

For this, I give the application an **extended public key**, usually called an **xpub**: a public key together with its **chain code**, the extra data needed to derive child keys.
With the account xpub for `m/84'/0'/0'` and the appropriate address-format settings, the application can generate the account's receiving and change addresses and look up their payments and balances.
It can do this because the remaining `/0/address_index` and `/1/address_index` steps are normal derivations.
The xpub alone cannot sign transactions or derive the corresponding private keys.

I encountered this with Trezor: a watch-only wallet asked for account information, but rejected the receiving address I offered until I found the right QR code.
A receiving address identifies one payment destination; the account xpub provides the information needed to follow all of that account's receiving and change addresses.
[Trezor Suite can display the account xpub as text or a QR code](https://trezor.io/learn/supported-assets/bitcoin/what-is-a-public-key-xpub) for exactly this purpose.
Sharing it reveals the account's activity, including future activity, so it is public information with privacy consequences.

**Hardened derivation requires the parent's private key material, even to derive the child public key.**
An xpub cannot cross that step.
The hardware wallet can nevertheless derive a hardened account and then export that account's xpub: the normal receiving and change branches below it remain available to the watch-only application.

There is a second reason for the hardened boundary.
**A parent xpub combined with one of its normal child private keys can reveal the parent's private key.**
Normal derivation adds an adjustment to the parent's private key; that adjustment can be calculated from the parent xpub and child index.
If the child private key leaks, subtracting the adjustment reveals the parent private key.
The [BIP-32 security discussion](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#implications) explains this risk; the calculation does not require a quantum computer.

For example, an account xpub at `m/84'/0'/0'` plus a leaked private key at `m/84'/0'/0'/0/7` can compromise the entire account.
Both steps below the account are normal, so the attacker can recover the receiving-branch private key and then the account private key.
The apostrophe on `account'` does not prevent this **within-account** compromise; it stops this attack from continuing above the account boundary.

To see the difference, suppose an attacker also has the **coin-level xpub at `m/84'/0'`** and the private key of account zero:

| Account path | Can that pair reveal the coin-level private key? |
| --- | --- |
| `m/84'/0'/0` - normal account step | Yes. The same subtraction works, compromising the other accounts below that coin-level node as well. |
| `m/84'/0'/0'` - hardened account step | No. The hardened step prevents this backward calculation. |

The public key required for this upward attack is the **parent's xpub**; an account xpub alone does not provide the xpub above it.
This is why the standard path hardens `purpose'`, `coin_type'`, and `account'`, while leaving the receiving and change branches normal: it supports account-level observation and contains the reach of a private-key leak.

First, we will translate our path into the integer indices that the derivation actually consumes:

```python
BTC_PATH = "m/84'/0'/0'/0/0"
ETH_PATH = "m/44'/60'/0'/0/0"
HARDENED = 2 ** 31


def parse_path(path):
    parts = path.split("/")
    if parts[0] != "m":
        raise ValueError("Use an absolute private-key path starting with m")

    indices = []
    for part in parts[1:]:
        hardened = part.endswith("'")
        number = part[:-1] if hardened else part
        if not number.isascii() or not number.isdigit():
            raise ValueError(f"Invalid path element: {part!r}")
        index = int(number)
        if not 0 <= index < HARDENED:
            raise ValueError("Each path number must be between 0 and 2**31 - 1")
        indices.append(index + HARDENED if hardened else index)
    return indices


for label, index in zip(BTC_PATH.split("/")[1:], parse_path(BTC_PATH)):
    print(f"{label:>3}  integer={index:10d}  bytes={index.to_bytes(4, 'big').hex()}")
```

The last two rows have the same numeric value, zero, but occur at different depths.
Each step starts from the result of the preceding step, so they produce different nodes.

#### From the Seed to the Master Key and Chain Code

> **The chain code is the extra 32-byte value we already encountered with [extended public keys](#what-the-apostrophe-means).**
> An xpub combines a public key with its chain code; the corresponding extended private key contains the same chain code alongside the private key.
> Each node in the tree has its own chain code: here we calculate the master's, while an account xpub contains that account node's chain code.

BIP-32 derives the master private key and chain code together from our BIP-39 seed using **HMAC-SHA512**.

> **What do MAC, HMAC, and HMAC-SHA512 mean?**
>
> **MAC** stands for *message authentication code*.
> A MAC takes a **key** and a **message** and produces an **authentication tag**; the same key and message always produce the same tag.
> In its usual authentication role, the key is a shared secret: the recipient recalculates the tag to check the message's integrity and authenticity.
> Someone without that key should not be able to alter the message and produce a valid replacement tag.
>
> **HMAC** is a *hash-based message authentication code*, a standard way to construct a MAC using a cryptographic hash function and a key.
> **HMAC-SHA512** uses **SHA-512** as that hash function and produces a full-length output of **512 bits, or 64 bytes**.
> The **HMAC key** is the input key to this operation; it is not inherently a wallet private key.
>
> HMAC is also useful as a building block for **key derivation**, which is its role here.
> [Chapter 3, Message authentication codes, in *Real-World Cryptography*](https://livebook.manning.com/book/real-world-cryptography/chapter-3) explains MACs, HMAC, and their applications, including deriving keys, in more detail.

For the **HMAC-SHA512** root calculation, our **starting secret** is the BIP-39 seed (the HMAC **message**).
The **additional input** is the public constant `b"Bitcoin seed"` (the HMAC **key**).
We are using HMAC to derive reproducible key material from that secret seed, rather than to authenticate a received message.
We split the resulting 64 bytes into two halves: the first 32 bytes become the master private key, and the remaining 32 bytes become the master **chain code**.

In both steps, we transform a **starting secret** using an **additional input**.
The diagram uses these shared labels, with each algorithm's own parameter names in parentheses:

```text
Recovery phrase (12 or 24 words)
  |
  | NFKD normalization + UTF-8 encoding
  v
Phrase bytes (long variable length byte string)
  |
  | starting secret (password) = phrase bytes
  | additional input (salt) = UTF-8(NFKD("mnemonic" + passphrase))
  v
PBKDF2-HMAC-SHA512 (2,048 iterations, dklen=64)
  |
  v
BIP-39 seed (64 bytes)
  |
  | starting secret (message) = seed
  | additional input (key) = b"Bitcoin seed"
  v
HMAC-SHA512 (64-byte result)
  |
  +------------------------------+
  |                              |
  v                              v
I_L: first 32 bytes             I_R: last 32 bytes
master private key             master chain code
```

These labels describe the inputs' roles in our workflow; the algorithms combine them differently.
The additional input is not always public: the BIP-39 salt can include a secret optional passphrase, while BIP-32's `b"Bitcoin seed"` is a public constant.

The phrase's byte length varies; in this workflow, both derivation steps produce 64 bytes.
The first output is the BIP-39 seed, while the second is the BIP-32 result that we split into the two 32-byte values.

The private key is interpreted as a big-endian integer between `1` and `n - 1`, where `n` is the order of the secp256k1 generator point.
The chain code is an auxiliary 32-byte value needed to derive children.
Together, the private key and chain code form an **extended private key (xprv)**.
Both values come from the HMAC result; the operation introduces no additional random input.

> **Why must the private key be smaller than `N`?**
>
> A private key is an integer `k`; its public key is the curve point `k * G`, where `G` is the fixed **generator point**.
> Repeatedly adding `G` cycles through a finite group of points.
> Its **order**, written `n` in the mathematics and `N` in our code, is the smallest positive integer for which `N * G` reaches the **point at infinity**, the group's identity element, which plays the role of zero.
> The hexadecimal constant below is this standardized secp256k1 parameter, specified in [SEC 2, section 2.4.1](https://www.secg.org/sec2-v2.pdf#page=13).
>
> After that, the public keys repeat: `(k + N) * G = k * G`.
> We therefore represent private keys using the nonzero integers **`1 <= k < N`**.
> Zero is excluded because `0 * G` gives the identity rather than a usable public key; `N` does the same.
> This scalar bound is distinct from the field prime `p` used for point coordinates, which we discuss below.
>
> A 32-byte string can encode integers from `0` through `2**256 - 1`, while `N` is slightly smaller than `2**256`.
> The first HMAC half can therefore fall outside the valid private-key range, and [BIP-32's master-key rules](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#master-key-generation) explicitly reject zero and values greater than or equal to `N`.
> That is what `1 <= int.from_bytes(private_key, "big") < N` checks.
> Silently reducing an invalid master value modulo `N` would change the specified derivation.
> The chain code is used as bytes rather than as a private scalar, so it does not need this range check.

```python
import hmac

# Order of the secp256k1 generator point.
N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141


def master_from_seed(seed_bytes):
    if not 16 <= len(seed_bytes) <= 64:
        raise ValueError("BIP-32 seeds must contain 16 to 64 bytes")
    digest = hmac.new(b"Bitcoin seed", seed_bytes, hashlib.sha512).digest()
    private_key, chain_code = digest[:32], digest[32:]
    if not 1 <= int.from_bytes(private_key, "big") < N:
        raise ValueError("Invalid BIP-32 master key")
    return private_key, chain_code


master_private_key, master_chain_code = master_from_seed(seed)
print("HMAC key:", b"Bitcoin seed")
print("HMAC message (seed):", seed.hex())
print("Master private key (I_L):", master_private_key.hex())
print("Master chain code (I_R):", master_chain_code.hex())
```

The notebook prints both HMAC inputs and both output halves.
The path's `m` refers to this master node.

#### The Public-Key Primitive

For a normal child step, we need the parent's public key.
For Bitcoin and the Ethereum example here, this is a secp256k1 elliptic-curve point calculated by multiplying the curve's generator point by the private scalar.
BIP-32 uses its **compressed 33-byte encoding**: a `02` or `03` prefix identifying the parity of the point's y coordinate, followed by the 32-byte x coordinate.

For an introduction to elliptic curves, see [5.3.1 What's an elliptic curve?](https://livebook.manning.com/book/real-world-cryptography/chapter-5#118) in *Real-World Cryptography*.

> What confused me initially was that illustrations often show a smooth, continuous curve over the real numbers.
> For secp256k1, the coordinates instead belong to a **finite field**: integers from `0` to `p - 1`, with arithmetic modulo the prime `p`.
> Here, `p = 2**256 - 2**32 - 977`.
> The curve group consists of the coordinate pairs satisfying `y² ≡ x³ + 7 (mod p)`, together with a special point at infinity.
>
> The same algebraic definition is now interpreted over a different field, giving a finite, discrete set of points with exact modular arithmetic.
> Multiplying a point by a private scalar applies the group's addition operation; it is not numerical movement along a smooth curve.
>
> There are also two distinct moduli: `p` governs coordinate arithmetic, while `n`, used in our BIP-32 code, is the order of the generator point and governs private scalars.

For the concrete secp256k1 parameters, see [Standards for Efficient Cryptography 2 (SEC 2), section 2.4.1](https://www.secg.org/sec2-v2.pdf#page=13).

We use [`coincurve`](https://github.com/ofek/coincurve) version `21.0.0` for that low-level curve operation.
It is declared in the project's dependencies.
The path handling, HMAC calculations, and private-key arithmetic remain visible in our own Python code:

```python
from coincurve import PublicKey


def compressed_public_key(private_key):
    return PublicKey.from_secret(private_key).format(compressed=True)


print("Master public key:", compressed_public_key(master_private_key).hex())
```

> **What does `compressed=True` mean?**
>
> The public key is a point with two coordinates, `x` and `y`, each represented by 32 bytes.
> With `compressed=False`, its encoding is `04 || x || y`: one prefix byte and both coordinates, totaling **65 bytes**.
> With `compressed=True`, the encoding keeps only `x` and a prefix identifying which `y` to use: `02` for an even `y`, or `03` for an odd `y`, totaling **33 bytes**.
>
> For a valid secp256k1 public key, the curve equation gives two possible `y` coordinates for a given `x`; the prefix selects the original one.
> The full point can therefore be reconstructed efficiently.
> This is a **reversible encoding of the same public key**, as specified by the [SEC 1 point-encoding rules](https://www.secg.org/sec1-v2.pdf#page=16).
> The point stays the same, but the serialized bytes differ, which matters when those bytes are hashed or used as input to BIP-32.
>
> **What does `PublicKey.from_secret(private_key)` calculate?**
>
> It interprets the private-key bytes as the integer `k` and computes the public point **`P = k * G`**.
> `G` is a fixed, standardized **point** of secp256k1, already known to the library, so we only need to supply the private key here.
> The multiplication is elliptic-curve scalar multiplication: repeated group addition, implemented efficiently using point doubling and addition.
> It is not ordinary numerical exponentiation.
> The subsequent `.format(compressed=True)` chooses how to serialize the point already calculated.
>
> **Where is the one-way "diode"?**
>
> Computing `P` from `k` is efficient, while recovering `k` from `P` and the known `G` is the **elliptic-curve discrete logarithm problem**.
> For a properly generated secp256k1 key, this is computationally infeasible with known classical methods; [BIP-32's security assumptions](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#security) rely on that difficulty.
> This is the computational "diode": like a one-way hash, the forward calculation is fast and reversing it is prohibitively expensive with known classical methods.
> Decompressing the public point does not recover the private scalar; a sufficiently capable quantum computer would change the difficulty of recovering that scalar, as discussed in [Quantum Resistance in Bitcoin and Privacy Blockchains](#quantum-resistance-in-bitcoin-and-privacy-blockchains).

#### Deriving a Child Private Key

Each child calculation takes a parent private key, its chain code, and a child index.
The **parent chain code becomes the HMAC-SHA512 key**.
The HMAC message is 37 bytes long, with the following layout:

| Derivation | First 33 message bytes | Last four message bytes |
| --- | --- | --- |
| Hardened | `0x00` followed by the 32-byte parent private key | Encoded child index, including its hardened bit |
| Normal | The 33-byte compressed parent public key | Encoded child index |

In both cases, the index is encoded in big-endian order.
The hardened flag is already part of its four-byte value; the apostrophe itself never enters the hash.

Split the HMAC result into `I_L` and `I_R` again.
Read `I_L` as a big-endian integer, add it to the parent private scalar, and reduce the result modulo `n`.
That gives the child private scalar.
`I_R` becomes the child chain code, which will be used at the next level:

```text
child_private_scalar = (parent_private_scalar + integer(I_L)) mod n
child_chain_code     = I_R
```

We serialize the child scalar as exactly 32 bytes, retaining any leading zero bytes.
BIP-32 rejects a result if `integer(I_L) >= n` or if the resulting child scalar is zero.
The specification calls for trying the next index in that exceptional case.
Our helper raises an error so that we can explicitly choose and record an updated path.

```python
def derive_child(parent_private_key, parent_chain_code, index, trace=False):
    if len(parent_private_key) != 32 or len(parent_chain_code) != 32:
        raise ValueError("Private keys and chain codes must each contain 32 bytes")
    parent_scalar = int.from_bytes(parent_private_key, "big")
    if not 1 <= parent_scalar < N:
        raise ValueError("Invalid parent private key")
    if not 0 <= index < 2 ** 32:
        raise ValueError("Child index must fit into four unsigned bytes")

    hardened = index >= HARDENED
    index_bytes = index.to_bytes(4, "big")
    if hardened:
        parent_data = b"\x00" + parent_private_key
    else:
        parent_data = compressed_public_key(parent_private_key)
    data = parent_data + index_bytes

    digest = hmac.new(parent_chain_code, data, hashlib.sha512).digest()
    left, child_chain_code = digest[:32], digest[32:]
    tweak = int.from_bytes(left, "big")
    if tweak >= N:
        raise ValueError("Invalid BIP-32 child; try the next index")
    child_scalar = (parent_scalar + tweak) % N
    if child_scalar == 0:
        raise ValueError("Invalid BIP-32 child; try the next index")
    child_private_key = child_scalar.to_bytes(32, "big")

    if trace:
        print("Hardened:", hardened)
        print("Child index:", index)
        print("Index bytes:", index_bytes.hex())
        print("HMAC key (parent chain code):", parent_chain_code.hex())
        print("HMAC message:", data.hex())
        print("I_L:", left.hex())
        print("I_R (child chain code):", child_chain_code.hex())
        print("Parent private key:", parent_private_key.hex())
        print("Child private key:", child_private_key.hex())

    return child_private_key, child_chain_code
```

The `trace` argument controls printing of intermediate values and leaves the calculation unchanged.

For the first child derivation, the master private key and master chain code from our earlier diagram become the parent pair.
The child index supplies the third input; for example, `84'` means `84 + 2**31`.
One step then produces the next pair as follows (`||` means concatenating bytes):

```text
Master private key (32 bytes)       Master chain code (32 bytes)
  |                                  |
  +----------------------------------+
  |
  v
Parent pair: (parent_private_key, parent_chain_code)
  |
  | child index i (including its hardened bit)
  | index_bytes = i encoded as 4 big-endian bytes
  v
Build derivation data (37 bytes)
  |
  | hardened: 0x00 || parent_private_key || index_bytes
  | normal:   compressed_public_key(parent_private_key) || index_bytes
  |
  | input (message) = derivation data
  | additional input (key) = parent_chain_code
  v
HMAC-SHA512 (64-byte result)
  |
  +-------------------------------------------+
  |                                           |
  v                                           v
I_L: first 32 bytes                          I_R: last 32 bytes
  |                                           |
  | t = integer(I_L), read in big-endian       |
  | reject if t >= N                          |
  |                                           |
  | k = integer(parent_private_key)           |
  | child_scalar = (k + t) mod N               |
  | reject if child_scalar == 0               |
  | serialize child_scalar as 32 bytes        |
  v                                           v
Child private key (32 bytes)                 Child chain code (32 bytes)
  |                                           |
  +-------------------------------------------+
  |
  v
New parent pair for the next derivation-path index
```

The `I_L` and `I_R` labels refer to the halves of this new HMAC result.
Unlike the master calculation, **the child private key is not simply `I_L`**: we use it as an adjustment to the parent private scalar.
The parent chain code determines the HMAC calculation, while the new `I_R` becomes the child's chain code.

Here the HMAC input is not always secret: a normal step uses the public key and index.
The parent private key is still needed for the final addition that produces the child private key.

#### Following the Hardened and Normal Steps

Start with the first hardened step, from `m` to `m/84'`.
The notebook prints the parent chain code used as the HMAC key, the complete message, the two digest halves, and the resulting child private key:

```python
purpose_private_key, purpose_chain_code = derive_child(
    master_private_key, master_chain_code, HARDENED + 84, trace=True
)
```

Two more hardened steps select Bitcoin and account zero.
Then the first normal step selects the external receiving chain at `m/84'/0'/0'/0`.
Here, the message starts with the account's compressed public key:

```python
coin_private_key, coin_chain_code = derive_child(
    purpose_private_key, purpose_chain_code, HARDENED + 0
)
account_private_key, account_chain_code = derive_child(
    coin_private_key, coin_chain_code, HARDENED + 0
)
external_private_key, external_chain_code = derive_child(
    account_private_key, account_chain_code, 0, trace=True
)
```

At this point, one final normal child derivation with index zero selects our first receiving key.

#### Walking the Complete Bitcoin Path

We can now put those same operations into a small loop.
At every level, the resulting private key and chain code become the inputs for the next level:

```python
def derive_path(root_private_key, root_chain_code, path, trace=False):
    private_key, chain_code = root_private_key, root_chain_code
    current_path = "m"
    nodes = [(current_path, private_key, chain_code)]

    for index in parse_path(path):
        private_key, chain_code = derive_child(private_key, chain_code, index)
        label = f"{index - HARDENED}'" if index >= HARDENED else str(index)
        current_path += "/" + label
        nodes.append((current_path, private_key, chain_code))

    if trace:
        for node_path, node_private_key, node_chain_code in nodes:
            print(node_path)
            print("  private key:", node_private_key.hex())
            print("  chain code:", node_chain_code.hex())
    return private_key, chain_code
```

Run it with our Bitcoin path and print the private key and chain code at each node:

```python
btc_private_key, btc_chain_code = derive_path(
    master_private_key, master_chain_code, BTC_PATH, trace=True
)
btc_public_key = compressed_public_key(btc_private_key)
print("Bitcoin private key:", btc_private_key.hex())
print("Bitcoin public key:", btc_public_key.hex())
```

For the public 12-word `abandon ... about` example with an empty BIP-39 passphrase, the final values are:

```text
Bitcoin private key: 4604b4b710fe91f584fff084e1a9159fe4f8408fff380596a604948474ce4fa3
Bitcoin public key: 0330d54fd0dd420a6e5f8d3624f5f3482cae350f79d5f0753bf5beef9c2d91af3c
```

The private key is the **32-byte secret** we set out to derive.
The public key is its corresponding 33-byte compressed representation.
We will now construct the BIP-84 address from this public key, then follow the additional steps for a BIP-86 Taproot address.

#### Encoding Bech32 and Bech32m Addresses

We now have a derived public key, but the receiving address still needs to be constructed.
For both native SegWit and Taproot, the final text-encoding step uses the network prefix, witness version, destination bytes, and a checksum.
We will implement that encoding once and use it for both address types.

First, regroup bytes into five-bit values.
This resembles our earlier conversion to 11-bit word-list indices, except that each group now selects one of 32 characters.
Zero bits pad the final group when necessary:

```python
def five_bit_values(raw_bytes):
    bits = "".join(f"{byte:08b}" for byte in raw_bytes)
    bits += "0" * (-len(bits) % 5)
    return [int(bits[offset:offset + 5], 2) for offset in range(0, len(bits), 5)]
```

The checksum uses the polynomial recurrence specified by [BIP-173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki).
The five generator constants below define that calculation; they are public format parameters.
The network prefix is split into high and low character bits, with a zero between them, so it is also covered by the checksum.

We append six zero values while calculating the checksum, then apply the format's final constant.
That constant is `1` for Bech32 and `0x2BC830A3` for Bech32m, following [BIP-350](https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki).
The resulting 30 bits become six five-bit checksum characters:

```python
BECH32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"


def bech32_polymod(values):
    generators = (
        0x3B6A57B2, 0x26508E6D, 0x1EA119FA, 0x3D4233DD, 0x2A1462B3,
    )
    remainder = 1
    for value in values:
        high = remainder >> 25
        remainder = ((remainder & 0x1FFFFFF) << 5) ^ value
        for bit, generator in enumerate(generators):
            if (high >> bit) & 1:
                remainder ^= generator
    return remainder


def segwit_address(hrp, witness_version, witness_program):
    if not hrp or hrp != hrp.lower() or any(not 33 <= ord(c) <= 126 for c in hrp):
        raise ValueError("Use a nonempty lowercase printable network prefix")
    if not 0 <= witness_version <= 16:
        raise ValueError("Witness version must be between 0 and 16")
    if not 2 <= len(witness_program) <= 40:
        raise ValueError("Witness program must contain 2 to 40 bytes")
    if witness_version == 0 and len(witness_program) not in (20, 32):
        raise ValueError("A version-0 witness program must contain 20 or 32 bytes")

    data = [witness_version] + five_bit_values(witness_program)
    expanded_hrp = [ord(c) >> 5 for c in hrp] + [0] + [ord(c) & 31 for c in hrp]
    checksum_constant = 1 if witness_version == 0 else 0x2BC830A3
    remainder = bech32_polymod(expanded_hrp + data + [0] * 6) ^ checksum_constant
    checksum = [(remainder >> (5 * position)) & 31 for position in range(5, -1, -1)]
    address = hrp + "1" + "".join(BECH32_ALPHABET[value] for value in data + checksum)
    if len(address) > 90:
        raise ValueError("A Bech32 or Bech32m address cannot exceed 90 characters")
    return address
```

The first data value is the witness version, which explains why the alphabet produces `q` for version `0` and `p` for version `1`.
The destination bytes and checksum follow it.
For our Bitcoin mainnet examples, the readable network prefix is `bc`.

#### Constructing a BIP-84 Address

A P2WPKH address uses the **20-byte public-key hash** as its witness program.
This hash is called **HASH160**: apply SHA-256 to the compressed public key, then RIPEMD-160 to that 32-byte digest.
The result is public destination data.
Encoding it with witness version `0` selects Bech32:

```python
btc_key_hash = hashlib.new("ripemd160", hashlib.sha256(btc_public_key).digest()).digest()
btc_address = segwit_address("bc", 0, btc_key_hash)

print("Compressed public key:", btc_public_key.hex())
print("HASH160 witness program:", btc_key_hash.hex())
print("BIP-84 address:", btc_address)
```

For the public 12-word example with an empty passphrase, the address is `bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu`, matching BIP-84's first receiving address.

#### Constructing a Taproot Address with BIP-86

Now we can return to the extra step mentioned in the account-type discussion.
[BIP-86](https://github.com/bitcoin/bips/blob/master/bip-0086.mediawiki) starts with a different BIP-32 path, `m/86'/0'/0'/0/0`.
The derived key supplies the Taproot **internal key**.
We print its private key and compressed public key so that we can see exactly where ordinary BIP-32 derivation ends:

```python
TAPROOT_PATH = "m/86'/0'/0'/0/0"
taproot_private_key, taproot_chain_code = derive_path(
    master_private_key, master_chain_code, TAPROOT_PATH
)
taproot_public_key = compressed_public_key(taproot_private_key)
internal_key = taproot_public_key[1:]

print("Taproot path:", TAPROOT_PATH)
print("Derived internal private key:", taproot_private_key.hex())
print("Derived compressed public key:", taproot_public_key.hex())
print("Internal key, x coordinate only:", internal_key.hex())
```

Taproot uses **x-only public keys**, encoded as 32-byte x coordinates.
An x coordinate corresponds to two curve points with opposite y coordinates.
The convention selects the point with **even y**, called `P` below.
We obtain that point by parsing `0x02` followed by the x coordinate; the `02` compressed-key prefix specifies even y.
If the original compressed key began with `03`, this selects the opposite point with the same x coordinate.

Next comes the **TapTweak**, defined by [BIP-341](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki).
A tagged SHA-256 hash prefixes its message with two copies of the tag's SHA-256 digest:

```text
tag_hash = SHA256(b"TapTweak")
tweak_bytes = SHA256(tag_hash || tag_hash || internal_key)
t = integer(tweak_bytes)
Q = P + t * G
```

Here, `||` means byte concatenation, `G` is the secp256k1 generator, and `t` is interpreted as a big-endian integer.
The tag separates this hash's purpose from other uses of SHA-256.
BIP-86 supplies no script-tree Merkle root, so the message after the two tag hashes contains only the internal key's 32 bytes.
There is no extra all-zero root appended.

The scalar must be smaller than `n`; an out-of-range digest is rejected, rather than reduced modulo `n`.
The result `Q` must also be a valid point.
We use `coincurve` only for lifting the x coordinate and calculating `P + t * G`; the hash inputs and address encoding remain visible in our code:

```python
def tagged_hash(tag, message):
    tag_digest = hashlib.sha256(tag).digest()
    return hashlib.sha256(tag_digest + tag_digest + message).digest()


def taproot_output_key(internal_key, trace=False):
    if len(internal_key) != 32:
        raise ValueError("The internal key must be a 32-byte x coordinate")
    internal_point = PublicKey(b"\x02" + internal_key)
    tweak_bytes = tagged_hash(b"TapTweak", internal_key)
    if int.from_bytes(tweak_bytes, "big") >= N:
        raise ValueError("TapTweak is outside the valid scalar range")

    # PublicKey.add(t) computes P + t * G and rejects a point at infinity.
    output_point = internal_point.add(tweak_bytes)
    compressed_output = output_point.format(compressed=True)
    output_key = compressed_output[1:]

    if trace:
        tag_digest = hashlib.sha256(b"TapTweak").digest()
        print("Even-y internal point P:", internal_point.format(compressed=True).hex())
        print("SHA256(TapTweak):", tag_digest.hex())
        print("Complete hash input:", (tag_digest + tag_digest + internal_key).hex())
        print("TapTweak bytes:", tweak_bytes.hex())
        print("Output point Q:", compressed_output.hex())
        print("Output key, x coordinate only:", output_key.hex())
    return tweak_bytes, output_key
```

The **32-byte x coordinate of `Q`**, rather than the internal key, is the Taproot witness program.
Encoding that program with witness version `1` selects Bech32m.
For comparison, the on-chain output script, or `scriptPubKey`, starts with `0x51` for `OP_1`, then `0x20` to push 32 bytes:

```python
taproot_tweak, taproot_program = taproot_output_key(internal_key, trace=True)
taproot_script = b"\x51\x20" + taproot_program
taproot_address = segwit_address("bc", 1, taproot_program)

print("Taproot scriptPubKey:", taproot_script.hex())
print("BIP-86 address:", taproot_address)
```

For the public 12-word example with an empty passphrase, the intermediate and final values are:

```text
Internal key: cc8a4bc64d897bddc5fbc2f670f7a8ba0b386779106cf1223c6fc5d7cd6fc115
Output key:   a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc684c
Address:      bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr
```

The internal key and output key differ even though both come from the same recovery inputs.
The BIP-32 path selects the internal key; the TapTweak produces the output key; Bech32m writes the resulting public destination as address text.
The notebook checks this complete sequence against the published BIP-86 examples and a BIP-341 wallet test vector.

##### Deriving the Taproot Signing Key

The address calculation gives us the public output key `Q`.
For a key-path spend, we also need its **tweaked private key**, as specified by [BIP-341](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki#constructing-and-spending-taproot-outputs).

Let `d0` be the private scalar derived by BIP-32.
Our internal point `P` was selected to have even y.
If `d0 * G` has odd y, the scalar for `P` is therefore `N - d0`; otherwise it remains `d0`.
Negating the scalar negates the point, preserving x and reversing y.
We then add the same TapTweak scalar `t` that we used on the public side:

```text
d = d0                  if d0 * G has even y
d = N - d0              if d0 * G has odd y
q = (d + t) mod N

q * G = P + t * G = Q
```

The 32-byte encoding of `q` is the tweaked private key.
We check the same tweak bound as before and reject zero, which would produce the point at infinity:

```python
def taproot_output_private_key(internal_private_key, trace=False):
    public_key = compressed_public_key(internal_private_key)
    d0 = int.from_bytes(internal_private_key, "big")
    d = d0 if public_key[0] == 2 else N - d0
    tweak_bytes = tagged_hash(b"TapTweak", public_key[1:])
    t = int.from_bytes(tweak_bytes, "big")
    if t >= N:
        raise ValueError("TapTweak is outside the valid scalar range")
    q = (d + t) % N
    if q == 0:
        raise ValueError("TapTweak produced an invalid private key")
    output_private_key = q.to_bytes(32, "big")

    if trace:
        print("Derived BIP-32 point has odd y:", public_key[0] == 3)
        print("Even-y internal scalar d:", d.to_bytes(32, "big").hex())
        print("TapTweak scalar t:", tweak_bytes.hex())
        print("Tweaked private scalar q:", output_private_key.hex())
    return output_private_key
```

```python
taproot_signing_private_key = taproot_output_private_key(
    taproot_private_key, trace=True
)
signing_public_key = compressed_public_key(taproot_signing_private_key)
assert signing_public_key[1:] == taproot_program
print("Signing public key matches the output key:", signing_public_key[1:].hex())
```

This verifies that the private calculation reaches the same output key as the earlier public calculation.
For a Bitcoin key-path spend, the wallet signs the transaction's Taproot signature hash with this tweaked private key.
`Q` itself can have odd y; BIP-340 Schnorr signing applies its own even-y normalization to the tweaked key, which `coincurve.PrivateKey.sign_schnorr()` handles for us.
The notebook checks the tweaked private key and resulting Schnorr signature against BIP-341's published spending vector.

#### Applying the Same Calculation to Ethereum

Our Ethereum example uses `m/44'/60'/0'/0/0`.
The purpose is `44'`, following BIP-44, and `60'` selects Ethereum's coin type in the [SLIP-44 registry](https://github.com/satoshilabs/slips/blob/master/slip-0044.md).
The number 60 is a coin identifier within the path.
BIP-44 defines the hierarchy, while BIP-32 performs the child-key calculations.

Both paths start from the same master node, including the same literal `b"Bitcoin seed"` in its root calculation.
Their different purpose and coin-type indices lead to different branches and different private keys.
We can use our existing function directly:

```python
eth_private_key, eth_chain_code = derive_path(
    master_private_key, master_chain_code, ETH_PATH, trace=True
)
eth_public_key = compressed_public_key(eth_private_key)
print("Ethereum private key:", eth_private_key.hex())
print("Ethereum compressed public key:", eth_public_key.hex())
```

The compressed Ethereum public key printed here is the BIP-32 representation used in child derivation.
Ethereum address construction uses a different encoding procedure, which we can examine separately.
For recovery, keep the actual derivation path as part of the recipe alongside the recovery phrase and any BIP-39 passphrase.

#### Checking the Results

The notebook includes checks against [BIP-32's published test vectors](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vectors) and [BIP-84's published examples](https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki#test-vectors).
The BIP-32 checks cover the master node, a path mixing hardened and normal derivation, and a leading-zero case.
The BIP-84 checks cover the first two receiving keys and the first change key, including their Bech32 addresses, using the reference example's 12 words and empty passphrase.
The notebook also checks the internal keys, output keys, and addresses from [BIP-86's examples](https://github.com/bitcoin/bips/blob/master/bip-0086.mediawiki#test-vectors), plus the exact tweak, output key, script, and address from a [BIP-341 wallet test vector](https://github.com/bitcoin/bips/blob/master/bip-0341/wallet-test-vectors.json) without a script tree.
Its private-key and signature checks reproduce the matching BIP-341 spending vector, including the published tweaked private key and Schnorr signature.
Those fixed checks remain the same when we change the inputs for our own public examples.

We have now followed the derivation from the initial entropy, through the recovery words and BIP-39 seed, to individual Bitcoin and Ethereum private keys, and constructed Bitcoin native SegWit and Taproot addresses.
The recovery phrase supplies the starting material, and the recorded derivation path tells us which key to reconstruct.

## With bip_utils

Once we understand the individual steps, we can let a library perform them.
The project already installs [`bip_utils` version 2.12.3](https://github.com/ebellocchia/bip_utils/tree/v2.12.3) through the uv setup above.
Open the [companion notebook](https://nbviewer.jupyter.org/github/cs224/bip39-bip32-key-derivation/blob/main/bip39-bip32-key-derivation-bip-utils.ipynb?flush_cache=true) to follow this shorter version.

### From Entropy to Seed

We use the same public zero-byte examples as before.
Choose 128 bits for `abandon` repeated eleven times followed by `about`, or 256 bits for 23 repetitions followed by `art`.

```python
ENTROPY_BITS = 128  # Use 256 for the 24-word example.
BIP39_PASSPHRASE = ""
```

`Bip39MnemonicGenerator` handles the checksum and word-list lookup.
`Bip39MnemonicDecoder` validates the phrase and recovers its entropy; the assertion checks our round trip.
`Bip39SeedGenerator` performs the BIP-39 seed derivation, including normalization and the optional passphrase:

```python
from bip_utils import (
    Bip39MnemonicDecoder,
    Bip39MnemonicGenerator,
    Bip39SeedGenerator,
)

entropy = bytes(ENTROPY_BITS // 8)
mnemonic = str(Bip39MnemonicGenerator().FromEntropy(entropy))
assert Bip39MnemonicDecoder().Decode(mnemonic) == entropy
seed = Bip39SeedGenerator(mnemonic).Generate(BIP39_PASSPHRASE)

print("Entropy:", entropy.hex())
print("Recovery phrase:", mnemonic)
print("Seed:", seed.hex())
print("Seed length (bytes):", len(seed))
```

The resulting phrase and 64-byte seed match the by-foot version when we select the same entropy and passphrase.

### From Seed to Bitcoin and Ethereum Keys

`Bip32Secp256k1.FromSeed()` constructs the master node, including its private key and chain code:

```python
from bip_utils import Bip32Secp256k1

master = Bip32Secp256k1.FromSeed(seed)
print("Master private key:", master.PrivateKey().Raw().ToHex())
print("Master chain code:", master.ChainCode().ToHex())
```

We can now pass each complete derivation path to `DerivePath()`.
The library handles path parsing, hardened and normal child derivation, HMAC calculations, and curve operations:

```python
paths = {
    "Bitcoin": "m/84'/0'/0'/0/0",
    "Bitcoin Taproot": "m/86'/0'/0'/0/0",
    "Ethereum": "m/44'/60'/0'/0/0",
}

derived = {}
for name, path in paths.items():
    child = master.DerivePath(path)
    derived[name] = child
    print(f"\n{name}: {path}")
    print("Private key:", child.PrivateKey().Raw().ToHex())
    print("Compressed public key:", child.PublicKey().RawCompressed().ToHex())
    print("Chain code:", child.ChainCode().ToHex())
```

`ToHex()` gives us the same hexadecimal key and chain-code representations we printed earlier.
The Bitcoin paths select the BIP-84 receiving key and BIP-86 Taproot internal key; the Ethereum path follows BIP-44 with coin type 60.
Both the private keys and compressed public keys match our by-foot results.

### Native SegWit and Taproot Addresses

The library also handles address construction.
`P2WPKHAddrEncoder` computes the public-key hash and Bech32 encoding for the BIP-84 key.
`P2TRAddrEncoder` takes the BIP-86 **internal public key** and performs the even-y point selection, TapTweak, and Bech32m encoding.
Pass the derived public key directly; applying the tweak beforehand would tweak it a second time.
The `hrp="bc"` parameter selects Bitcoin mainnet:

```python
from bip_utils import P2TRAddrEncoder, P2WPKHAddrEncoder

btc_address = P2WPKHAddrEncoder.EncodeKey(
    derived["Bitcoin"].PublicKey().RawCompressed().ToBytes(), hrp="bc"
)
taproot_address = P2TRAddrEncoder.EncodeKey(
    derived["Bitcoin Taproot"].PublicKey().RawCompressed().ToBytes(), hrp="bc"
)

print("BIP-84 address:", btc_address)
print("BIP-86 address:", taproot_address)
```

These are the same addresses constructed by foot.
The [address-encoder documentation for `bip_utils` version 2.12.3](https://github.com/ebellocchia/bip_utils/blob/v2.12.3/readme/utility/addr.md) describes the public APIs used here.

### The Taproot Signing Key

The BIP-32 private key printed above is the **internal private key**.
For the matching Taproot signing key, we apply the parity adjustment and private-key tweak explained [by foot](#deriving-the-taproot-signing-key).
Here we keep a short tagged-hash calculation and let `coincurve` perform the scalar addition and its validity checks.
`Secp256k1.Order()` supplies the same curve order `N` used earlier:

```python
import hashlib

from bip_utils import Secp256k1
from coincurve import PrivateKey


def taproot_signing_key(internal_private_key):
    key = PrivateKey(internal_private_key)
    public_key = key.public_key.format(compressed=True)
    d = int.from_bytes(internal_private_key, "big")
    if public_key[0] == 3:
        d = Secp256k1.Order() - d

    tag_digest = hashlib.sha256(b"TapTweak").digest()
    tweak = hashlib.sha256(tag_digest + tag_digest + public_key[1:]).digest()
    return PrivateKey(d.to_bytes(32, "big")).add(tweak)
```

```python
from bip_utils import P2TRAddrDecoder

signing_key = taproot_signing_key(
    derived["Bitcoin Taproot"].PrivateKey().Raw().ToBytes()
)
taproot_signing_private_key = signing_key.secret
output_key = P2TRAddrDecoder.DecodeAddr(taproot_address, hrp="bc")
assert signing_key.public_key_xonly.format() == output_key
print("Taproot signing private key:", taproot_signing_private_key.hex())
print("Signing public key matches the output key:", output_key.hex())
```

The private key and public output key match the by-foot calculation.
The notebook also reproduces BIP-341's published tweaked private key and Schnorr signature using `coincurve`'s signing API.

The notebook checks the published BIP-39, BIP-32, BIP-84, and BIP-86 examples, including the Bitcoin addresses, plus the output key, address, tweaked private key, and Schnorr signature from BIP-341 wallet vectors.
The library makes the implementation shorter, while the recovery inputs remain the same: the phrase, any additional BIP-39 passphrase, and the exact derivation path.

## Wallet Interoperability

My initial expectation was rather naive: if two wallets support the same cryptocurrency, importing the same recovery phrase should let both discover all my accounts for that cryptocurrency.
The foundation for that expectation seemed sound.
The word lists, seed calculation, key derivation, and common account paths are specified, and, as we have just seen, reproducing the calculations does not require very much code.
The transaction history is on the blockchain.
Surely a wallet could put those pieces together?

Nevertheless, that expectation failed in several different ways.
A recovery phrase does not contain an inventory of the coins, account types, and derivation paths I have used.
Even with the same BIP-39 passphrase and seed, two wallets can choose different branches, construct different address types, or search different parts of the tree.
The following are experiences from my experiments.
Some of the apparent incompatibilities turned out to be fixable, and there were positive surprises along the way.

### Guarda: The Same Phrase, a Different Zcash Path

[Guarda](https://guarda.com/support/) and [Brave](https://github.com/brave/brave-core) produced different transparent Zcash addresses from the same recovery phrase.
A small Python experiment reproduced both results:

| Wallet | Path for the first transparent ZEC address |
| --- | --- |
| Brave Wallet | `m/44'/133'/0'/0/0` |
| Guarda | `m/0'/0/0` |

Both are paths through a BIP-32 tree.
They simply select different keys.
The [Zcash verification script in the companion repository](https://github.com/cs224/bip39-bip32-key-derivation/blob/main/verify_zec_derivation.py) reproduces the two addresses with a public test phrase.

I had originally looked at Guarda because I wanted a wallet with configurable derivation paths.
Its [general derivation-path guide](https://guarda.com/support/hardware-wallet/the-wallet-is-empty-after-restoring-derivation-path-explained/) describes an Advanced Settings option for choosing a path.
The Zcash import screen had no such selector.
The [more specific import tutorial](https://guarda.com/academy/tutorials/wallet-import-from-trustwallet-to-guarda/) limits the demonstrated custom-path feature to Bitcoin.

The missing control mattered: I could reproduce Brave's key in Python, but could not select that path in the Guarda Zcash import flow.
Accepting my recovery phrase did not mean restoring the same Zcash account.

### My Wallet: Litecoin Taproot Meets an Exchange

[My Wallet](https://help.mywallet.io/), formerly MyTonWallet, matched Brave's first transparent Zcash address.
Its Litecoin default introduced another problem, though.
Version `26.11.8` selected Taproot, while the native SegWit account I wanted used a different branch:

| Litecoin account type | First receiving-key path | Address prefix |
| --- | --- | --- |
| Native SegWit | `m/84'/2'/0'/0/0` | `ltc1q...` |
| Taproot, My Wallet's default | `m/86'/2'/0'/0/0` | `ltc1p...` |

The wallet's [version-pinned path and address-type definitions](https://github.com/mytonwallet-org/mytonwallet/blob/v26.11.8/src/api/chains/utxo/constants.ts) make that choice explicit.
Here, `2'` is Litecoin's coin type; the purpose and address construction distinguish the two account types.

When I tried withdrawing LTC from Kraken to My Wallet's Taproot address, Kraken would not accept it.
That was a payment-compatibility problem in addition to the recovery-path problem: a receiving wallet can generate an address that a particular sender does not support.
Exchanges maintain their own [supported withdrawal-address formats](https://support.kraken.com/articles/360001474826-supported-address-formats-for-cryptocurrency-withdrawal).

### ShapeShift: A Wallet in a Browser Tab

This led me to try [ShapeShift](https://github.com/shapeshift/web), where I verified that my recovery phrase imported successfully.
Its native wallet is a web application: I open a page in a regular browser tab, rather than installing a browser extension.
ShapeShift's [getting-started guide](https://shapeshift.zendesk.com/hc/en-us/articles/4877234875277-Getting-Started-With-app-shapeshift-com) describes creating or restoring that native wallet and unlocking the saved wallet on later visits.
It can also connect to external wallets; that is a separate way of using the application.

Its [native-wallet implementation](https://github.com/shapeshift/web/blob/7f6b6128d341309d3b46dcd392554ccd8359605f/packages/hdwallet-native/src/bitcoin.ts) includes Litecoin native SegWit accounts: `m/84'/2'/0'` for account zero, with `/0/0` selecting its first receiving key.
That made ShapeShift a useful alternative to the Taproot default I had encountered.

### Cake Wallet: A More Compatible Result

Eventually I found [Cake Wallet](https://github.com/cake-tech/cake_wallet), and I can now access the same accounts through [MetaMask](https://support.metamask.com/), Brave Wallet, [Phantom](https://help.phantom.com/), and Cake Wallet on their shared networks.
Each application covers its own set of networks.

For Litecoin, Cake documents `m/84'/2'/0'` as its default BIP-39 account path.
However, its [Litecoin recovery documentation](https://docs.cakewallet.com/cryptos/litecoin) also exposes a useful limit: it checks the first receiving address of candidate paths for history when choosing a path.
An unused first address can therefore affect automatic path selection even if later addresses were used.
It also documents support for native SegWit and MWEB balances rather than every Litecoin address type.

### A Positive Surprise: Cake's Shielded Zcash in Brave

When Cake started [automatically shielding my incoming ZEC](https://docs.cakewallet.com/cryptos/zcash#autoshielding), I initially thought Brave Wallet could no longer handle those funds.
The transparent balance no longer told the whole story: Cake had moved the ZEC into a shielded pool.
However, I was able to fix the recovery in Brave and see the shielded balance there, too.

This requires compatible shielded keys and support for the relevant shielded pool.
Shielded key derivation has its own specification, [ZIP 32](https://zips.z.cash/zip-0032), alongside the transparent BIP-32 paths discussed earlier.
For example, Brave desktop [enabled Ironwood support by default in version `1.97.56`](https://github.com/brave/brave-browser/releases/tag/v1.97.56).

The other essential ingredient is the wallet's **birthday**: a block height telling it where to start scanning the blockchain for the account's history.
The [Zcash wallet backend documentation](https://docs.rs/zcash_client_backend/0.24.0/zcash_client_backend/data_api/struct.AccountBirthday.html) defines it as the height of the first block scanned during recovery.
Shielded outputs contain encrypted information, so the wallet uses its viewing keys while scanning to recognize the notes belonging to it and reconstruct its balance.
Knowing the recovery phrase does not automatically reconstruct that local scan history.

For an existing wallet, choose a birthday before its first relevant shielded receipt, using the original wallet's recorded restore height if available.
This is the history of the original account, not the date on which I installed Brave or imported the phrase again.
An earlier supported height means more blocks to scan; a height that is too recent can skip the very receipt I want to recover.
The birthday is recovery metadata, rather than another secret or an input that changes the derived keys.

In Brave, the developer page for this is **`brave://wallet/dev-zcash`**, entered directly in the address bar after unlocking the wallet.
The following controls are present in the [desktop version `1.97.56` implementation](https://github.com/brave/brave-core/blob/v1.97.56/components/brave_wallet_ui/page/screens/dev-zcash/dev-zcash.tsx):

1. Find the section for the relevant Zcash account and check its displayed **Account shielded birthday**.
2. If a scan is running, use **Stop orchard sync** before resetting it.
3. Under **getBalance**, enter the historical birthday block in the first numeric input. The second numeric input is a separate sync block limit.
4. For an already shielded account, click **Reset account sync state** to apply the birthday and rebuild local scan state. Otherwise, use **Upgrade to shielded** with the birthday entered.
5. Click **Start orchard sync**, leaving the separate sync block limit empty or `0` to scan to the current chain tip. Wait for synchronization to finish, then use **Reload** to refresh the balances.

The scan button's label still says Orchard in that version even though the page also displays an Ironwood balance.
Also, an empty birthday field or `0` is not a request to start at genesis: when upgrading an account, Brave [chooses a recent block for that value](https://github.com/brave/brave-core/blob/v1.97.56/components/brave_wallet/browser/zcash/zcash_wallet_service.cc).
For historical recovery, enter an explicit earlier height.

Once Brave scanned from the appropriate birthday, the shielded balance appeared.
I could use Cake and Brave as two interfaces to the same Zcash funds, including the shielded balance.

### THORWallet: Address Index Zero Is Only the Beginning

In the Bitcoin restore I tried with [THORWallet](https://www.thorwallet.org/help), it used address index `0` without discovering the later address indices I expected.
Using our BIP-84 example, the distinction is between looking only at the first of these paths and discovering activity across the receiving chain:

```text
m/84'/0'/0'/0/0   first receiving key
m/84'/0'/0'/0/1   second receiving key
m/84'/0'/0'/0/2   third receiving key
```

These paths illustrate the issue; the important part is the final address index.
It is distinct from the hardened account index, which remains `0'` in all three examples.
Reproducing the first address does not find funds received at the second or third.
After spending, a wallet also needs to account for change addresses on the `/1/...` branch.

The earlier My Wallet investigation revealed a related limit in code.
Its [version `26.11.8` import routine](https://github.com/mytonwallet-org/mytonwallet/blob/v26.11.8/src/api/chains/utxo/auth.ts) generated only the first two receiving-address candidates per candidate path by default.

Discovery cannot search an unlimited tree, so wallets need stopping rules.
[BIP-44's account-discovery procedure](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#account-discovery) uses transaction history and describes an external-address gap limit of 20 consecutive unused addresses.
It also stops account discovery at an account with no transaction history, assuming earlier accounts were used before later ones were created.
Even that standard procedure has boundaries: an address used beyond its stopping point may remain undiscovered.
Wallet-specific search limits can be much narrower.

### SSP Wallet: A Different Recovery Model

Another suggestion during my search was [SSP Wallet](https://github.com/RunOnFlux/ssp-wallet).
I ruled it out because its recovery model did not match my goal of restoring ordinary accounts from one existing phrase.
Its [support documentation](https://sspwallet.io/en/support) describes separate recovery phrases for SSP Wallet and [SSP Key](https://github.com/RunOnFlux/ssp-key), and its [backup-testing guide](https://sspwallet.io/en/academy/how-to/testing-your-backup-recovery-phrase) explains that the vault needs both keys.

In that 2-of-2 multisignature design, the browser extension holds one signing key and the mobile app holds another; both are required to authorize a transaction.
What is split is the signing authority: these are separate private keys with separate recovery phrases, rather than halves of one private key.
Deriving a key from my existing phrase would not by itself recreate the same single-key accounts as in my other wallets.

### What the Recovery Phrase Leaves Out

For these experiments, compatibility required agreement on more than the recovery words: the BIP-39 passphrase, network, derivation paths, address construction, and signing model all mattered.
The wallet then had to discover the relevant accounts, receiving addresses, and change, and support the balance types I expected to see.
For shielded Zcash, that also included scanning the appropriate history from a sufficiently early birthday.

BIP-39 and BIP-32 made the keys reproducible throughout these experiments.
What failed was my assumption that importing the phrase would automatically tell every wallet where to look and how to present everything it found.

### One Recovery Phrase in Several Apps: Convenience and Attack Surface

Importing it into a browser wallet, a mobile app, and a desktop app copies the same secret into several places, each with its own software, updates, storage, and possible failures.
That increases the **attack surface**: if one installation leaks the recovery material, the consequences can reach the accounts used in the other applications as well.
For the single-key accounts discussed here, possession of the phrase and any required BIP-39 passphrase lets an attacker derive the same keys, including for networks the compromised app never displayed.

Nevertheless, being able to watch and use the same wallet through different software is useful.
I can choose a browser interface at my desk, a mobile interface when away, and a desktop application when I prefer it, all accessing the same on-chain accounts.
Even if I only intend to watch balances in an app, importing the recovery phrase also gives that app access to spending keys; a dedicated watch-only setup instead uses addresses or suitable public or viewing keys, where supported.

Decide for yourself whether that convenience suits your risk profile.
An alternative is to generate independent recovery phrases in the different apps and transfer coins or tokens between those wallets when needed, accepting the extra backups and network fees.
Creating another account under the same phrase does not separate the recovery secrets.
MetaMask's [explanation of multiple recovery phrases](https://support.metamask.com/more-web3/wallets/how-to-use-multiple-metamask-wallets/) describes that separation and also notes that a compromised computer can still endanger several wallets stored on it.

## Appendix

### Trezor

One reason I like Trezor is that I can think of it as a **password and key generator rooted in one recovery phrase**.
Its [supported cryptocurrency wallets](https://trezor.io/coins) are the obvious application, but the same idea extends to SSH, GPG/OpenPGP, and FIDO2 authentication.
Here, many of the generated secrets are private keys that let me authenticate without typing a password.
Trezor's firmware performs the derivation inside the hardware device and uses the resulting keys for operations such as signing.
The computer can request an operation without receiving the private key.

That flexibility makes Trezor my favorite hardware secrets device.
My Model T also lets me [enter the PIN directly on its own touchscreen](https://trezor.io/guides/trezor-devices/trezor-fundamentals/pin-protection-on-trezor-devices), keeping PIN entry on the device rather than on the computer's keyboard.
I already highlighted this combination of on-device PIN entry and recoverability in the [remarks on Trezor in my SSH/FIDO2 article](../openssh-fido2-hardwarekey/#additonal-remarks:).

The recovery model is equally appealing: **one seed to back up, with recovery onto a new compatible Trezor if the original fails**.
Together with the setup information described below and any optional passphrase, that lets me reconstruct the same identities on replacement hardware.
The device PIN has a different role: it protects access to the current device, and I can choose a new PIN during recovery without changing the derived identities.

This combines the key-derivation idea from this article with the [signer pattern](../identity-signers-and-remoting/).
I can use several applications while keeping the root secret and private-key operations in the Trezor, rather than importing the recovery phrase into each application.
Different purposes use different derivation schemes and protocol adapters; the common principle is one backed-up root secret producing many purpose-specific keys.

In a setup without an additional passphrase, that root secret is the recovery phrase.
If I enable an optional passphrase for a cryptocurrency wallet or an agent-based identity, that passphrase is another secret needed for its recovery.

#### The Secret and the Recovery Recipe

Full recovery also requires the information that selects the intended key or reconstructs its surrounding identity:

| Use | Non-secret information to retain |
| --- | --- |
| Cryptocurrency wallets | Network, account type, derivation paths, and any discovery metadata such as a Zcash birthday |
| SSH through `trezor-agent` | The original identity descriptor, including the selected curve and any identity index |
| OpenSSH through FIDO2 | The security-key handle file, such as `trezor.ed25519-sk` or `id_ecdsa_sk`, and the corresponding public key |
| GPG/OpenPGP through `trezor-agent` | The exact original user-ID string, creation timestamp, curve/settings, and exported public certificate |
| FIDO2 discoverable credentials | The exported credential IDs and their service/account mapping, kept up to date as credentials are added |

These records do not independently grant signing authority.
I can keep redundant copies alongside my configuration and ordinary backups without giving every copy the power of the recovery phrase.

#### GPG: Remember the Exact Identity

With [`trezor-agent`](https://github.com/romanz/trezor-agent), an identity string helps select the derived key.
For GPG, that can be a complete user ID such as `Example author <publisher@example.org>`.
The email address is not a password, but I need the exact original setup string, including the name if it was part of that string.

The agent's [GPG guide](https://github.com/romanz/trezor-agent/blob/master/doc/README-GPG.md) also tells me to retain the original creation timestamp.
The timestamp is part of the OpenPGP public-key packet and affects its fingerprint, even when the underlying public-key material is unchanged.
Keeping the exported public certificate also preserves the public identity information attached to that key.
I described this workflow in the [Trezor-agent section of GPG Agent Forwarding with Hardware Tokens](../openpgp-card-hardware-keys-remotely/#pgp-via-roman-zayde%E2%80%99s-trezor-agent).

#### SSH: An Identity Descriptor or a FIDO2 Handle

There are two related SSH approaches.
The [`trezor-agent` SSH integration](https://github.com/romanz/trezor-agent/blob/master/doc/README-SSH.md) derives a key from an identity such as `publisher@example.org` and the selected curve.
Retaining that descriptor lets me ask the recovered device for the same key again.
[SLIP-0013](https://github.com/satoshilabs/slips/blob/master/slip-0013.md) describes how a service identity and index select a branch of a deterministic key hierarchy.

With OpenSSH's FIDO2 `-sk` key types, I instead retain a credential-handle file.
A filename such as `.ed25519-sk` is easy to mistake for an ordinary software private-key file, but the security-key-backed file contains the handle and related data needed to use the hardware credential.
It does not contain the usable private signing key.
Trezor's [SSH guide](https://trezor.io/guides/bonus-tools/ssh-with-trezor) explains this using `id_ecdsa_sk`; the available key type depends on the authenticator and software.

Restoring the recovery phrase and retaining that handle lets a compatible Trezor reproduce the registered key.
Simply running key generation again can create a different credential, so I keep the original file.
For a resident credential, the handle can also be retrieved from the authenticator once its resident record has been restored.
See my [OpenSSH FIDO2 hardware-key walkthrough](../openssh-fido2-hardwarekey/) for the SSH setup.

#### FIDO2: Back Up the Credential Table as Well

Trezor's FIDO2 implementation makes this distinction particularly clear.
[SLIP-0022](https://github.com/satoshilabs/slips/blob/master/slip-0022.md) describes a credential ID containing encrypted registration data, with the signing key derived from the root secret and information in that ID.
Registration includes randomness, so the same recovery phrase and website name alone do not recreate an old credential ID.
The original ID is part of the recovery recipe.

For **non-discoverable credentials**, the service retains the credential ID and sends it back during authentication.
For **discoverable credentials**, also called resident credentials, the authenticator keeps a local directory so it can find the relevant account without first receiving that ID from the service.
Restoring the recovery phrase does not by itself recreate this directory.

Trezor's [security-key guide](https://trezor.io/guides/bonus-tools/using-your-trezor-as-a-security-key-fido-2-and-u2f) documents how to export the resident-credential list:

```bash
trezorctl fido credentials list > trezor-fido2-credentials.txt
```

The credential IDs in that output are encrypted under a key derived from the recovery secret; the exported table is not a plaintext collection of private keys.
After restoring the same recovery phrase to a compatible FIDO2-capable Trezor, I can re-import each saved ID using `trezorctl fido credentials add ID`, replacing `ID` with the actual credential ID.
I need to refresh this backup when I register additional resident credentials.

One detail differs from the wallet examples: Trezor's [FIDO2 derivation uses the seed without an additional wallet passphrase](https://github.com/trezor/trezor-firmware/blob/main/core/src/apps/webauthn/credential.py).
A hidden-wallet passphrase therefore does not create a separate set of FIDO2 credentials.
Also, Model One supports U2F but not these FIDO2 resident-credential features.

#### When I Also Want the Key in Software

The practical drawback for me appears when I want a software copy of a particular private key.
Trezor's interface performs private-key operations inside the device and provides no private-key export.

For this use case, I use a **software-generated GPG key with a protected backup, then import the key into a YubiKey**.
I described my [GPG key-generation, backup, and hardware-import workflow](../openpgp-card-hardware-keys-remotely/#general-information-about-pgp/gpg) in the earlier hardware-token article: generate the key in a fresh live Linux environment, retain the protected offline private-key backup, and import it into the token for everyday use.
When I need software-based decryption or signing, I can restore that same backed-up key in an appropriate software environment.

The YubiKey does not provide private-key export either; the software fallback comes from keeping the original backup **before** importing the key.
[Yubico's import guide](https://developers.yubico.com/PGP/Importing_keys.html) follows this backup-before-import order as well.

The same earlier article also discusses the [same-key hardware/software recovery idea for age with a YubiKey's PIV application](../openpgp-card-hardware-keys-remotely/#the-same-key-on-a-yubikey-and-in-an-offline-recovery-backup).
It serves the same goal: use hardware normally and retain a way to recover the same private-key capability in software.

#### One Root Secret, Recoverable Supporting Data

This is the attraction for me: protect the recovery phrase as the root secret, and keep enough copies of the non-secret derivation recipes, public identities, and credential handles to make recovery practical.
Losing a laptop should not also mean losing the only copy of the information that tells a replacement Trezor which key to reconstruct.
The hardware performs the key derivation and private-key operations, while applications retain the public information needed to use them.

For ordinary website passwords, there is a further distinction.
If I use `pass` to generate random passwords and encrypt them to a Trezor-backed GPG key, as the agent's GPG guide demonstrates, I must also back up the encrypted password store.
Those random password values are stored data; they are not regenerated from the recovery phrase.
The phrase recovers the key needed to decrypt them.

### Why Use Public-Key Hashes as Payment Addresses?

When we reached address construction, I had a question:

> Why do wallets often use a hash of the public key as the payment address, rather than the public key itself?
> Is the main reason to save space on the blockchain: 20 bytes instead of a 33-byte compressed public key?
> And does Taproot actually put public-key material into the address?

Saving space is an important reason for using public-key hashes.
**Delaying public-key exposure is another benefit**, with implications for protection against future quantum attacks.
An address describes where a payment should go, and different address types describe different **spending conditions**.
Some contain a public-key hash, some contain a script hash, and Taproot contains an encoded public key.

#### Keys, Addresses, and Transaction Outputs

A **private key** creates signatures; the corresponding **public key** lets other people verify them.
A **payment address** is the public, readable encoding that a recipient gives to a sender so the sender's wallet can construct the appropriate transaction output.
The address itself does not identify a person.
For the native SegWit and Taproot examples above, Bech32 or Bech32m adds the network prefix, witness version, and error-detecting checksum around the destination data.
That checksum catches accidental errors; it does not authorize spending.

Bitcoin stores an **amount and a locking script**, called `scriptPubKey`, in each output, rather than the literal address string.
An output that has not yet been spent is an **unspent transaction output**, or **UTXO**.
A wallet can manage many addresses, and its Bitcoin balance comes from the UTXOs it recognizes as spendable.
The [Bitcoin developer guide's transaction explanation](https://developer.bitcoin.org/devguide/transactions.html) describes this output-based model.

#### What the Hash Saves

For P2PKH and P2WPKH, the destination data is `HASH160(public_key)`: SHA-256 followed by RIPEMD-160, producing **20 bytes**.
That is **13 bytes shorter** than a 33-byte compressed public key, or **45 bytes shorter** than a 65-byte uncompressed public key.
Using the shorter value reduces the data needed in the receiving output.

These are binary payload sizes, rather than the number of characters in an address or the size of a complete transaction.
The locking script also contains instructions:

| Output type | Destination data | Complete locking script |
| --- | --- | --- |
| Legacy P2PKH | 20-byte public-key hash | 25 bytes |
| Native SegWit P2WPKH | 20-byte public-key hash | 22 bytes |
| Native SegWit P2WSH | 32-byte script hash | 34 bytes |
| Taproot P2TR | 32-byte x-only output public key | 34 bytes |

The SegWit script formats are specified in [BIP-141](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki), and Taproot in [BIP-341](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki).
A complete output additionally includes its amount and a script-length field.

When a P2WPKH output is spent, the spending transaction supplies both the public key and a signature.
A receive-and-spend size comparison therefore includes those bytes as well.

**Keeping the public key hidden can also provide a security benefit, beyond saving bytes.**
If a fresh key's public key has not appeared elsewhere, a hash-based output keeps it unrevealed until spending.
Shor's quantum key-recovery attack needs the public curve point, which the hash does not directly reveal.
Keeping that point hidden prevents an attacker from starting that particular attack on the key while the funds remain untouched.

Spending reveals the public key, giving a sufficiently fast quantum attacker an opportunity to recover the private key and submit a competing spend before confirmation.
We explain this distinction, including the different exposure of Taproot's output key, in [Bitcoin: Public-Key Exposure Matters](#bitcoin:-public-key-exposure-matters) further below.

#### What a Spending Condition Requires

Suppose Alice pays Bob using the BIP-84 address we constructed above.
Alice's wallet decodes the address and creates an output containing the amount and Bob's 20-byte public-key hash.
The spending rule is effectively:

> Supply a public key whose HASH160 matches this value, and a valid signature authorizing this spend under that public key.

Later, Bob's wallet references that particular output and supplies the public key and signature in the spending transaction's **witness**, the data used to demonstrate that the spending conditions are satisfied.
Bitcoin nodes check both the hash match and the signature.
Knowing the address or public key is insufficient to produce the required signature.

Other spending conditions can require signatures from several keys, or prevent spending until a specified block height or time.
With **P2WSH**, meaning *pay to witness script hash*, the output commits to a script by storing its SHA-256 hash.
The spender later reveals the script and supplies the data needed to satisfy it.
The payer therefore needs only the script's hash, rather than all its instructions and keys, when creating the payment.

#### Why Taproot Uses a Public Key Directly

For Taproot, the address encodes the **32-byte x-coordinate of the tweaked output public key** `Q`.
As our BIP-86 example shows, this differs from the internal public key derived along the BIP-32 path.
The TapTweak calculation uses a hash to construct `Q`, but the address contains public-key material, rather than a hash of `Q`.
The [BIP-340 public-key encoding](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki) explains the 32-byte x-only representation.

For a straightforward **key-path spend**, the condition is a valid Schnorr signature under this output key.
With the default signature-hash mode, the witness can consist of a single **64-byte signature**; it need not repeat a separate public key.
Taproot's output is larger than a P2WPKH output, but this spending format saves data later.
Total transaction weight, including SegWit's lower weighting of witness data, determines the space charged for fees.

Taproot can also commit to alternative scripts, allowing a **script-path spend** that reveals and satisfies one of those alternatives while proving it was committed to by the output key.
Our BIP-86 example uses the key-path design without adding any spendable script alternatives.
[BIP-341's design and spending rules](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki) explain both paths.
Whether the address contains a key or a hash, its role is to tell the sender which spending conditions to put on the new output.

### Why Do Wallets Generate New Receiving Addresses?

I first encountered this behavior when experimenting with NFTs on Cardano, around the time of [my first NFT](../crypto-my-first-nft/).
Yoroi would generate new receiving addresses for the same wallet.
That raised another question:

> Why increment the `address_index` and give me another receiving address?
> Is this another layer of indirection to make it harder to link my payments, and does the blockchain require it?

For Bitcoin-style wallets, the main motivation is **privacy**.
Different receiving addresses make it harder for an observer to recognize payments as belonging to the same wallet.
On Cardano, the address's staking credential also affects linkability, as we will see below.

#### Different Addresses Within the Same Account

In the BIP-44 hierarchy, the final `address_index` selects another key within the same account and receiving branch:

```text
m / purpose' / coin_type' / account' / change / address_index

m/84'/0'/0'/0/0   first receiving address
m/84'/0'/0'/0/1   second receiving address
m/84'/0'/0'/0/2   third receiving address
```

The hardened `account'` index remains `0'`; we are deriving additional receiving keys inside that account.
Each key produces a different address, while the recovery phrase and derivation recipe allow the wallet to reconstruct all of them.
The blockchain does not record these derivation paths or their shared root secret.

Creating another receiving address does not move existing funds.
Earlier addresses remain valid, and the wallet continues watching them for payments.
Its displayed balance can include UTXOs received at many addresses.
No additional recovery phrase is needed, as the [Bitcoin FAQ's explanation of changing addresses](https://bitcoin.org/en/faq#why-does-my-bitcoin-address-change) describes.

#### What This Does for Privacy

Suppose Alice and Bob each pay me.
If I give both of them the same address, either can look it up and see both payments and the other activity involving that address.
If I give them different addresses, their payments no longer share that obvious public identifier.
Neither address, by itself, announces that it belongs to the same derived account as the other.
[Bitcoin's privacy guidance](https://bitcoin.org/en/protect-your-privacy) therefore recommends a fresh address for each payment.

A separate **change address** serves a related purpose.
When spending a UTXO, the entire old output is consumed.
The amount left after the payment and fee typically returns to the wallet in a new change output, using the internal `/1/...` branch instead of the external receiving `/0/...` branch.
A fresh change address avoids simply returning that amount to an already used address.

Spending UTXOs from several addresses together can suggest common ownership, and identifying change can reveal further connections.
Collaborative transactions can involve several owners.
[Bitcoin Core's address-grouping description](https://bitcoincore.org/en/doc/22.0.0/rpc/wallet/listaddressgroupings/) explicitly mentions shared inputs and change as sources of such links.

#### Wallet Policy, Recovery Scanning, and Blockchain Rules

Bitcoin and Litecoin allow repeated payments to the same address.
Their consensus rules do not require a wallet to increment a BIP-44 address index.
Nodes validate the spending conditions; they do not need to know whether the recipient used an HD wallet at all.
Generating fresh receiving addresses is therefore a wallet policy rather than a requirement for a valid transaction on these chains.

There are nevertheless interoperability conventions.
[BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) specifies sequential address indices and a discovery procedure with an **address gap limit of 20 consecutive unused addresses**.
This is a stopping rule for scanning, rather than a limit of 20 addresses in a wallet.
A sufficiently long run of unused addresses can leave later activity beyond the default search.

This separates two behaviors in my [THORWallet recovery experience](#thorwallet:-address-index-zero-is-only-the-beginning):

- Continuing to display one receiving address is a choice about address reuse.
- Looking only at index zero during recovery can miss funds received at later indices.

Generating addresses and discovering previously used addresses are separate responsibilities.
A blockchain can recognize an output as valid while a particular wallet fails to discover it.

#### Cardano: A Shared Staking Credential Can Still Link Addresses

Shelley-era Cardano uses a comparable hierarchy, specified in [CIP-1852](https://cips.cardano.org/cip/CIP-1852):

```text
m/1852'/1815'/0'/0/0   first receiving payment key
m/1852'/1815'/0'/0/1   second receiving payment key
```

Cardano uses BIP32-Ed25519 rather than the secp256k1-based BIP-32 implementation in our notebooks.
CIP-1852 requires conforming wallets to implement its sequential derivation scheme.
That wallet standard does not mean the ledger prohibits receiving several payments at one address.

The privacy qualification is in the address itself.
A common Cardano **base address** contains both a **payment credential** and a **staking credential**, as specified in [CIP-19](https://cips.cardano.org/cip/CIP-0019).
If the wallet changes the payment key but retains the same staking credential, the resulting addresses share a public component.
An explorer can therefore group them by that credential, even before any funds are spent together.
Rotating those addresses does not by itself hide their relationship to the same staking account.
This applies to base addresses sharing a staking credential; Cardano also supports address types without that component.

#### Ethereum and Monero Illustrate Different Designs

For Ethereum, each ordinary externally owned address identifies a separate **on-chain account**, with its own balance and transaction counter.
A new address does not inherit the previous address's ETH, tokens, or NFTs.
A stable address therefore fits many application workflows, although additional accounts are allowed.
The [Ethereum account documentation](https://ethereum.org/developers/docs/accounts/) explains this model.

Monero builds one-time output destinations into the payment design.
Its payment design uses **stealth addresses**: the sender derives a one-time output destination on behalf of the recipient.
The recipient can keep sharing the same public receiving address while the on-chain destinations differ.
That mechanism is built into the payment design and differs from a receiving wallet incrementing a BIP-44 address index.
The [Monero explanation of stealth addresses](https://www.getmonero.org/resources/moneropedia/stealthaddress.html) describes how these two kinds of address relate.

### Quantum Resistance in Bitcoin and Privacy Blockchains

We have already discussed [quantum attacks on signatures](../identity-signers-and-remoting/#the-math) and why [AES-256 remains suitable for encrypting a recovery backup](../the-case-for-remembering-strong-passwords/).
That raises another question for the keys and addresses we derived here:

> How quantum safe are Bitcoin and privacy mechanisms such as Zcash shielding, Litecoin MWEB, and Zano?
> Does hiding a payment also protect it against a future quantum attacker?

The systems discussed here are **not fully quantum resistant**.
Their privacy mechanisms and their protection against quantum attacks need to be examined separately.
The protocol status described below reflects **26 November 2026**.

#### Three Different Things an Attacker Could Break

| Property | What a successful attack would mean |
| --- | --- |
| **Ownership / spending authorization** | Forge authorization and spend somebody else's funds. |
| **Privacy** | Uncover information about payments that were previously hidden. |
| **Supply integrity** | Create counterfeit value or convince the network that an invalid transaction is valid. |

These properties can depend on different cryptographic assumptions.
A mechanism can preserve privacy while losing its protection against counterfeiting, or preserve the monetary supply while losing privacy.

**Shor's algorithm** is the main concern for our elliptic-curve examples: a sufficiently capable quantum computer could recover the private scalar from a public curve point.
That threatens ECDSA, Schnorr signatures, and elliptic-curve Diffie-Hellman key exchange.
Shor's attack requires a fault-tolerant, cryptographically relevant quantum computer.
The [Google Quantum AI research paper on cryptocurrency vulnerabilities](https://quantumai.google/static/site-assets/downloads/cryptocurrency-whitepaper.pdf) distinguishes these attack mechanisms.

Hashes and symmetric encryption face a different situation.
Grover's algorithm offers a generic search speedup, rather than Shor's attack on the mathematical structure of elliptic curves.
This is why our earlier conclusion about AES-256 does not carry over to elliptic-curve signatures; [NIST's post-quantum FAQ](https://csrc.nist.gov/projects/post-quantum-cryptography/faqs) explains the different implications for symmetric encryption.

#### Bitcoin: Public-Key Exposure Matters

Both Bitcoin's ECDSA signatures and [BIP-340 Schnorr signatures](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki) rely on elliptic-curve assumptions that Shor's algorithm would undermine.
The address distinction from our worked examples becomes relevant:

| Output type | What is exposed before spending? |
| --- | --- |
| P2PKH / P2WPKH | A public-key hash; the public key can remain unrevealed. |
| Taproot P2TR | The output public key itself, in its x-only encoding. |

A fresh hash-based destination adds a barrier as long as its public key has not been exposed elsewhere.
However, spending reveals the public key, and a sufficiently fast quantum attacker could try to recover its private key and submit a competing transaction before confirmation.
Reusing that key for other unspent outputs also leaves those outputs exposed afterward.

With Taproot, the attacker can target the public output key while the funds remain untouched.
Recovering its signing scalar is enough to attack a key-path spend; the attacker does not need the original BIP-32 internal key or recovery phrase.
Such an attack would authorize a new spend of an existing output, rather than require rewriting the old blocks.

[BIP-360, Pay-to-Merkle-Root](https://bips.dev/360/), proposes removing Taproot's key-path mechanism and committing directly to a script tree.
It remains a **draft**.
Its protection against long-term public-key exposure is distinct from protection during spending, which needs further measures such as post-quantum signatures.

#### Zcash: Shielding and Quantum Recoverability

Zcash's shielded protocols still contain elliptic-curve components.
Quantum attacks threaten spending authorization and proof **soundness**, the property that prevents an attacker from proving a false statement.
Losing soundness could permit theft or counterfeiting.

Zcash separates proof soundness from the confidentiality of its secret inputs using hiding commitments, randomized signing keys, and zero-knowledge proofs.
[Zcash cryptographer Sean Bowe's explanation](https://seanbowe.com/blog/zcash-and-quantum-computers/) describes why substantial on-chain privacy can survive even when other security assumptions fail.

The separate **note-encryption mechanism** creates a historical privacy risk.
Encrypted notes are recorded on the blockchain, with encryption keys established using elliptic-curve Diffie-Hellman.
An attacker who also knows the shielded receiving address could later recover viewing information and decrypt associated notes, including amounts and memos.
Recovering viewing information does not necessarily recover the spending key or root recovery phrase.

This is **harvest now, decrypt later**: save the ciphertext today and attack its key establishment in the future.

There is an important current development: [Ironwood activated with NU6.3 on 28 July 2026](https://z.cash/upgrade/nu6-3/).
[ZIP-258](https://zips.z.cash/zip-0258) specifies that every new Ironwood-pool note uses the **quantum-recoverable** format defined by ZIP-2005.
Those notes are constructed so a future post-quantum recovery protocol can establish legitimate ownership.

**The recovery protocol is a future upgrade; current spending and note encryption still use vulnerable constructions.**
The vulnerable spending protocols must be replaced or disabled before quantum attacks become feasible.
[ZIP-2005](https://zips.z.cash/zip-2005) explicitly distinguishes the recovery preparation from the future recovery protocol and leaves the note-encryption privacy risk unchanged.

#### Litecoin MWEB: Hiding and Binding Are Different

Litecoin MWEB combines confidential commitments with elliptic-curve signatures and Diffie-Hellman-based delivery of payment secrets.
Its public output keys expose spending authorization to quantum attacks, while the encrypted payment data creates a potential historical privacy risk.
[LIP-4](https://github.com/litecoin-project/lips/blob/master/lip-0004.mediawiki) specifies the output keys, signatures, and encrypted values involved.

The **Pedersen commitments** hiding the amounts illustrate why we need separate security questions:

- **Hiding** means the commitment does not reveal its amount. With properly random blinding, this property can hold even against an attacker with unlimited computation.
- **Binding** means the creator cannot open the same commitment to a different amount. This property relies on discrete-logarithm assumptions that quantum attacks would undermine.

Breaking binding threatens the validity of balance checks and thus supply integrity, even if the commitment alone still hides its amount.
Separately, attacking the Diffie-Hellman mechanism can expose payment information despite that hiding property.

[LIP-3](https://github.com/litecoin-project/lips/blob/master/lip-0003.mediawiki) documents a **switch-commitment contingency** intended to protect supply integrity at the cost of privacy.
Its signatures and key exchange also need post-quantum replacements.

#### Zano: Privacy Based on Discrete-Logarithm Assumptions

[Zano's privacy documentation](https://docs.zano.org/docs/learn/how-zano-works/privacy-technology/) describes ring signatures, stealth addresses, Pedersen commitments, and Bulletproofs+ as its principal privacy mechanisms.
Its [confidential-assets paper](https://hyle-team.github.io/docs/zano/CA_paper/Zano_CA_for_RingCT_and_Zarcanum_v1.1.pdf) uses the Ed25519 group and explicitly assumes certain discrete-logarithm relationships cannot be computed efficiently.
The [d/v-CLSAG paper](https://eprint.iacr.org/2025/2335) describes its ring-signature construction as Schnorr-like.

The construction is **quantum vulnerable**: its spending authorization, anonymity mechanisms, and integrity checks rely on these discrete-logarithm assumptions.
A hybrid Proof-of-Work / Proof-of-Stake design does not itself replace these cryptographic assumptions.

#### What This Means for the Recovery Phrase and Hardware Wallet

A longer recovery phrase protects against searching for the root secret, but it does not turn ECDSA or Schnorr into a post-quantum signature algorithm.
An attacker who recovers one derived private key from its public key has bypassed the recovery phrase entirely.
That need not reveal the phrase or every other derived key, but it can be enough to steal the funds controlled by the attacked key.

A hardware wallet protects secret material and controls signing inside the device.
It cannot prevent someone from attacking the mathematics of a public key already exposed outside it.

A post-quantum transition therefore requires the blockchain to validate suitably secure spending authorization and users to migrate affected funds under the new rules.
Privacy blockchains also need appropriate encryption, proof systems, and commitments.
Even after a successful upgrade, previously recorded ciphertext remains available for attacks against the old encryption scheme.

#### The Way Forward: Post-Quantum Algorithms and Migration

The familiar model of spending authorization can survive a post-quantum transition: a wallet signs a transaction with a private key, and nodes verify it using public information.
The replacement cryptography, however, changes the data and operations that the blockchain must support.

In my earlier [discussion of quantum-resistant encryption and signatures](../identity-signers-and-remoting/#the-math), I introduced the **CRYSTALS** family and my `ckenc` experiment.
Two related standards address different needs:

- **CRYSTALS-Dilithium** is the basis of **ML-DSA**, standardized in [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final). Its digital signatures are relevant to authorizing transactions.
- **CRYSTALS-Kyber** is the basis of **ML-KEM**, standardized in [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final). It establishes a shared secret for encryption, making it a possible building block for protecting payment information or network communications. It does not itself replace a transaction signature.

Other choices exist, including **SLH-DSA**, the hash-based signature scheme standardized in [FIPS 205](https://csrc.nist.gov/pubs/fips/205/final).
A blockchain must select constructions and parameters that meet its security requirements and practical constraints.

The increase in signature and public-key size:

| Signature scheme | Public key | Signature |
| --- | --- | --- |
| Bitcoin BIP-340 Schnorr | 32 bytes | 64 bytes |
| ML-DSA-44 | 1,312 bytes | 2,420 bytes |
| ML-DSA-65 | 1,952 bytes | 3,309 bytes |
| ML-DSA-87 | 2,592 bytes | 4,627 bytes |

These are raw cryptographic sizes from [BIP-340](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki) and [FIPS 204, Table 2](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf).
The ML-DSA rows represent different security levels.
For scale, an ML-DSA-44 signature is about **38 times** the size of a BIP-340 signature.
Transaction and block growth depend on the transaction format, how public keys are supplied, and the other data involved.
An address could still encode a hash of a larger public key, although the spending protocol may require providing that full key later.

For blockchain infrastructure, the consequences extend beyond storing a different key type:

- **Bandwidth and historical storage:** more bytes per payment increase the data that nodes must relay, synchronize, and, for archival nodes, retain. The total growth rate still depends on block limits and transaction volume. Pruning limits retained history, but does not eliminate network and processing costs.
- **Block capacity and fees:** with an unchanged block-size or weight budget, larger spends leave room for fewer transactions. Changing those budgets has its own effect on node requirements; fee and validation-cost rules must account for the new resource usage.
- **Consensus and transaction formats:** nodes need agreed rules for the new public keys, signatures, encodings, and spending conditions. Output types or script operations may need extending, with limits that prevent malicious transactions from consuming excessive validation resources.
- **Wallets and hardware devices:** signing software, firmware, transaction exchange formats, and recovery tools must understand the new keys and rules. Larger working data can matter for a hardware wallet's memory and communication interface as well as for a full node's storage.

**Computation needs a separate assessment from byte size.**
Key generation, signing, and verification have different costs, and implementations and hardware matter.
A node verifying many signatures and a hardware wallet occasionally creating one face different workloads.
[RFC 9958's discussion of signature algorithms](https://www.rfc-editor.org/rfc/rfc9958.html#section-10.2) describes these performance trade-offs.
Benchmarking the chosen design on full nodes and hardware wallets establishes its CPU and memory requirements.

Compact seeds can regenerate larger expanded keys.
FIPS 204 permits regenerating an ML-DSA private key from a **32-byte seed**, even though the expanded private key occupies thousands of bytes.
A wallet still needs an agreed derivation and recovery recipe with suitable entropy.
Our BIP-32 public-only derivation and Taproot tweaking use elliptic-curve operations explicitly.
Providing those capabilities with ML-DSA keys requires new designs.

One possible transition uses **hybrid authorization**, requiring both a classical signature and a post-quantum signature.
With a properly constructed combination, an attacker must defeat both to forge authorization, while the larger signatures and extra verification work remain part of the cost.
A spending rule that instead accepts *either* signature still permits an attacker to use the classical route after breaking it.
[RFC 9958's discussion of hybrid authentication](https://www.rfc-editor.org/rfc/rfc9958.html#section-13.2) explains the motivation and construction issues.

**Existing funds must also acquire the new protection.**
Installing a new wallet version does not by itself change the conditions on an old UTXO.
Users may need to move funds into new output types, while the network agrees how to handle remaining vulnerable outputs and funds whose owners have lost their keys.
Bitcoin's [draft BIP-361 on post-quantum migration and legacy-signature retirement](https://bips.dev/361/) illustrates that this is a protocol and coordination problem as well as an algorithm choice.

For privacy blockchains, replacing signatures is only one part of the work.
Note encryption, stealth-address mechanisms, commitments, and zero-knowledge proofs each need appropriate post-quantum constructions.
ML-KEM can contribute to encryption, but does not by itself supply a replacement for the proofs and commitments that enforce confidential balances.
The new design must preserve ownership, privacy, and supply integrity together, while previously published ciphertext remains subject to the limitations of its original encryption.
