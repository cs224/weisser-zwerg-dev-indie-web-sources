---
layout: "layouts/post-with-toc.njk"
title: "The Case for Remembering Strong Passwords"
description: "Memorable passwords, a hierarchy of secrets, and encrypted backups for zero-based recovery"
seodescription: "Construct memorable passwords and PINs, protect important accounts with hardware keys, and recover your digital life from encrypted KeePassXC backups on Arweave."
creationdate: 2026-11-24
keywords: strong passwords, memorable passphrases, PINs, password derivation, Argon2id, hierarchy of secrets, digital identity, digital sovereignty, zero-based recovery, account recovery, password managers, KeePassXC, TOTP, passkeys, FIDO2, Trezor, YubiKey, file encryption, GnuPG, age, Arweave, ArNS
date: 2026-11-24
tags: ['post']
---

## Rationale

You sit down at your computer, open your browser, and continue where you left off.
Your e-mail is already open, and most websites recognize you.
For another service, you click "Sign in with Google", and your existing Google session takes care of the login.
Your browser or a separate password manager fills in passwords when you need them.
You approve a passkey request on your phone or use a FIDO2 hardware key such as a YubiKey or Trezor.
You have a working environment that makes access to the different parts of your digital life convenient, often without having to remember a password at all.

Over time, that environment becomes increasingly complex.
You add accounts, connect services, register devices, and accumulate files, messages, contacts, and published work.
In [Identity Revisited](../identity-revisited/), I explored how an identity develops through this continuing history and the relationships built around it.
The Barbapapa picture in my article on [digital integrity](../digital-civil-rights-digital-integrity/) illustrates how far our digital selves can spread across devices and services.
Each of those digital limbs becomes part of how we live and act, and each brings its own arrangements for retaining access.
Keeping track of all of them, let alone backing them up, becomes a substantial task.

Now imagine losing the devices through which you normally reach all of this.
Your laptop and phone are stolen, perhaps together with the hardware key you kept in the same bag.
You borrow a computer and try to sign in to your e-mail.
The service asks you to confirm the login on the phone you have just lost.
You remember saving recovery codes in your cloud drive, but opening that drive requires access to the same account.
Your password manager may also be available online, but you need to remember its master password and have a way to satisfy its two-factor authentication.
The familiar environment that made everything so easy has disappeared, and you discover how many of your recovery arrangements depend on something you can no longer reach.

At that point, you may be relying on Google, Apple, or Microsoft to help you recover access.
How do you reach a person who can help, particularly when you use a free service?
What happens if the recovery process keeps asking for information or confirmations you cannot provide?
Device loss is only one way to arrive here.
A provider can also suspend your account because it believes you have violated its terms of service, leaving you dependent on its review and appeal procedures.
Years of your digital life can become inaccessible while you try to establish that you should be allowed back in.

For me, being able to recover access independently is part of **digital sovereignty**.
I want to retain the information and the means needed to regain control of my digital life, including when my usual devices are gone or a provider refuses to cooperate.
That requires a backup of the credentials and recovery information through which I control those scattered digital limbs.
Depending on the services involved, this includes passwords, wallet recovery seeds, exportable passkeys, SSH and GPG keys, two-factor authentication secrets, and recovery codes.

A password manager can help collect this information.
You might, for example, back up your KeePassXC database every day.
But you also need to be able to retrieve that backup from a fresh computer.
If the password for the backup service is inside the database, or its login requires approval from your missing phone, you are back in the same situation.
Somewhere, the recovery process needs an accessible starting point.

One possible arrangement is to store an encrypted backup on [Arweave and give it an ArNS name](../publishing-arweave-ario-basics/).
Arweave provides permissionless storage, and ArNS gives the backup a name you can remember.
From another computer, you can use that name to retrieve the file through a public gateway without first logging in to an account.
You then need the secret that decrypts it.
**You have to know that secret yourself.**

Of course, anyone else can retrieve the encrypted file too.
They can keep a copy and try to guess its password offline, so the backup needs strong encryption protected by a sufficiently strong password.
That password also has to be memorable enough for you to recall when you need to recover.
Putting it only in the password manager whose backup it protects brings us back to the same dependency.

