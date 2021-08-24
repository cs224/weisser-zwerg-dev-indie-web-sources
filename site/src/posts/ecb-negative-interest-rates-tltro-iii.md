---
layout: "layouts/post-with-toc.njk"
title: "European Central Bank (ECB) Negative Interest Rates and TLTRO III (Targeted Longer Term Refinancing Operations)"
description: "The ECB is training banks to expect to get paid for taking money."
creationdate: 2021-08-22T09:12:00+02:00
date: 2021-08-22T09:12:00+02:00
keywords: ECB,TLTRO,negative,penalty,interest rates
tags: ['post']
# eleventyExcludeFromCollections: true
---

For the English version please see [below](#context).

## Deutsch

Ich bin kein Experte für Bilanzanalyse und habe mir das notwendige Wissen selbst erarbeitet. Wenn du also Fehler in meiner Analyse findest dann nutze
doch bitte die Kommentarfunktion unten auf der Seite und erkläre mir wo ich nachbessern muss.

### Kontext

In meiner Wahrnehmung verbreitet die große Mehrheit der Finanzpresse unhinterfragt die Darstellung der Banken, dass die Banken lediglich die ihnen
selbst entsehenden Kosten über Negativzinsen bzw. Verwahrentgelt an die eigenen Kunden weitergeben. Analysiert man die Jahresabschlüsse von Banken
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
zusammensuchen. Dabei muss man sich bewußt sein, dass es sich um Stichtagszahlen handelt, d.h. welche Kapitalflüsse über die verschiedenen Konten
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
Also 4'741'187'486,32€ Einlagenvolumen von Kunden. Davon sind lediglich 307'929'231,53€ Spareinlagen. Worum es sich beim größten Block der "andere
Verbindlichkeiten" genau handelt kann ich aktuell nicht sagen. Damit habe ich mich (noch) nicht beschäftigt, aber falls ihr das wisst dann lasste es
mich doch bitte über einen Kommentar (siehe ganz unten) wissen.

Daraus ergibt sich ein Überschuss an Einlagen gegenüber vergebenen Krediten von 4'447'755'192,92€ - 4'741'187'486,32€ = -293'432'293,40 €. Meine Idee
war nun diese Differenz als Art von "**Handlungsdruck**" zu sehen, weil ggf. die Bank diesen Mehrbetrag an Geld das sie nicht unter die Leute bringt bei
der Bundesbank parkt bzw. parken muss. Meine Idee war zu sagen: "**umso größer der Handlungsdruck umso wahrscheinlicher und aggressiver wird die Bank
Verwahrentgelt einführen**".

In der bisherigen Analyse fehlt noch eine Komponente: die Mindestreserve und der Freibetrag den die EZB den Banken einräumt bevor die Bank Strafzinsen
zahlen muss. Die Mindestreserve ist 1% von P2 (https://www.bundesbank.de/de/aufgaben/geldpolitik/mindestreserven/mindestreserven-602268 : "… ab dem
18.01.2012 auf 1 % abgesenkt"), also für die Taunus-Sparkasse 2019 ein Wert von 47'411'874,86 €. Dieses Mindestreserve-Soll ist befreit von den
Negativzinsen. Zudem hat die EZB den sog. "Staffelzins" (https://fincompare.de/staffelzins-ezb) eingeführt: "Von den Strafzinsen nimmt die EZB künftig
das Sechsfache der obligatorischen Mindestreserve aus." Insgesamt ergibt sich also ein Freibetrag von einem Faktor 7 mal Mindestreserve-Soll (1 + 6
für Mindestreserve + Staffelzins). Bei der Taunus-Sparkasse waren das 2019 also 7 x 47'411'874,86 € = 331'883'124,04 €. Das ist schon mal mehr als der
Überschuss an Einlagen gegenüber vergebenen Krediten (siehe oben -293'432'293,40 €). Der tatsächlichen Betrag den die Taunus-Sparkasse bei der
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

Also ein Überschuss an Einlagen gegenüber vergebenen Krediten von 5'290'045'654,78 € - 5'182'709'929,84 € = -107'335'724,94 €. D.h. der
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
Deutschen Bundesbank (so wie bei der Taunus-Sparkasse anscheinend geschehen), wo zwar dann **teilweise**[^tltropark] 0,5% Negativzinsen anfallen, aber man ja
mindestens 0,5% Vergütung bekommt, also unterm Strich (netto) keine Kosten entstehen.

### Schlussfolgerungen

Im etwas weiteren Schluss heißt das für mich, dass sich die Banken daran gewöhnen 0,5% "Belohnung" zu bekommen, wenn sie Geld annehmen. Vordergründig
wird zwar von "Weitergabe der Strafzinsen der EZB" gesprochen, aber die Realität sieht doch ganz anders aus! Die Banken müssen effektiv gar keine
Negativzinsen bezahlen und werden von der EZB sogar mit mindestens 0,5% Vergütung **verwöhnt** für jeden Euro den sie von der EZB annehmen! Warum
sollte die Bank noch Geld von Kunden wie dir und mir annehmen ohne 0,5% zu verlangen? Die Bank ist das ja von der EZB schon gewöhnt. Es geht hier um
ein Geschäftsmodell und nicht um eine "legitime Weitergabe von Kosten"!

Es ist wahrscheinlich sogar so, dass die Banken das Geld lieber von der EZB nehmen würden also von Kunden (sogar wenn die Kunden das Verwahrentgelt
zahlen), weil sie mit dem Geld der EZB sogar noch die Chance auf eine weitere Belohnung von bis zu 0,5% erhalten. Umso niedriger die Grenze für das
Verwahrentgelt umso mehr Kunden kann die Bank vielleicht dazu veranlassen ihr Geld in andere Kanäle umzuleiten und umso mehr Geld kann die Bank von
der EZB (inklusive Belohnungen) annehmen.

Wenn man etwas sucht findet man vereinzelt kritische Artikel in den Medien:
* 2020-04-30 finanz-szene: [Wie die Banken die Negativzins-Belastung gen Null senken](https://finanz-szene.de/banking/belastung-der-banken-aus-negativzinsen-koennte-2020-auf-null-sinken)
* 2021-08-17 Börse-Online: [Die Zinslüge: Wie Banken und Sparkassen an den Strafzinsen kräftig verdienen](https://www.boerse-online.de/nachrichten/geld-und-vorsorge/die-zinsluege-wie-banken-und-sparkassen-an-den-strafzinsen-kraeftig-verdienen-1030625156)

Im Großen und Ganzen aber übernimmt die große Mehrheit der Finanzpresse bzw. der Leitmedien unhinterfragt die Rhetorik der Banken ohne das jemals
kritisch zu durchleuchten und es dem Laien verständlich zu erklären.

Auch wenn viele denken, dass sie sowieso nicht so viel Geld auf dem Konto haben um davon betroffen zu sein, so ist das nur die halbe Wahrheit. Viele
von uns haben Produkte zur privaten Altersvorsorge wie eine Riesterfonds oder eine Kapitallebensversicherung oder ähnliches. Sehr viele von uns sind
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


## Englisch

### Context

In my perception the media are simply repeating the core message of banks that they are merely charging bank clients the same interest rates that they
are being charged by the central bank.


## Footnotes

[^ts2019nnirde]: unter der Annahme, dass es unterjährig keine großen Unterschiede zum Sichtag gab
[^tltropark]: ich sage hier "teilweise" 0,5% Negativzinsen anfallen, weil ja lediglich auf Beträge jenseits des Freibetrags Negativzinsen gezahlt
    werden müssen, d.h. für die Taunus-Sparkasse, dass auf 370'303'195,83 € - 824'635'567,74 € = -454'332'371,91 € Negativzinsen gezahlt werden
    müssen. Diese Negativzinsen heben sich aber mit der Vergütung der EZB auf. Netto bekommt die Taunus-Sparkasse auf 1'125'000'000,00 € -
    454'332'371,91 € = 670'667'628,09 € eine Vergütung von mindestens 0,5% (+ vielleicht noch eine zusätzliche Belohnung)!!
