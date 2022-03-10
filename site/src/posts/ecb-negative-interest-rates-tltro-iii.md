---
layout: "layouts/post-with-toc.njk"
title: "European Central Bank (ECB) Negative Interest Rates and TLTRO III (Targeted Longer Term Refinancing Operations)"
description: "The ECB is training banks to expect to get paid for taking money."
creationdate: 2021-08-26T17:18:00+02:00
date: 2021-08-26T17:18:00+02:00
keywords: ECB,TLTRO,negative,penalty,interest rates,Verwahrentgelt,EZB,Strafzins,Negativzins
tags: ['post']
nolang: true
# eleventyExcludeFromCollections: true
---

For the English version please see [below](#english).

<div lang="de-DE">

## Deutsch

Ich bin kein Experte für Bilanzanalyse und habe mir das notwendige Wissen selbst erarbeitet. Wenn du also Fehler in meiner Analyse findest dann nutze
doch bitte die Kommentarfunktion unten auf der Seite und erkläre mir wo ich nachbessern muss.

### Kontext

In meiner Wahrnehmung verbreitet die große Mehrheit der Finanzpresse unhinterfragt die Darstellung der Banken, dass die Banken lediglich die ihnen
selbst entstehenden Kosten über Negativzinsen bzw. Verwahrentgelt an die eigenen Kunden weitergeben. Analysiert man die Jahresabschlüsse von Banken
drängt sich allerdings ein anderes Bild auf: über Maßnahmen wie [TLTRO
III](https://www.bundesbank.de/de/aufgaben/geldpolitik/offenmarktgeschaefte/gezielte-laengerfristige-refinanzierungs-geschaefte-iii/gezielte-laengerfristige-refinanzierungs-geschaefte-iii-782974)
erzieht die EZB die Banken dazu zu erwarten für die Überlassung von Geld prozentual bezahlt zu werden. Wenn die EZB die Banken schon dafür bezahlt Geld
anzunehmen, dann sollen das Privatkunden doch gefälligst auch tun.

### Vorgeschichte: Vorhersagemethode welche Banken wohl demnächst Negativzinsen/Verwahrentgelte einführen würden

Letztes Jahr (2020) als mehr und mehr Banken anfingen Verwahrentgelte einzuführen hatte ich mir überlegt ob es nicht möglich wäre vorherzusagen welche
Banken wohl demnächst Negativzinsen/Verwahrentgelte einführen würden. Daraus wurde ein kleines Hobbyprojekt ...

Die BaFin führt eine Datenbank über alle Kreditinstitute in Deutschland:
* https://www.bafin.de/DE/PublikationenDaten/Datenbanken/Datenbanken_node.html
* Dort kann man entweder einzeln suchen: https://portal.mvp.bafin.de/database/InstInfo/sucheForm.do oder den gesamten Datenbestand als CSV herunterladen.


Über das Unternehmensregister (https://www.unternehmensregister.de/ureg/) kann man sich dann kostenlos und für jedermann zugänglich die
Jahresabschlüsse der Banken als PDF herunterladen. Das ist etwas mühsam, aber aus den Jahresabschlüssen kann man sich die relevanten Zahlen
zusammensuchen. Dabei muss man sich bewusst sein, dass es sich um Stichtagszahlen handelt, d.h. welche Kapitalflüsse über die verschiedenen Konten
während des Jahres stattfanden kann man nicht erkennen. Aber an bessere Zahlen wird man als außenstehender Dritter wohl nicht kommen, und für eine
"erste Näherung" sollten die Zahlen gut genug sein.

Ich erkläre den Prozess kurz am Beispiel der [Taunus-Sparkasse](https://www.taunussparkasse.de).

Unter Aktiva 4 (A4) findet man das Kreditvolumen ("Forderungen an Kunden"), das die Bank an Kunden vergeben hat. Für 2019 sah das so aus:<br>
<object data="/img/2019-taunus-sparkasse-a4.png" type="image/png" style="max-width: 100%">
<img src="/img/2019-taunus-sparkasse-a4.png" alt="2019-taunus-sparkasse-a4.png">
</object><br>
Also 4'447'755'192,92€ Kreditvolumen.

Unter Passiva 2 (P2) findet man das Einlagenvolumen ("Verbindlichkeiten gegenüber Kunden"), also das Geld das die Bank von Kunden angenommen hat. Für
2019 sah das so aus:<br>
<object data="/img/2019-taunus-sparkasse-p2.png" type="image/png" style="max-width: 100%">
<img src="/img/2019-taunus-sparkasse-p2.png" alt="2019-taunus-sparkasse-a4.png">
</object><br>
Also 4'741'187'486,32€ Einlagenvolumen von Kunden. Davon sind lediglich 307'929'231,53€ Spareinlagen. Worum es sich beim größten Block "andere
Verbindlichkeiten" genau handelt kann ich aktuell nicht sagen. Damit habe ich mich (noch) nicht beschäftigt, aber falls ihr das wisst dann lasst es
mich doch bitte über einen Kommentar (siehe ganz unten) wissen.[^andereverbindlichkeitende]

Daraus ergibt sich ein Überschuss an Einlagen gegenüber vergebenen Krediten von 4'447'755'192,92€ - 4'741'187'486,32€ = -293'432'293,40 €. Meine Idee
war nun diese Differenz als Art von "**Handlungsdruck**" zu sehen, weil ggf. die Bank diesen Mehrbetrag an Geld das sie nicht unter die Leute bringt bei
der Bundesbank parkt bzw. parken muss. Meine Idee war zu sagen: "**umso größer der Handlungsdruck umso wahrscheinlicher und aggressiver wird die Bank
Verwahrentgelt einführen**".

In der bisherigen Analyse fehlt noch eine Komponente: die Mindestreserve und der Freibetrag den die EZB den Banken einräumt bevor die Bank Strafzinsen
zahlen muss. Die Mindestreserve ist 1% von P2 (https://www.bundesbank.de/de/aufgaben/geldpolitik/mindestreserven/mindestreserven-602268 : "… ab dem
18.01.2012 auf 1 % abgesenkt"), also für die Taunus-Sparkasse 2019 ein Wert von 47'411'874,86 €. Dieses Mindestreserve-Soll ist befreit von den
Negativzinsen. Zudem hat die EZB den sog. "Staffelzins" (https://fincompare.de/staffelzins-ezb) eingeführt: "Von den Strafzinsen nimmt die EZB künftig
das Sechsfache der obligatorischen Mindestreserve aus." Insgesamt ergibt sich also ein Freibetrag von einem Faktor 7-mal Mindestreserve-Soll (1 + 6
für Mindestreserve + Staffelzins). Bei der Taunus-Sparkasse waren das 2019 also 7 x 47'411'874,86 € = 331'883'124,04 €. Das ist schon mal mehr als der
Überschuss an Einlagen gegenüber vergebenen Krediten (siehe oben -293'432'293,40 €). Der tatsächliche Betrag den die Taunus-Sparkasse bei der
Deutschen Bundesbank zum Stichtag 2019 parkt ist unter Aktiva 1b zu finden. Für 2019 sah das dann so aus:<br>
<object data="/img/2019-taunus-sparkasse-a1b.png" type="image/png" style="max-width: 100%">
<img src="/img/2019-taunus-sparkasse-a1b.png" alt="2019-taunus-sparkasse-a4.png">
</object><br>
Also 315'699'242,69 €, so gut wie ganz knapp den Freibetrag von 331'883'124,04 € voll ausgeschöpft. **Insgesamt hat die Taunus-Sparkasse 2019 also
selbst keine Negativzinsen bezahlt**[^ts2019nnirde].

### Analyse für 2020: die Überraschung

Vor kurzem wurde der Jahresabschluss der Taunus-Sparkasse für 2020 auf dem Unternehmensregister veröffentlicht. Und da gibt es eine unerwartete
Überraschung!

Kurz die Zahlen:
Kreditvolumen Aktiva 4 (A4): 5'182'709'929,84 €:<br>
<object data="/img/2020-taunus-sparkasse-a4.png" type="image/png" style="max-width: 100%">
<img src="/img/2020-taunus-sparkasse-a4.png" alt="2019-taunus-sparkasse-a4.png">
</object><br>

Einlagenvolumen Passiva 2 (P2): 5'290'045'654,78 €:<br>
<object data="/img/2020-taunus-sparkasse-p2.png" type="image/png" style="max-width: 100%">
<img src="/img/2020-taunus-sparkasse-p2.png" alt="2019-taunus-sparkasse-a4.png">
</object><br>

Also ein Überschuss an Einlagen gegenüber vergebenen Krediten von 5'182'709'929,84 € - 5'290'045'654,78 € = -107'335'724,94 €. D.h. der
**"Handlungsdruck" hat gegenüber 2019 abgenommen**, weil die Differenz aus Einlagen und Krediten von -293'432'293,40 € auf nur noch -107'335'724,94 €
gesunken ist. Zudem hat sich der **Freibetrag** aus Mindestreserve + Staffelzins auf 7 x 1% x P2 = 370'303'195,83 € **erhöht**.

> <span style="font-size: smaller;">
> Nur als Nebenbemerkung: die Spareinlagen haben sich von 2019 307'929'231,53€ auf 2020 301'558'901,06 verringert.
> </span>


Meine Erwartungshaltung wäre gewesen, dass die Taunus-Sparkasse lediglich einen Bruchteil des Freibetrags ausnutzen würde, weil sie ja auf anderen
Wegen Geld unter die Leute bringen konnte.

**Nun die Überraschung**: das Guthaben bei der Deutschen Bundesbank (Aktiva 1b) stieg 2020 auf sagenhafte 824'635'567,74 €!!<br>
<object data="/img/2020-taunus-sparkasse-a1b.png" type="image/png" style="max-width: 100%">
<img src="/img/2020-taunus-sparkasse-a1b.png" alt="2019-taunus-sparkasse-a4.png">
</object><br>
Warum würde eine Bank freiwillig und "ohne Not" ihr Guthaben bei der Bundesbank über den Freibetrag (für die Taunus-Sparkasse, siehe oben:
370'303'195,83 €) erhöhen, wenn sie doch weiß, dass sie für jeden Euro über diesem Freibetrag einen Strafzins von -0,5% bezahlen muss??

### TLTRO III (TLTRO = Targeted Longer Term Refinancing Operations)

Die Auflösung findet man auf Seite 36 unter Abschnitt 1.2 Passiva im Jahresabschluss:
> <span style="font-size: smaller;">
> Die Verbindlichkeiten gegenüber Kreditinstituten haben sich deutlich erhöht. Dies resultierte aus einem längerfristigen Refinanzierungsgeschäft
> (kurz: TLTRO III) mit der Europäischen Zentralbank. Dabei handelt es sich um eine geldpolitische Operation der Europäischen Zentralbank &ndash; sogenannte
> Offenmarktgeschäfte. Der EZB-Rat hat beschlossen, die Kreditvergabe an die Wirtschaft zu fördern. <span style="font-weight:bold;background-color:yellow;">Neben einer Basisvergütung von 0,5 % bezahlt die
> Europäische Zentralbank &ndash; bei einem vorgegebenen Kreditwachstum &ndash; eine zusätzliche Prämie von 0,5 % an die teilnehmenden Banken. Die Sparkasse hat in
> 2020 mit 1.125 Mio € am Refinanzierungsgeschäft TLTRO III teilgenommen</span>.
> </span>

Weiter oben auf derselben Seite stehen noch weitere Informationen bzw. Kontext:

> <span style="font-size: smaller;">
>
> Die Unternehmensplanung ging für das Geschäftsjahr 2020 von einer konstanten Bilanzsumme aus. Dieses Ziel wurde im Berichtsjahr in Folge der
> Teilnahme an dem längerfristigen Refinanzierungsgeschäft der Europäischen Zentralbank (kurz: TLTRO III) und dem Zufluss an Kundeneinlagen deutlich
> übertroffen.
>
> Der Anstieg der Refinanzierungsmittel führte bei der Mittelverwendung zu einem deutlich über Plan liegenden Wachstum bei den Forderungen an Kunden,
> den Wertpapieren sowie der Geldanlage bei der Landesbank Hessen-Thüringen und der Deutschen Bundesbank. Das Geschäftsvolumen entwickelte sich dabei
> kongruent zur Bilanzsumme.
>
> Gegenüber den in der Prognose geplanten konstanten Beständen konnte ein deutliches Wachstum der Kundenkredite &ndash; Forderungen an Kunden &ndash; durch die
> Nachfrage nach langfristigen Immobilienkrediten und durch den Finanzierungsbedarf deutscher Kommunen im Segment Unternehmer & Unternehmen &ndash; Bereich
> Kommunen, Investoren und Projektenwickler &ndash; erreicht werden.
>
> Gleichzeitig wurde die Liquiditätsreserve über Investitionen in Wertpapiere staatlicher Emittenten ausgebaut.
>
> <span style="font-weight:bold;background-color:yellow;">Verbleibende Refinanzierungsmittelüberschüsse erhöhten das Guthaben bei der Deutschen
> Bundesbank &ndash; Aktiva 1 &ndash;. Die Guthaben sind gegenüber dem Vorjahr deutlich auf 824,6 Mio € (Vorjahr 315,7 Mio €) angestiegen</span>.
> </span>


[TLTRO
III](https://www.bundesbank.de/de/aufgaben/geldpolitik/offenmarktgeschaefte/gezielte-laengerfristige-refinanzierungs-geschaefte-iii/gezielte-laengerfristige-refinanzierungs-geschaefte-iii-782974)
steht für "Targeted Longer Term Refinancing Operations". Wenn ich das richtig verstehe, dann zahlt die EZB den Banken mindestens 0,5% Vergütung für
jedes Geld das die Banken über dieses Programm annehmen und zusätzlich eine weitere Belohnung von bis zu 0,5% wenn die Banken das Geld erfolgreich
unter die Leute bringen. Im schlechtesten Fall, wenn die Bank das Geld nicht unter die Leute bringt, dann parkt sie es einfach auf dem Konto der
Deutschen Bundesbank (so wie bei der Taunus-Sparkasse anscheinend geschehen), wo zwar dann **teilweise**<sup>*</sup> 0,5% Negativzinsen anfallen, aber man ja
mindestens 0,5% Vergütung bekommt, also unterm Strich (netto) keine Kosten entstehen.

> <span style="font-size: smaller;">
>
> *) ich sage hier "teilweise" 0,5% Negativzinsen anfallen, weil ja lediglich auf Beträge jenseits des Freibetrags Negativzinsen gezahlt werden müssen,
> d.h. für die Taunus-Sparkasse, dass auf 370'303'195,83 € - 824'635'567,74 € = -454'332'371,91 € Negativzinsen gezahlt werden müssen. Diese
> Negativzinsen heben sich aber mit der Vergütung der EZB auf. Netto bekommt die Taunus-Sparkasse auf 1'125'000'000,00 € - 454'332'371,91 € =
> 670'667'628,09 € eine Vergütung von mindestens 0,5% (+ vielleicht noch eine zusätzliche Belohnung)!!
>
> </span>



### Schlussfolgerungen

Im etwas weiteren Schluss heißt das für mich, dass sich die Banken daran gewöhnen 0,5% "Belohnung" zu bekommen, wenn sie Geld annehmen. Vordergründig
wird zwar von "Weitergabe der Strafzinsen der EZB" gesprochen, aber die Realität sieht doch ganz anders aus! Die Banken müssen effektiv gar keine
Negativzinsen bezahlen und werden von der EZB sogar mit mindestens 0,5% Vergütung **verwöhnt** für jeden Euro den sie von der EZB annehmen! Warum
sollte die Bank noch Geld von Kunden wie dir und mir annehmen ohne 0,5% zu verlangen? Die Bank ist das ja von der EZB schon gewöhnt. Es geht hier um
ein Geschäftsmodell und nicht um eine "legitime Weitergabe von Kosten"!

Es ist wahrscheinlich sogar so, dass die Banken das Geld lieber von der EZB nehmen würden als von Kunden (sogar wenn die Kunden das Verwahrentgelt
zahlen), weil sie mit dem Geld der EZB sogar noch die Chance auf eine weitere Belohnung von bis zu 0,5% erhalten. Umso niedriger die Grenze für das
Verwahrentgelt umso mehr Kunden kann die Bank vielleicht dazu veranlassen ihr Geld in andere Kanäle umzuleiten und umso mehr Geld kann die Bank von
der EZB (inklusive Belohnungen) annehmen.

Wenn man etwas sucht findet man vereinzelt kritische Artikel in den Medien:
* 2020-04-30 finanz-szene: [Wie die Banken die Negativzins-Belastung gen Null senken](https://finanz-szene.de/banking/belastung-der-banken-aus-negativzinsen-koennte-2020-auf-null-sinken)
* 2021-08-17 Börse-Online: [Die Zinslüge: Wie Banken und Sparkassen an den Strafzinsen kräftig verdienen](https://www.boerse-online.de/nachrichten/geld-und-vorsorge/die-zinsluege-wie-banken-und-sparkassen-an-den-strafzinsen-kraeftig-verdienen-1030625156)

Im Großen und Ganzen aber übernimmt die große Mehrheit der Finanzpresse unhinterfragt die Rhetorik der Banken ohne das jemals kritisch zu
durchleuchten und es dem Laien verständlich zu erklären.

Auch wenn viele denken, dass sie sowieso nicht so viel Geld auf dem Konto haben um davon betroffen zu sein, so ist das nur die halbe Wahrheit. Viele
von uns haben Produkte zur privaten Altersvorsorge wie eine Riester Fonds oder eine Kapitallebensversicherung oder ähnliches. Sehr viele von uns sind
dadurch indirekt von Negativzinsen betroffen. Und auch direkt sind mehr und mehr Kunden betroffen, weil Banken die Grenzen für das Verwahrentgelt
immer weiter absenken: [Manche Banken und Sparkassen berechnen Strafzins ab dem ersten
Euro](https://www.versicherungsbote.de/id/4901575/Girokonto-Tagesgeld-Strafzins-ab-dem-ersten-Euro/). Auf
[biallo.de](https://www.biallo.de/geldanlage/ratgeber/so-vermeiden-sie-negativzinsen/) heißt es aktuell:

> <span style="font-size: smaller;">
>
> Unsere große Auswertung der Minuszinsen zeigt, dass einige Banken bereits ab 5.000 Euro Guthaben 0,50 Prozent pro Jahr berechnen. Mehr als 30
> Geldhäuser langen bereits ab dem ersten Euro zu – Tendenz steigend.
>
> </span>



[//]: # (https://www.welt.de/wirtschaft/article114649182/Italiener-und-Spanier-sind-reicher-als-Deutsche.html)
[//]: # (https://institutional.union-investment.de/dam/jcr:0fce35aa-c66d-43a2-807b-e7598fb61fe1/anGEDACHT_Private%20Verm%C3%B6gen%20EU.pdf)
[//]: # (https://www.focus.de/perspektiven/talking-good/talking-good-die-talkshow-von-focus-online-scholz-ich-moechte-lieber-der-liebe-vertrauen-als-der-rente_id_11242573.html)
[//]: # (https://www.focus.de/perspektiven/talking-good/was-braucht-deutschland-jetzt-neue-focus-online-show-talking-good-cherno-jobatey-diskutiert-mit-vizekanzler-scholz_id_11256642.html)
[//]: # (https://www.focus.de/finanzen/boerse/sparbuch-romantik-olaf-scholz-sendet-ein-fatales-signal-an-alle-sparer_id_11149190.html)
[//]: # (https://www.bundestag.de/abgeordnete/mdb_diaeten/1335-260796)
[//]: # (https://www.tz.de/politik/abgeordnete-volle-pension-mit-56-oder-schuften-bis-70-ruhestands-privilegien-6351517.html)

</div>

<div lang="en-GB">

### Weitere Artikel zu diesem Thema

* [Die Mär vom EZB-Strafzins](https://hartmutwalz.de/die-maer-vom-ezb-strafzins/) von Prof. Dr. Hartmut Walz (2021-10-29)
* [Deutsche Banken im TLTRO-Rausch: 100 Mio. € pro Institut](https://finanz-szene.de/banking/deutsche-banken-im-tltro-rausch-100-mio-e-pro-institut/) von finanz-szene.de (2021-08-26)  
* [Die ultimative Analyse zu den TLTRO-III-Geschäften der deutschen Banken](https://finanz-szene.de/banking/die-ultimative-analyse-zu-den-tltro-iii-geschaeften-der-deutschen-banken/) von finanz-szene.de (2021-11-11)


## English

I am not an expert in balance sheet analysis and have acquired the necessary knowledge via self-study. Therefore, if you find errors in my analysis then
please use the comment function at the bottom of the page and explain to me where I need to make improvements.

### Context

In my perception, the vast majority of the financial press spreads unquestioned the story of the banks that the banks only pass on the costs they are
burdened with themselves to their own customers via negative interest rates. If one analyses the annual financial statements of banks, however, a
different picture emerges: through measures such as TLTRO III, the ECB educates the banks to expect to be paid on a percentage basis for taking
money. If the ECB already pays the banks to accept money, then private customers should kindly do the same.

### Background: Prediction method to predict which banks would probably introduce negative interest rates in the near future

Last year (2020) when more and more banks started to introduce negative interest rates, I thought about whether it would be possible to predict which
banks would soon introduce negative interest rates. This question turned into a small hobby project ...

BaFin maintains a database of all credit institutions in Germany:

* https://www.bafin.de/DE/PublikationenDaten/Datenbanken/Datenbanken_node.html
* There you can either search individually: https://portal.mvp.bafin.de/database/InstInfo/sucheForm.do or download the entire database as CSV.

The annual financial statements of the banks can then be downloaded as PDF files free of charge and accessible to everyone via the company register
(https://www.unternehmensregister.de/ureg/). It's a bit of a hassle, but you can look up the relevant figures from the annual financial
statements. You have to be aware that these are end of period date numbers, i.e. you cannot see which capital flows took place through the various
accounts during the year. But as an outside third party you probably will not get better numbers, and the numbers should be good enough as a "first
approximation".

I will briefly explain the process using the [Taunus-Sparkasse](https://www.taunussparkasse.de) as an example.

Assets 4 (A4) shows the credit volume ("Forderungen an Kunden") that the bank has granted to customers. For 2019 it looked like this:<br>
<object data="/img/2019-taunus-sparkasse-a4.png" type="image/png" style="max-width: 100%">
<img src="/img/2019-taunus-sparkasse-a4.png" alt="2019-taunus-sparkasse-a4.png">
</object><br>
So € 4,447,755,192.92 credit volume.

Under liability item 2 (P2) you can find the deposit volume ("Verbindlichkeiten gegenüber Kunden"), i.e. the money that the bank has accepted from
customers. For 2019 it looked like this:<br>
<object data="/img/2019-taunus-sparkasse-p2.png" type="image/png" style="max-width: 100%">
<img src="/img/2019-taunus-sparkasse-p2.png" alt="2019-taunus-sparkasse-a4.png">
</object><br>
So € 4,741,187,486.32 deposit volume from customers. Of this, only € 307,929,231.53 are savings deposits. At the moment I cannot say what exactly is
the largest block of "other liabilities" ("andere Verbindlichkeiten"). I haven't dealt with that (yet), but if you know, please let me know via a
comment (see below).[^andereverbindlichkeitenen]

This results in a surplus of deposits compared to loans granted of € 4,447,755,192.92 - € 4,741,187,486.32 = € -293,432,293.40. My idea was to see
this difference as a kind of "**pressure to act**", because if there is no other way for the bank to make good use of the deposits the bank has to
park this surplus at the central bank (Bundesbank). My idea was to say: "**The greater the pressure to act, the more likely and aggressively the bank
will introduce negative interest rates**".

In the analysis so far, one component is still missing: the minimum reserve and the exemption that the ECB grants to the banks before the bank has to
pay penalty interest. The minimum reserve is 1% of P2 (https://www.bundesbank.de/de/lösungen/geldpolitik/mindestreserven/mindestreserven-602268 : "…
reduced to 1% from January 18, 2012"), i.e. for the Taunus-Sparkasse 2019 a value of € 47,411,874.86. This minimum reserve requirement is exempt from
negative interest. In addition, the ECB has introduced the so-called "staggered interest" (https://fincompare.de/staffelzins-ezb): "In future, the
ECB will exclude six times the mandatory minimum reserve from the penalty interest." Overall, this results in an exemption of a factor of 7 times the
minimum reserve (1 + 6 for minimum reserve + staggered interest). At Taunus-Sparkasse, that was 7 x € 47,411,874.86 = € 331,883,124.04
in 2019. That is more than the excess of deposits compared to loans granted (see above -293'432'293.40 €). The actual amount that Taunus-Sparkasse
parked at the Deutsche Bundesbank on the 2019 end of period date can be found under assets 1b. For 2019 it looked like this:<br>
<object data="/img/2019-taunus-sparkasse-a1b.png" type="image/png" style="max-width: 100%">
<img src="/img/2019-taunus-sparkasse-a1b.png" alt="2019-taunus-sparkasse-a4.png">
</object><br>
So a value of € 315,699,242.69. Taunus-Sparkasse almost exhausted the allowance of € 331,883,124.04. **Overall, the Taunus-Sparkasse did not pay negative
interest in 2019**[^ts2019nniren].

### Analysis for 2020: the surprise

The annual financial statements of Taunus-Sparkasse for 2020 were recently published in the company register. And there is an unexpected surprise!

Briefly the numbers: Credit volume assets 4 (A4): 5,182,709,929.84 €:<br>
<object data="/img/2020-taunus-sparkasse-a4.png" type="image/png" style="max-width: 100%">
<img src="/img/2020-taunus-sparkasse-a4.png" alt="2019-taunus-sparkasse-a4.png">
</object><br>

Deposit volume liabilities 2 (P2): € 5,290,045,654.78:<br>
<object data="/img/2020-taunus-sparkasse-p2.png" type="image/png" style="max-width: 100%">
<img src="/img/2020-taunus-sparkasse-p2.png" alt="2019-taunus-sparkasse-a4.png">
</object><br>

This means a surplus of deposits compared to loans granted of € 5,182,709,929.84 - € 5,290,045,654.78 = € -107,335,724.94. In other words, the
**"pressure to act" has decreased compared to 2019** because the difference between deposits and loans has fallen from € -293,432,293.40 to just €
-107,335,724.94. In addition, the **exemption** from minimum reserve + graduated interest has **increased** to 7 x 1% x P2 = € 370,303,195.83.

> <span style="font-size: smaller;">
> Just as a side note: savings deposits decreased from € 307,929,231.53 in 2019 to € 301,558,901.06 in 2020.
> </span>

My expectation was that the Taunus-Sparkasse would only use a fraction of the exempted amount, because it could make good use of the money they got via
deposits in other ways than depositing it at the central bank.

**Now the surprise**: the balance at the Deutsche Bundesbank (assets 1b) rose to a staggering € 824,635,567.74 in 2020!!<br>
<object data="/img/2020-taunus-sparkasse-a1b.png" type="image/png" style="max-width: 100%">
<img src="/img/2020-taunus-sparkasse-a1b.png" alt="2019-taunus-sparkasse-a4.png">
</object><br>
Why would a bank voluntarily and "without necessity" increase its credit balance at the Bundesbank over the exempted amount (for the Taunus-Sparkasse,
see above: 370,303,195.83 €) when the bank knows that it has to pay a penalty interest of -0.5% for every euro above the exempted amount?

### TLTRO III (TLTRO = Targeted Longer Term Refinancing Operations)

The resolution can be found on page 36 under section 1.2 Liabilities in the annual financial statement:

> <span style="font-size: smaller;">
> The liabilities to banks have increased significantly. This resulted from a longer-term refinancing transaction (TLTRO III for short) with the
> European Central Bank. This is a monetary policy operation of the European Central Bank &ndash; so-called open market operations. The Governing
> Council decided to encourage lending to the economy. <span style="font-weight:bold;background-color:yellow;">In addition to a basic remuneration of
> 0.5%, the European Central Bank pays an additional premium of 0.5% to the participating banks &ndash; given a specified credit growth. In 2020, the
> Sparkasse participated in the TLTRO III refinancing business with € 1,125 million</span>.
> </span>

Further up on the same page there is even more information and context:

> <span style="font-size: smaller;">
>
> The corporate planning assumed constant total assets for the 2020 financial year. This goal was significantly exceeded in the reporting year as a
> result of participation in the longer-term refinancing business of the European Central Bank (TLTRO III for short) and the inflow of customer
> deposits.
>
> The increase in refinancing funds led to a significantly above plan growth in the use of funds in receivables from customers, securities and
> investments at the Landesbank Hessen-Thüringen and the Deutsche Bundesbank. The business volume developed in line with the balance sheet total.
>
> Compared to the constant levels planned in the forecast, a significant increase in customer loans &ndash; receivables from customers &ndash; was achieved
> through the demand for long-term real estate loans and the financing requirements of German municipalities in the entrepreneur & company segment &ndash;
> municipalities, investors and project developers.
>
> At the same time, the liquidity reserve was expanded through investments in securities from state issuers.
>
> <span style="font-weight:bold;background-color:yellow;">Remaining excess refinancing funds increased the balance at the Deutsche Bundesbank &ndash; assets
> 1 &ndash;. The balances increased significantly compared to the previous year to € 824.6 million (previous year: € 315.7 million).</span>.
> </span>


[TLTRO
III](https://www.bundesbank.de/de/aufgaben/geldpolitik/offenmarktgeschaefte/gezielte-laengerfristige-refinanzierungs-geschaefte-iii/gezielte-laengerfristige-refinanzierungs-geschaefte-iii-782974)
stands for "Targeted Longer Term Refinancing Operations". If I understand correctly, the ECB pays the banks at least 0.5% compensation for every euro
the banks take through this program and an additional reward of up to 0.5% if the banks successfully make use of the money by giving loans. In the
worst case, if the bank does not manage to make good use of the money, the bank simply parks the money in the account of the Deutsche Bundesbank (as
it apparently happened with the Taunus-Sparkasse), where **partially**<sup>*</sup> 0.5% negative interest rate is incurred. But as the bank gets at
least 0.5% remuneration from the ECB the (net) bottom line is zero.

> <span style="font-size: smaller;">
>
> *) I say here "partially" 0.5% negative interest accrues, because negative interest only has to be paid on amounts beyond the exemption, i.e. for
> Taunus-Sparkasse this means that for 370,303,195.83 € - 824,635,567, 74 € = -454,332,371.91 € negative interest must be paid. However, these
> negative interest rates cancel each other out with the remuneration of the ECB. The Taunus-Sparkasse receives a net remuneration of at least 0.5% on
> 1,125,000,000.00 € - 454,332,371.91 € = 670,667,628.09 € (+ perhaps an additional reward)!!
>
> </span>


### Conclusions

To conclude, in my understanding, this means that banks get used to receiving 0.5% "reward" when they accept money. Superficially there is talk of
"passing on the ECB's penalty interest" to clients of the banks, but the reality is quite different! The banks do not have to pay any negative interest
at all and are even **pampered** by the ECB with at least 0.5% remuneration for every euro they accept from the ECB! Why would the bank still accept money
from customers like you and me without charging 0.5%? The bank is used to that from the ECB. This is a business model and not a "legitimate passing on
of own costs"!

It is probably even worse, in that the banks most likely prefer to take the money from the ECB rather than from customers (even if the customers pay
the custody fee), because with the money from the ECB they not only get the 0.5% but in addition the chance of earning a further reward of up to
0.5%. The lower the limit at which banks charge the custody fee from their clients, the more customers the bank may be able to nudge to divert their
money into other channels and the more money the bank can accept from the ECB (including the rewards).

If you are looking for critical voices in the media you will be able to find a few:
* 2020-04-30 finanz-szene: [Wie die Banken die Negativzins-Belastung gen Null senken](https://finanz-szene.de/banking/belastung-der-banken-aus-negativzinsen-koennte-2020-auf-null-sinken)
* 2021-08-17 Börse-Online: [Die Zinslüge: Wie Banken und Sparkassen an den Strafzinsen kräftig verdienen](https://www.boerse-online.de/nachrichten/geld-und-vorsorge/die-zinsluege-wie-banken-und-sparkassen-an-den-strafzinsen-kraeftig-verdienen-1030625156)

By and large, however, the vast majority of the financial press adopts the banks' rhetoric without questioning, without ever critically examining it
and explaining it to laypeople.

Even if many think that they don't have that much money in their accounts to be affected anyway, that's only half the truth. Many of us have products
for private retirement provision such as a Riester fund or a capital life insurance or something similar. As a result, many of us are indirectly
affected by negative interest rates. And more and more customers are directly affected because banks keep lowering the custody fee limits: [some banks
and savings banks charge penalty interest from the first euro](https://www.versicherungsbote.de/id/4901575/Girokonto-Tagesgeld-Strafzins-ab-dem-ersten-Euro/). On [biallo.de](https://www.biallo.de/geldanlage/ratgeber/so-vermeiden-sie-negativzinsen/) currently you can read:

> <span style="font-size: smaller;">
>
> Our large evaluation of negative interest rates shows that some banks charge 0.50 percent per year from a credit balance of 5,000 euros. More than
> 30 banks charge from the first euro &ndash; and the trend is rising.
>
> </span>

</div>


## Footnotes

[^ts2019nnirde]: unter der Annahme, dass es unterjährig keine großen Unterschiede zum Stichtag gab.
[^ts2019nniren]: assuming that there were no major differences to the end of period date during the year.
[^andereverbindlichkeitende]: Ich habe folgende Infos dazu erhalten: Zu den "anderen Verbindlichkeiten" gegenüber Kunden gehören vor allem Guthaben
    auf Giro-, Tagesgeld- und Festgeldkonten (=Termingeldeinlagen). Spareinlagen sind bspw die klassischen Sparbücher die gesetzliche Vorgaben wie
    bspw Kündigungsfristen und Verfügungshöchstbeträge erfüllen müssen um als Spareinlage klassifiziert werden zu dürfen.
[^andereverbindlichkeitenen]: I have received the following information about this: "Other liabilities" to customers primarily include credit on
     current, overnight and fixed deposit accounts (= time deposits). Savings deposits are, for example, the classic savings books that have to meet
     legal requirements such as notice periods and maximum withdrawal amounts in order to be classified as savings deposits.