For encrypting this backup, **symmetric cryptography such as AES-256 remains suitable against known quantum attacks**.
Shor's algorithm attacks the mathematical problems behind the [public-key systems discussed in Signers and Remoting](../identity-signers-and-remoting/#the-math).
For symmetric encryption, Grover's algorithm offers a theoretical speedup in exhaustive key search, and [NIST expects AES-256 to remain secure for a very long time](https://csrc.nist.gov/projects/post-quantum-cryptography/faqs).
The password and the function used to derive the encryption key still need to provide adequate protection against guessing.
For a detailed explanation of symmetric authenticated encryption, see [4 Authenticated encryption](https://livebook.manning.com/book/real-world-cryptography/chapter-4) in *Real-World Cryptography*.
It covers constructions such as **AES-CBC-HMAC**, where AES-CBC encrypts the data and HMAC authenticates the encrypted message so that unauthorized changes can be detected.

This is the starting point for this blog post.
I often find that people underestimate the possibilities for constructing strong passwords they can actually remember.
In this blog post, I want to show how we can do this and how we can keep many good, distinct secrets in mind.
Once that becomes practical, you may even prefer to remember your passwords yourself.

There are reasons to consider that choice beyond recovery.
In [Signers and Remoting](../identity-signers-and-remoting/#password-managers), I discussed how a password manager protects stored secrets and where that protection reaches its limits when a password is released for use.
A memorized password still passes through the computer when you type it, but you can choose to keep it out of a stored collection of credentials.
Your password manager can continue to hold the other secrets needed for your digital life, such as wallet recovery seeds, exportable passkeys, SSH and GPG keys, and two-factor authentication secrets.

## Building Passwords from a Memorable System

I like to construct passwords from things I can name and remember, together with a few consistent rules.
A place, a familiar name, and the service I am signing in to give me something to work with.
I can remember the resulting password directly or reconstruct it from those ingredients.
The examples below use public, deliberately simple values so that we can follow every step.

### Combining Places, Names, and Service Domains

UK postcodes are useful starting material because they already combine letters and numbers.
For example, the [London.de page about Big Ben](https://www.london.de/sehenswuerdigkeiten/big-ben) lists its address as Westminster Bridge Road, London **SW1A 0AA**.
If London or Big Ben means something to you, that gives the postcode an association you can remember.
Replace the space with a pound sign, and the first piece of the password becomes `SW1A£0AA`.

For another piece, choose something else you can name.
It could be another place, such as Geneva, the name of your first pet, such as Waldo, or the brand of your first car, such as Toyota.
With Toyota, you could replace every `o` with `0` to get `T0y0ta`.
Then make the first letter lowercase and the last letter uppercase, giving `t0y0tA`.
That will be our suffix.

The variable middle piece comes from the main domain name of the service.
For `google.com`, take `google`.
Apply a **shift left by one** to get `oogleg`.

> The characters wrap around, so a shift left by two would give `oglego`, while a shift right by one would give `egoogl`.
> The direction and number of positions can both be part of your chosen rule.

For this example, make the second letter of `oogleg` uppercase to get `oOgleg`.
Join the prefix, middle, and suffix with dollar signs.

```text
SW1A£0AA$oOgleg$t0y0tA
```

This is a **22-character password**.
You remember a postcode, a familiar name, and the transformation rules, while the service supplies the variable part.
Once the construction becomes familiar, you can reproduce it consistently.

For a different service, keep the prefix and suffix and change the middle.
With `github.com`, shifting `github` left by one gives `ithubg`, and making its second letter uppercase gives `iThubg`.

```text
SW1A£0AA$iThubg$t0y0tA
```

Each rule is simple enough to remember, yet combining several rules with several chosen ingredients gives us many possible constructions.

> I gave several examples of simple transformations that are easy for a person to remember and apply.
> These examples illustrate that, in principle, there can be as many transformation rules as there are people on the planet.
> An attacker has to consider candidate postcodes and names, their order, separators, shift directions and amounts, and capitalization rules.

> Password-guessing tools such as [hashcat](https://hashcat.net/wiki/doku.php?id=rule_based_attack) can already combine shifts, reversals, case changes, and substitutions.
> Their practical success depends on which combinations they try and how much time and computing power the attacker has available.

The direct construction does leave its pieces visible to a service that receives the password.
Someone who learns one password may recognize the fixed prefix and suffix and work out how to construct passwords for other services.
The [hashing method below](#reproducing-passwords-with-hashes) lets us present the service with a digest that conceals those pieces and their arrangement.

### Reproducing Passwords with Hashes

A hash function gives us another way to construct a password from a remembered input.
Given exactly the same input bytes, the same function always produces the same result.
We can therefore retain the input and the recipe and use local tools to reproduce the result whenever we need it.

For example, start with `1234` and use the following pipeline.

```bash
echo -n 1234 |
  perl -pe '$_ x= 2' |
  sha256sum |
  perl -ape '$_ = $F[0] x 2' |
  sha512sum |
  perl -ape '$_ = $F[0]'
```

The output is shown below.

```text
3e8e310c8765d3aa244ef0c792e659b7da4e43fafbcf2deaf229434669334683ea491d297b93bbd95978379cc58c48c81165215dcc0dab2ed95e055acaec0ea5
```

The first Perl command repeats `1234` to produce `12341234`.
We hash that string with SHA-256, repeat the hexadecimal digest, then hash that repeated string with SHA-512.
The final command keeps the SHA-512 digest, which has 128 hexadecimal characters.
The [GNU SHA-2 utilities](https://www.gnu.org/software/coreutils/manual/html_node/sha2-utilities.html) provide the two hashing commands.

> The command looks a bit involved, but the extra processing is necessary because `sha512sum` prints the digest followed by a `-` filename marker and a newline.
>
> * Perl's `-a` option splits that line into fields, and `$F[0]` selects just the digest.
> * The `-p` option reads each line into `$_`, runs the code supplied with `-e`, and prints `$_` afterward.
> * Assigning the desired result back to `$_` replaces the checksum line, including its marker and line ending, with the string that the next stage should receive.
>
> The [Perl command-line documentation](https://perldoc.perl.org/perlrun) explains these options.

We can change the recipe by appending the reverse of a string instead of repeating it, and by keeping only part of the final digest.

> **How Perl's `substr` works**
>
> `substr(string, offset, length)` uses offsets starting at zero.
> A positive third argument specifies how many characters to select.
> A negative third argument leaves that many characters off the end of the entire string.
> Omitting the third argument selects everything from the offset through the end.
>
> ```perl
> substr("1234567890", 4, 6)   # "567890"
> substr("1234567890", 2, -2)  # "345678"
> substr("1234567890", 2)      # "34567890"
> substr("1234567890", -3)     # "890"
> ```
>
> The last example uses a negative offset to count the starting position back from the end.
> For comparison with Python, the first example corresponds to `s[4:10]`, and the second to `s[2:-2]`.
> For a 128-character string, `substr($s, 10, -16)` keeps the characters from offset 10 up to offset 112, excluding offset 112.
> Its result therefore has `128 - 10 - 16 = 102` characters.
> The [Perl documentation for substr](https://perldoc.perl.org/functions/substr) describes these rules.

```bash
echo -n 1234 |
  perl -pe '$_ .= reverse' |
  sha256sum |
  perl -ape '$_ = $F[0] . reverse $F[0]' |
  sha512sum |
  perl -ape '$_ = substr($F[0],0,10)'
```

This produces the following result.

```text
c45719e998
```

Here, `1234` first becomes `12344321`.
After SHA-256, we append the reversed hexadecimal digest, hash the combined string with SHA-512, and keep its first ten characters.
The `.` operator concatenates strings, and `.=` appends to the existing value.
In this string context, `reverse` reverses the characters, while `substr($F[0],0,10)` selects ten characters starting at offset zero.

The ten-character result illustrates how to shorten an output.
Each hexadecimal character has sixteen possible values, so ten of them provide at most **40 bits** of variation.

> This illustrates another possible transformation. You can also select a substring of any length from the middle of the SHA-512 digest.

#### Hashing Algorithms

I started with the SHA family because it is familiar to many people.
[SHA-256 and SHA-512](https://csrc.nist.gov/pubs/fips/180-4/upd1/final) are deliberately fast, so these few stages add little cost to each guess.

Other password-hashing and key-derivation functions include the following.

* [Argon2id](https://github.com/P-H-C/phc-winner-argon2)
* [scrypt](https://www.tarsnap.com/scrypt.html)
* [yescrypt](https://www.openwall.com/yescrypt/)
* [bcrypt](https://github.com/pyca/bcrypt)
* [PBKDF2](https://www.rfc-editor.org/rfc/rfc8018.html#section-5.2)
* [AES-KDF](https://keepass.info/help/base/security.html#seckeyhash)

They differ in computational cost and memory requirements.
Increasing these costs makes a brute-force attack more expensive.

> This matters for computer systems whose hashing function can be identified, for example by inspecting their source code.
> It is less relevant when a person applies their own rule and the attacker does not know which hashing algorithm or transformations are being used.
> You could, for example, choose [`b3sum`](https://github.com/BLAKE3-team/BLAKE3), which is deliberately fast even for large files.

[OWASP's password-storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) explains the role of deliberately expensive password-hashing functions such as Argon2id.

For the following examples, we will use Argon2id.

```bash
echo -n "1234" | argon2 'abcdefghijklmnop' -id -t 3 -m 16 -p 1 -e
# The -e option prints the encoded hash, including its parameters, salt, and digest in Base64.
# $argon2id$v=19$m=65536,t=3,p=1$YWJjZGVmZ2hpamtsbW5vcA$525flAOJQyyTTL9G2vuOVAeXFH9x8OX2FH2Ek5sHdkQ

# With Perl, we can extract the last field, which contains the hash encoded in Base64.
echo -n "1234" | argon2 'abcdefghijklmnop' -id -t 3 -m 16 -p 1 -e | perl -F'\$' -ape '$_ = $F[5]'
# 525flAOJQyyTTL9G2vuOVAeXFH9x8OX2FH2Ek5sHdkQ

# Decode the salt from Base64 to recover its original form.
# Argon2 uses unpadded Base64. Add == to this value before using base64 -d.
printf '%s' 'YWJjZGVmZ2hpamtsbW5vcA==' | base64 -d
# abcdefghijklmnop

echo -n "1234" | argon2 'abcdefghijklmnop' -id -t 3 -m 16 -p 1 -r
# The -r option prints the hash in hexadecimal notation.
# e76e5f940389432c934cbf46dafb8e540797147f71f0e5f6147d84939b077644
```

The parameters specify the salt, algorithm, resource requirements, and output format.

- `salt` is the first positional argument.
- `-id` selects Argon2id.
- `-t 3` runs three iterations.
- `-m 16` uses 2¹⁶ KiB, or 64 MiB, of RAM.
- `-p 1` sets the degree of parallelism to one.
- `-l` sets the hash length in bytes. The default, `-l 32`, produces 32 bytes (256 bits). Using `-l 64` produces 64 bytes (512 bits).
- `-e` prints the encoded hash, including the parameters and salt.
- `-r` prints the hash in hexadecimal notation.

For the remaining examples, we will increase the memory setting to `-m 20`, which uses **1 GiB** of RAM (2²⁰ KiB).

```bash
echo -n "1234" | argon2 'abcdefghijklmnop' -id -t 3 -m 20 -p 1 -e | perl -F'\$' -ape '$_ = $F[5]'
# b/ziBw0YV4e9znA3osZR4Q81JiKSlLSa3079zzeeEVo
```

> The `argon2` CLI accepts at most 127 input bytes.
> Repeating a SHA-256 digest with `sha256sum | perl -ape '$_ = $F[0] x 2'` produces 128 input bytes.
> The salt must contain at least 8 bytes.

### Combining the Systems

We can combine the two systems by using the service-specific password from the first example as the input to a hash pipeline.

```bash
echo -n 'SW1A£0AA$oOgleg$t0y0tA' |
  perl -pe '$_ x= 2' |
  sha256sum |
  perl -ape '$_ = substr($F[0] x 2, 10, -16)' |
  argon2 'SW1A£0AA$salt$t0y0tA' -id -t 3 -m 20 -p 1 -e |
  perl -F'\$' -ape '$_ = $F[5]'
# P601QAdHSYnvL4msDKuIBfXAnbOPVzJR+vbeNJgSMjc
```

The substring step removes the first ten and last sixteen characters from the 128-character repeated digest.
That leaves 102 characters for Argon2.

The single quotes keep the dollar signs literal, and `echo -n` supplies the string without adding a newline.
Use the same encoding, such as UTF-8, for the pound sign whenever you reproduce this input.
Changing the service component then changes the resulting digest.
To recover it later, we need to remember both our chosen ingredients and the exact sequence of transformations.

When we use that digest as the service password, disclosure of one service's password reveals the hash output.
The prefix, suffix, and service-specific transformations are no longer visible, and the hash provides no direct way to read them back.

### Deriving Decimal PINs

Some systems require a PIN containing only digits.
We can use the same remembered ingredients and Argon2 recipe, interpret the resulting hash as a large integer, and select a sequence of digits from its decimal representation.
Perl's `Math::BigInt` handles the full value of the hash.

The simplest route starts with Argon2's `-r` option, which prints the hash in hexadecimal notation.

```bash
printf '%s' '1234' |
  argon2 'abcdefghijklmnop' -id -t 3 -m 16 -p 1 -r |
  perl -MMath::BigInt -ape '$_ = Math::BigInt->from_hex("0x$F[0]")->bstr' |
  perl -pe '$_ = substr($_, 0, 6)'
# 104679
```

The `-MMath::BigInt` option loads the module, and `$F[0]` selects the hexadecimal digest.
The `from_hex` method creates an object representing that number.
Calling `->bstr` on the object returns its decimal representation as a string.
The last command selects the first six decimal digits.
The [Math::BigInt documentation](https://perldoc.perl.org/Math::BigInt) describes these conversion methods.

We can also start with the Base64 digest in Argon2's encoded output from `-e`.
For this route, decode the Base64 into the original hash bytes, then interpret those bytes as a number.

```bash
printf '%s' '1234' |
  argon2 'abcdefghijklmnop' -id -t 3 -m 16 -p 1 -e |
  perl -MMath::BigInt -MMIME::Base64 -F'\$' -ape '$_ = Math::BigInt->from_bytes(decode_base64($F[5]))->bstr' |
  perl -pe '$_ = substr($_, 0, 6)'
# 104679
```

Here, `-F'\$'` splits the encoded Argon2 output at dollar signs, and `$F[5]` selects its Base64 digest.
The additional `-MMIME::Base64` option loads `decode_base64`, which recovers the original bytes.
The `from_bytes` method interprets them as a non-negative integer in big-endian order, with the most significant byte first.
Then `bstr` produces the decimal string for `substr` to work on.
[MIME::Base64](https://perldoc.perl.org/MIME::Base64) handles Argon2's unpadded Base64 here, so we can pass the digest directly to `decode_base64`.

Both routes produce **104679** for these inputs and parameters, because hexadecimal and Base64 represent the same hash bytes.
We can choose another part of the decimal string or a different length using `substr`.
For example, `substr($_, 4, 6)` selects six digits starting at the fifth position.
Keep the selected digits as a string so that any leading zeros in that segment are preserved.
The chosen position and length become part of the recipe we need to reproduce later.

## File Encryption for Recovery from Memory

We can now use our memorable secret to protect a file that we deliberately make publicly accessible.
For example, we might want to store a copy of a KeePassXC database on Arweave and give it an ArNS name we can remember.
After losing our devices, we could retrieve that file from a fresh computer and recover access using what we know.
I think of this as **zero-based recovery**.

Our starting point is a saved KeePassXC database named `vault.kdbx`.
The database is already encrypted and normally lives on a system under our control.
Its password needs to provide adequate protection for that everyday use.
Putting a copy in a public place changes the exposure, because anyone can download it and keep trying to unlock it.
I want additional encryption for that situation.

### Two Encryption Layers and Two Memorable Passwords

I like to apply two symmetric encryption layers in sequence, using different implementations and different algorithms.
The inner layer uses [GnuPG](https://gnupg.org/) with **Twofish**.
The outer layer uses [age](https://github.com/FiloSottile/age), whose file contents are encrypted with **ChaCha20-Poly1305**, as described in the [age format specification](https://age-encryption.org/v1).
This gives us algorithm diversity as well as two separate implementations.
My intention is to retain protection from the other layer if a weakness affects one of them.
Both layers still depend on the secrecy of our remembered inputs and the machine on which we encrypt or decrypt.

For the variable middle part of the password, use the tool's name directly.
The inner password uses `gpg`, and the outer password uses `age`.
With the public example ingredients from above, the two starting strings are shown below.

```text
SW1A£0AA$gpg$t0y0tA
SW1A£0AA$age$t0y0tA
```

We then apply the same hash and Argon2id recipe to each.
The resulting passwords differ, while the rule remains easy to remember.
We need our prefix and suffix, the published derivation recipe, and the names of the two tools.

### Generate the Password Files Once

I want to avoid retyping a long generated password, copying it through the clipboard, or putting it directly into a command that Bash might save in its history.
Instead, we will generate each password into a temporary file and let the encryption tools read those files.
Use a trusted machine for these steps, since the generated passwords are available to the processes running there.

The following commands use Bash.
We turn off command tracing, create a private temporary directory, and read our remembered ingredients without echoing them to the terminal.
For the public example, enter `SW1A£0AA` as the prefix and `t0y0tA` as the suffix.
For your own backup, enter your own remembered choices at the prompts.

```bash
set -euo pipefail
set +x
umask 077
secret_dir=$(mktemp -d)

IFS= read -r -s -p 'Remembered prefix: ' secret_prefix
printf '\n'
IFS= read -r -s -p 'Remembered suffix: ' secret_suffix
printf '\n'

derive_passphrase() {
  printf '%s$%s$%s' "$secret_prefix" "$1" "$secret_suffix" |
    perl -pe '$_ x= 2' |
    sha256sum |
    perl -ape '$_ = substr($F[0] x 2, 10, -16)' |
    argon2 'SW1A£0AA$salt$t0y0tA' -id -t 3 -m 20 -p 1 -e |
    perl -F'\$' -ape '$_ = $F[5]'
}

derive_passphrase gpg > "$secret_dir/gpg.pass"
derive_passphrase age > "$secret_dir/age.pass"
unset secret_prefix secret_suffix
```

The fixed Argon2 salt is the public value from the earlier example and is part of the recipe.
The private ingredients are supplied through the prompts.
The `umask` setting gives the temporary files permissions that allow only our user to read and write them.
The two password files contain the generated values, ready for the tools to consume.

### Encrypt with GnuPG, Then age

GnuPG's `-c`, also written `--symmetric`, encrypts with a passphrase.
We explicitly select Twofish and supply the password through file descriptor 3.
The `--batch` option lets GnuPG read it without opening a password prompt.
The [GnuPG manual](https://www.gnupg.org/documentation/manuals/gnupg/GPG-Esoteric-Options.html) documents these passphrase options.

```bash
gpg --batch -c --passphrase-fd 3 --cipher-algo TWOFISH --output "$secret_dir/vault.kdbx.gpg" vault.kdbx 3< "$secret_dir/gpg.pass"
```

For the outer layer, use [age-plugin-batchpass](https://github.com/FiloSottile/age/blob/v1.3.2/doc/age-plugin-batchpass.1.ronn).
The commands here use age and the plugin from version 1.3.2.
Both `age` and `age-plugin-batchpass` need to be available on `PATH`.

> **Building matching versions**
>
> I initially tried age 1.1.1 with version 1.3.2 of the plugin, which I had built locally with Go.
> Encryption worked, but decryption with `-j batchpass` failed with the error `file is passphrase-encrypted but identities were specified with -i/--identity or -j`.
> Using age 1.3.2 with the same plugin allowed both encryption and decryption to work.
>
> Both tools can be built and installed from source with a local Go environment.
>
> ```bash
> # GOTOOLCHAIN=go1.26.11 go version     # downloads and build that version
> # go env -w GOTOOLCHAIN=go1.26.11+auto # +auto follows project version requirements and 
>                                        # will allow projects to be able to select a newer toolchain when required,
> # go version
> GOTOOLCHAIN=go1.26.11 go install filippo.io/age/cmd/age@v1.3.2
> GOTOOLCHAIN=go1.26.11 go install filippo.io/age/cmd/age-plugin-batchpass@v1.3.2
> export PATH="$(go env GOPATH)/bin:$PATH"
> hash -r
> age --version
> ```
>
> These commands select Go 1.26.11 explicitly, using a cached copy when available or downloading it if needed.
> With the default `GOBIN` setting, `go install` places the binaries in `$(go env GOPATH)/bin`.
> Prepending that directory to `PATH` and clearing Bash's command cache makes the shell select the newly built age binary.
> The [Go toolchain documentation](https://go.dev/doc/toolchain) explains how version selection works.

```bash
AGE_PASSPHRASE_FD=3 age -e -j batchpass -o vault.kdbx.gpg.age "$secret_dir/vault.kdbx.gpg" 3< "$secret_dir/age.pass"
```

Here, `AGE_PASSPHRASE_FD=3` tells the plugin which descriptor to read.
The shell opens the password file on that descriptor with `3<`.
The environment variable contains only the descriptor number.
The plugin produces a standard age passphrase-encrypted file, with age's scrypt-based passphrase protection and authenticated encryption.
The file to publish is **`vault.kdbx.gpg.age`**.

> **An OpenSSL alternative for the inner layer**
>
> OpenSSL can also encrypt files symmetrically.
> For example, the following command uses AES-256-CBC with PBKDF2 key derivation and reads the inner password from the same file.
>
> ```bash
> openssl enc -aes-256-cbc -salt -pbkdf2 -iter 600000 -md sha256 -pass fd:3 -in vault.kdbx -out "$secret_dir/vault.kdbx.enc" 3< "$secret_dir/gpg.pass"
> ```
>
> If you choose this variant, give `vault.kdbx.enc` to age as its input and remember that OpenSSL is needed to decrypt the inner layer.
> During recovery, have age write that inner file to `$secret_dir/vault.kdbx.enc`.
> After removing the age layer, recover the database with the following command.
>
> ```bash
> openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -md sha256 -pass fd:3 -in "$secret_dir/vault.kdbx.enc" -out "$secret_dir/openssl-recovered.kdbx" 3< "$secret_dir/gpg.pass"
> ```
>
> AES-CBC provides confidentiality, and the outer age layer supplies authenticated encryption in this variation.
> The [OpenSSL enc documentation](https://docs.openssl.org/3.4/man1/openssl-enc/) explains the supported modes and their limitations.
> AES-CBC itself has no authentication tag, so this inner layer has different integrity properties from the GnuPG example.

### Recover in the Opposite Order

On a fresh machine, retrieve the encrypted file using its remembered public name and regenerate the two password files with the same recipe.
The outer password uses `age`, and the inner password uses `gpg`.
Remove the age layer first.

```bash
AGE_PASSPHRASE_FD=3 age -d -j batchpass -o "$secret_dir/recovered.kdbx.gpg" vault.kdbx.gpg.age 3< "$secret_dir/age.pass"
```

Then remove the GnuPG layer.

```bash
gpg --batch --passphrase-fd 3 --output "$secret_dir/recovered.kdbx" --decrypt "$secret_dir/recovered.kdbx.gpg" 3< "$secret_dir/gpg.pass"
```

The recovered file is the original KDBX database, which still needs its own KeePassXC password.
That password must also be something you can recover without the lost devices.

While the original database is still available, compare it with the recovered file.

```bash
cmp vault.kdbx "$secret_dir/recovered.kdbx"
```

A successful comparison produces no output and returns exit status zero.
Also open the recovered database in KeePassXC and check that the credentials you need are present.
Before relying on the public copy, repeat recovery in a fresh shell with passwords regenerated from memory.

**That checks the part that matters most here, whether you can reproduce your own scheme after the familiar working environment has gone.**

The tool names, encryption order, public salt, and derivation parameters can all be part of a publicly available recovery recipe.
The remembered private ingredients supply the secret.
Once the test is complete and you have saved the encrypted recovery file, remove the temporary working directory and its password files.

```bash
rm -r -- "$secret_dir"
unset secret_dir
unset -f derive_passphrase
```

## A Hierarchy of Secrets

The protection I want for a secret depends on what it unlocks and what would happen if someone else obtained it.
For an ordinary discussion forum, impersonation would be unwelcome and could damage my reputation.
An e-mail account used to reset passwords for other services has much broader authority, because losing control of it can give an attacker a route into those other accounts.

I called such credentials **skeleton keys** in my earlier discussion of [identity and credential management](../digital-civil-rights-privacy-ii/#identity-and-credential-management).
That article also discusses browser password managers such as those in Google Chrome and Microsoft Edge, and the special importance of protecting a manager that holds credentials for many services.

I developed this distinction further in my article on [browsers, password managers, and Nextcloud](../digital-civil-rights-nextcloud-i/).
There, I described using a hardware FIDO2 second factor, such as a Trezor, for highly critical accounts, while making different arrangements for other accounts that require two-factor authentication.
My [article on backing up iOS passwords and passkeys](../quick-tip-nugget-backup-ios-passwords-and-passkeys-to-keepassxc/) also distinguishes the passkeys I use for everyday accounts from the hardware protection I choose for my most important accounts.

Here, I want to extend that reasoning to the secrets themselves.
Their importance, where they are stored, how we enter them, and who needs to recover them all influence the protection we choose.
Some passwords can follow a simple, memorable construction, while credentials with wider authority deserve more demanding arrangements.
We also need recovery plans for generated credentials, such as TOTP secrets and cryptographic keys, alongside the passwords we can remember.

### Motivating Examples

#### A PIN Entered Directly on a Trezor

You use a Trezor Model T as a FIDO2 authenticator for your most valuable accounts, such as the e-mail account that can reset access to many others.
You enter its PIN directly on the device's touchscreen.
Neither the PIN nor the private authentication keys pass through the connected computer, so malware there cannot capture them by monitoring your keyboard or reading an application's memory.

The device also slows down guessing with [progressively longer delays](https://forum.trezor.io/t/update-2-6-0-pin-slow/13477) after failed PIN attempts and [wipes itself after 16 consecutive incorrect attempts](https://trezor.io/guides/trezor-devices/trezor-fundamentals/pin-protection-on-trezor-devices).
The PIN therefore guards some of your most valuable credentials, while its entry and verification stay within the dedicated device.

#### A YubiKey PIN Entered on a Computer

I use a YubiKey as a hardware GPG key to keep private key material off my everyday computers.
Signing and decryption happen on the token, but I enter its PIN through the computer's keyboard, where malware could capture it.
Capturing the PIN alone does not give an attacker a private key they can take away and use elsewhere.
They would also need access to the YubiKey, whether by physically stealing it or through a compromised computer while it is connected.

My article on [using OpenPGP hardware keys remotely](../openpgp-card-hardware-keys-remotely/#general-information-about-pgp/gpg) describes this setup and links to Charles Hoskinson's video, [Security Foundations: How to Secure Your Wallet Recovery Phrase for Cryptocurrency Wallets](https://youtu.be/fqrAzBAi64c?t=3438).

#### Unlocking an OPAL Disk During Early Boot

You unlock an OPAL-encrypted disk in a minimal boot environment, before your everyday operating system and applications are running.
Fewer components handle the passphrase, reducing its exposure to general desktop malware.
With networking disabled in this environment, there is also no immediate network route for exfiltrating it.

**Encrypting disks from the outset is an essential habit.**
When you sell or dispose of a computer, simply deleting files or formatting an unencrypted disk can leave recoverable data behind.
Securely erasing that data can be difficult, especially if a failed drive can no longer be wiped reliably.
Starting with encryption gives you the option of [cryptographic erasure](https://www.cyber.gc.ca/en/guidance/it-media-sanitization-itsp40006), where securely destroying the necessary encryption keys makes the remaining ciphertext unreadable.

On a dual-boot system, each operating system's data should be encrypted under separate keys and remain locked when the other system is running.
Access should require your explicit decision to supply the key and mount the volume.
Unlocking the whole OPAL disk at startup does not by itself provide this separation, so use separately encrypted volumes for that purpose.

#### An Ordinary Forum Account

You use a simple, service-specific password for a forum where you occasionally ask questions.
Someone impersonating you would be unpleasant, but this particular account provides no direct access to money or other accounts.

#### An E-mail Account as a Skeleton Key

Your e-mail address is the recovery address for several other accounts.
Someone controlling that mailbox could request password resets for those services, which is why you might protect it with a hardware FIDO2 authenticator.

#### An SSH or GPG Key Stored in a File

You keep a private key in an encrypted file on your computer.
Its passphrase unlocks the ability to access a VPS, sign material, or decrypt other files, so the authority behind the key influences how carefully you protect it.

With a suitable YubiKey or Trezor setup, you can keep the private key material on a hardware token instead of your everyday computers.
Sometimes, keeping a software key is simply more convenient.
Precisely because it is easy to copy, you can use the same key on your desktop and laptop without carrying a token between them.
That can be a reasonable choice when both computers are well protected, including full-disk encryption on the laptop and a suitable passphrase on the key file.

#### An Everyday File on a USB Stick

You encrypt an everyday document and keep the USB stick at home.
You choose its password knowing both what the document contains and who normally has physical access to the carrier.

#### A USB Stick for Your Family

You give family members copies of your digital legacy on USB sticks, protected by a secret they already know, such as the household Wi-Fi password.
They should be able to open the files if you die or become unavailable, without needing you to explain the procedure.

#### Credentials You Cannot Keep in Your Head

Your authenticator app holds TOTP secrets, and your devices hold passkeys and other cryptographic keys.
These generated credentials need a recovery path of their own.

My earlier article on [backing up iOS passwords and passkeys](../quick-tip-nugget-backup-ios-passwords-and-passkeys-to-keepassxc/) describes exporting from iOS through Bitwarden.
You can keep the Bitwarden `.json` export or import the credentials supported by your tools into a KeePassXC `.kdbx` database.
Either file can then go through the symmetric-encryption procedure above, giving you a recovery backup protected by your memorable secret.
Test that the exported credentials can actually be restored and used, particularly passkeys, whose portability depends on the applications and formats involved.

For TOTP, you can save setup QR codes or Google Authenticator's transfer QR codes as attachments in KeePassXC.
The same article includes a [Google Authenticator export walkthrough](../quick-tip-nugget-backup-ios-passwords-and-passkeys-to-keepassxc/#export-google-authenticator-2fa-codes) showing how to read these images locally with `zbarimg`.
A normal setup QR code contains an `otpauth://` URI with the secret and its parameters.
Google Authenticator's transfer codes use `otpauth-migration://` and need an additional decoding step to extract the individual TOTP secrets.
You can then store those secrets directly in KeePassXC, where they can also generate your TOTP codes.
The QR images or decoded secrets become part of the same encrypted recovery backup.

> Charles Hoskinson's [Security Foundations: How to Secure Your Wallet Recovery Phrase for Cryptocurrency Wallets](https://youtu.be/fqrAzBAi64c?t=3438) explains how to prepare a trusted environment for handling keys, for example by booting a laptop from a freshly prepared USB stick with a trusted live Linux image.
> This keeps the work separate from your everyday operating system and its installed applications.
> Use that environment to process exported credentials, decode QR images, and encrypt the backup before saving it to permanent storage.

#### A Public Recovery Copy on Arweave

You upload an encrypted copy of your credential collection to Arweave, where anyone can download it and retain a copy.
You need to retrieve and unlock it from a fresh computer using remembered information, while an attacker can keep attempting to decrypt their own copy.

#### A Hardware Wallet You **Cannot** Trust

**A cautionary tale.** You buy a dedicated security device and rely on it to handle your secrets correctly.
The [report about hardware wallets with hidden eSIMs](https://www.heise.de/news/Kryptodiebe-verkaufen-Hardware-Wallets-mit-heimlicher-eSIM-11485183.html) raises the question of whether the actual device deserves that trust, however reassuring its interface may look.

### The Dimensions of the Hierarchy

The examples above differ in what their secrets protect, where those secrets are exposed, and how we could recover them.
We can use the following dimensions to decide which protection makes sense for each case.

| Dimension | What we need to consider |
| --- | --- |
| Consequences of compromise | Impersonation, disclosure, loss of money, or control over other accounts and systems |
| Authority | Whether the secret unlocks one account, a signing key, a server, or an entire credential collection |
| Exposure | A device in your possession, a family USB stick, a copied key file, or a publicly downloadable archive |
| Entry and processing | Whether you enter the secret directly on a dedicated device or through a general-purpose computer |
| Resistance to guessing | Device-enforced retry limits, online login restrictions, or unrestricted offline attempts |
| Recoverability | Whether you can remember, export, regenerate, replace, or independently recover the credential |
| Intended holders | You alone, selected family members, or someone who needs access after your death or incapacity |

### Putting the Hierarchy into Practice

#### Forum Accounts Without a Password Manager

For ordinary forum accounts where you would not use two-factor authentication, you can do without a browser password manager altogether.
You can construct their passwords yourself, using a simple version of [Combining Places, Names, and Service Domains](#combining-places,-names,-and-service-domains).

Choose a memorable prefix and suffix, together with a few transformations you can apply consistently.
Use the service's main domain name as the variable part.
For a forum at `forum.example.org`, that part would be `example`.
Apply your chosen transformations and join the pieces as described earlier.
For another service, change the domain component and follow the same rules.

Keep this everyday construction simple enough to reproduce in your head and type directly, without a hashing pipeline or other tools.
Regular use makes the ingredients and rules familiar.
When you move to another computer or a fresh browser profile, you can reconstruct the password using what you remember and the domain of the service you want to access.

> For accounts that require periodic password changes, I sometimes append a suffix such as `$YYYYMM`, using the year and month of the change.
> I may later forget which date I used, making zero-based recovery from memory alone more difficult, so I prefer to avoid this approach where possible.

#### PINs for SIM Cards, Phones, and Hardware Keys

Device access is another place where you need a secret you can recall before opening any password manager.
For example, you might choose the following lengths.

* **SIM card:** a four-digit PIN protecting use of your mobile subscription.
* **iPhone:** a six-digit numeric passcode protecting access to the phone and its contents. Apple also supports [longer custom numeric passcodes](https://support.apple.com/guide/iphone/set-a-passcode-iph14a867ae/ios).
* **Trezor:** eight or more digits protecting a device that holds keys for your most valuable accounts. [Trezor supports PINs of up to 50 digits](https://trezor.io/guides/trezor-devices/trezor-fundamentals/pin-protection-on-trezor-devices).

**For phone unlocking, I prefer digits to biometrics.**
Someone who physically overpowers you may be able to press your finger onto a sensor or force you to look at a face scanner.
A memorized PIN has to be obtained from you separately, although threats or violence can still coerce its disclosure.

The [decimal PIN method](#deriving-decimal-pins) lets you generate device-specific values and select the number of digits you need.
Generate these in advance and remember the resulting digits for everyday unlocking.
The appropriate length also depends on how the device limits guesses, as we saw with the Trezor's delays and eventual wipe after repeated failures.

#### Important Accounts with Phone-Based Authentication

Consider an e-mail account you use for correspondence but have kept out of the recovery arrangements for your other accounts.
Its messages deserve protection, even though the account does not act as a skeleton key.

Here, combine the methods from the previous two subsections.
Construct a service-specific password using your memorable system, and add TOTP as a second factor through an authenticator app on your phone.
You remember how to construct the account password and the PIN that unlocks your phone.
The app holds the generated TOTP secret and supplies the current code when you sign in.

Where the service supports it, a passkey stored on your phone offers an alternative to the password-and-code login.
You authorize its use on the phone, protected by the phone's unlock mechanism.
Your memorable PIN gives you access to the device that holds the authentication credential.

> Keep a backup of the TOTP QR codes or a supported passkey export in a separate local password manager such as KeePassXC, using the [backup methods described above](#credentials-you-cannot-keep-in-your-head).
> We will return to this local credential collection further down the hierarchy.

#### Skeleton Keys Protected by Dedicated Hardware

For your most important accounts, such as an e-mail account that controls recovery for many other services, use a dedicated hardware authenticator.
The arrangement resembles the phone-based approach above, but a specialized device such as a Trezor Model T holds the FIDO2 credential, and you enter its PIN directly on the device.
Where the service uses a password alongside the hardware second factor, you can still construct that password with your memorable system.

The Trezor has a much narrower job than an iPhone.
The Model T does not run your everyday apps or connect independently to the internet, and it communicates with the computer over USB.
Its smaller set of functions and interfaces gives fewer opportunities for bugs and remote attacks to reach the secrets it protects.
That specialization is why I prefer this kind of device for skeleton keys.

> Dedicated hardware also includes a YubiKey holding GPG keys, as in the [YubiKey example above](#a-yubikey-pin-entered-on-a-computer).
> The private key material stays on the token, although you enter its PIN through the connected computer.
> For recovery, keep a protected backup of the GPG key before importing it onto the YubiKey, following my [OpenPGP hardware-key workflow](../openpgp-card-hardware-keys-remotely/#general-information-about-pgp/gpg).
> A GPG key generated directly on the YubiKey cannot be exported afterward, so that setup needs a replacement-key plan if the token is lost.

A Trezor also offers recovery through its device-generated backup, for example a [12- or 24-word BIP39 recovery phrase](https://trezor.io/learn/security-privacy/personal-security-standards/understanding-trezor-wallet-backups-12-20-or-24-words).
If you lose the device, you can restore that backup on a compatible replacement and reconstruct the seed-derived keys, provided you also retain the required settings and credential information.
I discussed hardware-backed SSH and its backup advantages in [Step Up Your SSH Game](../openssh-fido2-hardwarekey/), and deterministic GPG recovery in the section on Roman Zayde's `trezor-agent` in my [article on using OpenPGP hardware keys remotely](../openpgp-card-hardware-keys-remotely/).

> Keep the recovery recipe alongside the backup.
> For SSH and GPG, retain the identity strings and derivation settings, including the GPG creation timestamp and any additional passphrase you used.
> For resident FIDO2 credentials, [save their credential IDs and restore them after restoring the seed](https://trezor.io/guides/bonus-tools/using-your-trezor-as-a-security-key-fido-2-and-u2f).
> The recovery phrase and the supporting information belong in the protected recovery collection we will return to below.

#### Files, Key Collections, and Disks

For file encryption, I would use a second, more advanced version of [Combining Places, Names, and Service Domains](#combining-places,-names,-and-service-domains), with its own private ingredients and transformation rules.
The variable part now describes what you are unlocking.

**Individual files.** Unlocking an ordinary document gives access to that file's contents, so it can sit near the lower end of this hierarchy, depending on what it contains.
You could use `file` as the variable part of your construction.

**Files that unlock other things.** A software SSH key, a software GPG key, or a KeePassXC `.kdbx` database has wider authority because it gives access to servers, encrypted information, or a whole collection of credentials.
Use variable parts such as `ssh`, `gpg`, or `kdbx`, with your chosen transformations, such as `sshhss` for `ssh` followed by its reverse.
This local KeePassXC database is where you can collect the TOTP secrets, exportable passkeys, hardware-key backups, and recovery information discussed above.

> **Use the trusted environment described earlier to collect and process these secrets.**
> For example, boot a laptop from a freshly prepared USB stick with a trusted live Linux image, as explained in [Charles Hoskinson's video](https://youtu.be/fqrAzBAi64c?t=3438).

**Whole disks.** The same approach applies to your operating system's boot disk and external disks you connect from time to time.
You might choose `boot` or `ext` as the variable part, or another label you can easily associate with the disk.
The password protects everything stored there, and a boot-disk password must be reproducible before you can access your normal working environment.
Keep that construction something you can enter without first running tools on the locked system.

**Digital legacy.** Some files are deliberately meant to be accessible to others if you die or become unavailable.
You might give family members an encrypted USB stick or external disk protected by a password they already know.
Choose the shared password with those intended recipients in mind, and make sure they know where the copy is and how to open it without your help.

#### Zero-Based Recovery from a Public Backup

Now bring together the material needed to recover your digital life when your usual devices are gone.
I prefer to keep this collection in a normal KeePassXC `.kdbx` database, protected by a good local password I can remember.
Its contents include the following.

* TOTP QR codes or their decoded secrets, together with service recovery codes.
* Passkey exports in formats from which you have tested recovery.
* The Trezor's 12- or 24-word recovery phrase, together with the required derivation settings, additional passphrases, and FIDO2 credential IDs.
  * Other wallet's 12- or 24-word recovery phrases
* Software copies of private PGP keys intended for restoring a YubiKey, retained before importing those keys onto the token.
* Cloud-storage credentials, connection settings, and the repository password for your home server's [offsite Kopia backups](../home-server-infrastructure/#kopia-backup).
  Include the `rclone` configuration and any client secrets or certificates with their private keys needed to access a [dedicated SharePoint backup site](../home-server-infrastructure/#dedicated-sharepoint-team-site-as-offsite-backup-storage), so you can restore the server even when the original machine is unavailable.

Prepare and update this collection in the [trusted environment discussed earlier](#credentials-you-cannot-keep-in-your-head).
The database holds the means to recover access to many other parts of your life, so its protection deserves particular care.

For the publicly accessible copy, follow the [file-encryption procedure above](#file-encryption-for-recovery-from-memory).
Encrypt the KDBX file first with GnuPG and then with age, using `gpg` and `age` as the variable parts of the respective password constructions.
Upload the resulting doubly encrypted file to a public place such as [Arweave, with an ArNS name you can remember](../publishing-arweave-ario-basics/).
You can then retrieve it from a fresh computer without first signing in to another account.

> Older public backups [remain accessible](https://ardrive.io/tos-and-privacy/) after updates or password changes.
> **They must never become decryptable to an attacker.**
> This is why I use three successive symmetric encryption layers: KeePassXC, GnuPG, and age.
> A leaked second factor may still require the separately memorized account password, but exposing SSH or GPG keys, passwordless FIDO2 credentials, or wallet recovery seeds can already compromise systems, funds, or past encrypted data.

During recovery, reconstruct the two encryption passwords, remove the age and GnuPG layers, and open the recovered database with its own remembered password.
That database password must also be available from memory, independently of your lost devices.
Keep the tool names, derivation parameters, and recovery instructions retrievable alongside the encrypted file, so you can follow the procedure without having to recall every command.
Test the complete path, including using the restored credentials, while your original devices are still available.

## Conclusion

It took me quite a long time to arrive at a backup scheme for zero-based recovery that I was happy with.
I wanted to share it with others looking for a similar way to regain access to their digital lives.

There are certainly other ways to do this.
I would be very interested to hear your comments and feedback, and to learn how you approach the same problem.

## Appendix

### Related Work

The following articles explore related approaches to remembering secrets, choosing different levels of protection, and recovering after device loss.

* **[Paradux: a scheme to recover from maximum personal data disaster](https://upon2020.com/blog/2019/01/paradux-a-scheme-to-recover-from-maximum-personal-data-disaster/)**, by Johannes Ernst.
  Describes an encrypted collection of backup locations and credentials that can be distributed on public websites or IPFS and opened using a remembered password.
  It also provides recovery through trusted people if the password is forgotten.

* **[Triple Sec - Simple Digital Security Scheme](https://nau.github.io/triplesec/)**, by Alexander Nemish.
  Combines a remembered passphrase and PIN, Bitwarden, a separate vault for important material, and a reproducibly derived recovery password.
  Its encrypted recovery file is shared with trusted people and also supports digital legacy arrangements.

* **[The passwords I actually memorise](https://alexwlchan.net/2026/memorised-passwords/)**, by Alex Chan.
  Identifies essential passwords to memorize and walks through recovery after losing every device, using remote backups and encrypted MFA recovery codes.
  It also describes regular checks that those passwords can still be recalled.

* **[Building Your Digital Data Autonomy](https://medium.com/the-art-of-thinking/the-safest-way-to-protect-your-personal-data-7a7999c2232c)**, by The Thinker.
  Connects digital sovereignty with remembered master passwords and a dedicated recovery account.
  Its arrangement using Proton and Bitwarden separates recovery infrastructure from everyday accounts while remaining dependent on those providers.

* **[How I Manage My Passwords (Technical Version)](https://medium.com/hackernoon/how-i-manage-my-passwords-technical-version-8549dc1bde1e)**, by Emanuele Cesena.
  Reconstructs service passwords from a passphrase, username, service name, and counter, with separate passphrases for different account categories.
  Includes Bash, Python, and JavaScript examples.

* **[An algorithm for freedom](https://spectre.app/blog/2018-01-06-algorithm/)**, by Maarten Billemont.
  Explains the algorithm behind Spectre's stateless password generation, deriving credentials from a remembered secret, user name, site name, and counter.
  Covers passwords, PINs, and recovery answers.

* **[Before You Use a Password Manager](https://stuartschechter.org/posts/before-you-use-a-password-manager/)**, by Stuart Schechter.
  Examines the benefits and risks of storing many credentials together, planning recovery, and deciding which passwords merit separate treatment.
  Particularly relevant to the authority of a password manager or primary e-mail account.

* **[On Passwords](https://letters.empiresec.co/p/pass)**, by Sovereign Shadow.
  Discusses memorizing several classes of passwords and PINs, practicing recall, and using password managers, hardware authenticators, and encryption for different purposes.

* **[I've locked myself out of my digital life](https://shkspr.mobi/blog/2022/06/ive-locked-myself-out-of-my-digital-life/)**, by Terence Eden.
  Uses a hypothetical house fire to expose circular recovery dependencies between devices, cloud accounts, second factors, and password managers.
  A detailed illustration of why an independent recovery starting point matters.

* **[LessPass How Does It Work?](https://blog.lesspass.com/2016-10-19/how-does-it-work)**, by Guillaume Vincent.
  Explains generating passwords from a master password, site, login, and configurable options, including a counter for changes.
  Passwords can be reproduced without synchronizing a database, although per-site settings still need to be retained.

* **[False Perceptions of IT Security: Passwords](https://www.kaspersky.com/blog/false-perception-of-it-security-passwords/7036/)**, by David Jacoby.
  Describes mentally reproducible passwords built from a memorable phrase and service-specific associations.
  It also recommends treating e-mail differently because of its ability to reset other accounts.

* **[Creating Strong Passwords](https://ssd.eff.org/module/creating-strong-passwords)**, by the Electronic Frontier Foundation.
  Lists device, encryption, password-manager, and e-mail passwords as secrets worth memorizing.
  Its recommendation to use randomly selected words offers a different approach to memorable passphrases.
