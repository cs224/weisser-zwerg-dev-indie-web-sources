---
layout: "layouts/post-with-toc.njk"
title: "RFC3161 Trusted Timestamping via OpenSSL by foot: a guided tour."
description: "A blog post to explain how to use the standard functionality of OpenSSL to create trusted timestamps for free."
creationdate: 2022-03-12
keywords: openssl, RFC3161, RFC 3161, tutorial, tour, free
date: 2022-03-12
tags: ['post']
---

## Rationale

Sometimes it is useful to be able to prove that a certain file, or more generally a state of the world (like a full git repository or similar), was
present in that exact form latest at a given timestamp. For that purpose [rfc3161](https://datatracker.ietf.org/doc/html/rfc3161) "Internet X.509
Public Key Infrastructure Time-Stamp Protocol (TSP)" exists.

In this blog post I'll explain how to use the standard functionality of [OpenSSL](https://en.wikipedia.org/wiki/OpenSSL) to achieve that.

## Free Implementations

In order to create a trusted timestamp we will need an ideally free trusted timestamping service. The following git gist provides a [List of free
rfc3161 servers](https://gist.github.com/Manouchehri/fd754e402d98430243455713efada710).

## Trusted Timestamp with the Apple RFC3161 Server

The relevant links for the Apple RFC3161 Server are the following:


* https://www.apple.com/certificateauthority/
* http://timestamp.apple.com/ts01

### Create the timestamp response


First we will have to create a file that we want to timestamp and create a [hash](https://en.wikipedia.org/wiki/Cryptographic_hash_function) (aka
digest):


    > echo "testmessage" > state.txt
    > openssl dgst -sha3-256 state.txt
    >  SHA3-256(state.txt)= e22171694fd8e4240550f995c558bcc967b3df0e928b51a746b2cba26f6d9ea4


Above I used the [SHA3](https://en.wikipedia.org/wiki/Cryptographic_hash_function#SHA-3) 256 bit hash function with the following result:
`e22171694fd8e4240550f995c558bcc967b3df0e928b51a746b2cba26f6d9ea4`.<br> 256 bits means 32 bytes means 64 [nibbles](https://en.wikipedia.org/wiki/Nibble)
means 64 characters in the [hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal) notation (go ahead and count).

Once we have the hash we can create a timestamp query:


    > openssl ts -query -digest 'e22171694fd8e4240550f995c558bcc967b3df0e928b51a746b2cba26f6d9ea4' -sha256 -cert -out ts_req.tsq


We are specifying the parameter `-sha256` rather than `-sha3-256`, because RFC3161 does not know about `-sha3-256`. Anyway, this parameter here is
only used to specify the size of the digest and that is 256 bits.

Next we can use [curl](https://curl.se/) to talk to the Apple RFC3161 Server and ask for the actual timestamp response:


    > curl http://timestamp.apple.com/ts01 -H 'Content-Type: application/timestamp-query' -s -S --data-binary "@ts_req.tsq" -o "ts_req.tsr"


We then can look at the resulting timestamp response file `ts_req.tsr`:


    > openssl ts -reply -in ts_req.tsr -text


In the output you can see the `Status: Granted.` and the `Message data` that corresponds to our `sha3-256` hash and of course the timestamp `Time
stamp: Mar 12 09:52:44 2022 GMT`.


```
Status info:
Status: Granted.
Status description: Operation Okay
Failure info: unspecified

TST info:
Version: 1
Policy OID: 1.2.3
Hash Algorithm: sha256
Message data:
    0000 - e2 21 71 69 4f d8 e4 24-05 50 f9 95 c5 58 bc c9   .!qiO..$.P...X..
    0010 - 67 b3 df 0e 92 8b 51 a7-46 b2 cb a2 6f 6d 9e a4   g.....Q.F...om..
Serial number: 0x706F261A1B4E8986
Time stamp: Mar 12 09:52:44 2022 GMT
Accuracy: 0x01 seconds, unspecified millis, unspecified micros
Ordering: no
Nonce: 0xFD8CB0CAAEA28D69
TSA: unspecified
Extensions:
```


Woderful. This is the piece of data that you have to store somewhere safe so that later you're able to proof that the original file (`state.txt` in
our case) existed at or before the given timestamp.

### Verify the timestamp response together with the referenced piece of data

How do we then verify the timestamp response?

You again create the digest of the file, which we already know: `e22171694fd8e4240550f995c558bcc967b3df0e928b51a746b2cba26f6d9ea4`.<br>
In addition we'll need the complete certificate chain for the Apple timestamp service. The locations of the certificates are documented on the
relevant web-site at: https://www.apple.com/certificateauthority/<br>
For our case we need the `AppleTimestampCA.cer` and the `AppleIncRootCertificate.cer` in [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail)
format. You can recognize this `PEM` format, because it is a simple text format that starts with `-----BEGIN CERTIFICATE-----` and ends with `-----END
CERTIFICATE-----`.

Download the first certificate and check that it is in the right format:


    > curl --remote-name https://www.apple.com/certificateauthority/AppleTimestampCA.cer


You should see that it is already in `PEM` format. You can also check who issued this certificate:

    > openssl x509 -in AppleTimestampCA.cer -noout -issuer
    >  issuer=C = US, O = Apple Inc., OU = Apple Certification Authority, CN = Apple Root CA


If you want to see more details about the certificate I recommend using the graphical [gcr-viewer](https://github.com/GNOME/gcr) tool:


    > gcr-viewer AppleTimestampCA.cer


At that point I was hoping that the `Apple Root CA` certificate would be part of the `/usr/share/ca-certificates/mozilla` certificates, which come
from the [Mozilla's CA Certificate Program](https://wiki.mozilla.org/CA). See also the [Included
Certificates](https://wiki.mozilla.org/CA/Included_Certificates) page. For whatever reason the `Apple Root CA` certificate is not present in there. I
was trying to google to find why, but did not come up with a good answer. Be it as it may, this means we also have to download the root certificate,
which we do next.


    > curl --remote-name https://www.apple.com/appleca/AppleIncRootCertificate.cer


And for whatever reason this certificate is now **not** in `PEM` format, which means we have to convert it:


    > openssl x509 -inform der -in AppleIncRootCertificate.cer -out AppleIncRootCertificate.pem
    > openssl x509 -in AppleIncRootCertificate.pem -noout -issuer
    >  issuer=C = US, O = Apple Inc., OU = Apple Certification Authority, CN = Apple Root CA


You can see in the above output that the cerfificate is self-signed by the `Apple Root CA`.

Once we have the cerficiates we can now finally verify our timestamp response with the hash/digest to see if the timestamp is valid:


    > openssl ts -verify -digest e22171694fd8e4240550f995c558bcc967b3df0e928b51a746b2cba26f6d9ea4 -in ts_req.tsr -CAfile AppleTimestampCA.cer -partial_chain
    >  Verification: OK
    > openssl ts -verify -digest e22171694fd8e4240550f995c558bcc967b3df0e928b51a746b2cba26f6d9ea4 -in ts_req.tsr -CAfile AppleIncRootCertificate.pem -untrusted AppleTimestampCA.cer
    >  Verification: OK


In the first call to `openssl` we used the `-partial_chain` argument to only verify against the `Apple Timestamp Certification Authority`
certificate. Via the `-CAfile` argument we tell `OpenSSL` which certificates we trust. As we downloaded both certificates, the `Apple Timestamp
Certification Authority` certificate and the `Apple Root CA` certificate from the same web-site I would not know why I would trust one more than the
other. But the second command shows how you check the timestamp response only trusting the `Apple Root CA` certificate (`-CAfile` argument) and
checking the full chain of trust from the `Apple Timestamp Certification Authority` certificate (`-untrusted`) to the `Apple Root CA` certificate.

One further, a bit *advanced* use, is to extract the certificate chain from the timestamp response. We asked the timestamp server to include the full
certificate chain via the `-cert` argument above in the `ts -query`:


    > openssl ts -query -digest 'e22171694fd8e4240550f995c558bcc967b3df0e928b51a746b2cba26f6d9ea4' -sha256 -cert -out ts_req.tsq


We can extract the certificate chain by first converting the timestamp response into `token` form and then extracting the certificate chain:

    > openssl ts -reply -in ts_req.tsr -token_out -out token.tk
    > openssl pkcs7 -inform DER -in token.tk -print_certs -outform PEM -out certificatechain.pem

If you look into it via for example `gcr-viewer` you'll see that we have 3 certificates in there:

    > gcr-viewer certificatechain.pem


* Timestamp Signer MA1
* Apple Timestamp Certification Authority
* Apple Root CA

We can also verify the timestamp response via:


    > openssl ts -verify -digest e22171694fd8e4240550f995c558bcc967b3df0e928b51a746b2cba26f6d9ea4 -in ts_req.tsr -CAfile AppleIncRootCertificate.pem -untrusted certificatechain.pem


This basically says that we trust the `Apple Root CA` certificate but that the full remaining certificate chain should be verified.

One additional option that might be useful is the `-no_check_time` option. It might be that the final certificate that was used to sign the timestamp
query has expired, but the rest of the certificate chain is still valid. Then you might want to ignore the expiry of the leaf certificate.


    > openssl ts -verify -no_check_time -digest e22171694fd8e4240550f995c558bcc967b3df0e928b51a746b2cba26f6d9ea4 -in ts_req.tsr -CAfile AppleIncRootCertificate.pem -untrusted certificatechain.pem


## Further and advanced use-cases

Imagine that you'd like to use a git repository as a tamperproof file archive for your business accounting, then you could use these RFC3161
timestamps together with native git functionality to achieve that as described here:

* [Git as Cryptographically Tamperproof File Archive using Chained RFC3161 Timestamps](https://www.linkedin.com/pulse/git-cryptographically-tamperproof-file-archive-using-chained/) ([github](https://github.com/MrMabulous/GitTrustedTimestamps))

In such a case you would also want your git repository to be encrypted on the remote host, even when you're using a private repository. In that case you could use functionality provided by [keybase.io](https://keybase.io):

* [Keybase launches encrypted git](https://keybase.io/blog/encrypted-git-for-everyone)

I hope this blog post is useful to you and I am as always happe to receive feed-back!
