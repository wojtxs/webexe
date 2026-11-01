---
# DEMO: fikcyjny projekt do oceny wyglądu, do usunięcia przed wdrożeniem (D3)
title: Kokpit floty
summary: System dyspozytorski dla firmy transportowej. Trasy, pojazdy i zlecenia w jednym miejscu zamiast arkuszy i telefonów.
tags: [Aplikacja, Integracje]
order: 1
featured: true
demo: true
cover: ../../assets/demo/flota-base.webp
coverAlt: Pulpit dyspozytora, mapa Polski z trasami pojazdów, lista pojazdów w trasie i liczba zleceń dnia
live: flota
facts:
  industry: Transport
  scope: Aplikacja, integracje
  status: W utrzymaniu
tech: [typescript, nodejs, docker, googlecloud]
blocks:
  - type: text
    title: Problem
    body:
      - Dyspozytorzy planowali trasy w arkuszach, a o tym, gdzie jest auto i co dzieje się ze zleceniem, dowiadywali się przez telefon. Każda zmiana planu oznaczała kilka rozmów i ręczne poprawki w kilku plikach.
  - type: text
    title: Co zbudowaliśmy
    body:
      - System dla dyspozytorów, który w jednym miejscu zbiera informacje o pojazdach, trasach i realizowanych zleceniach.
      - Zlecenia z portalu klienta trafiają od razu na listę dnia, a dyspozytor widzi na mapie, które auto może je przejąć.
  - type: media
    image: ../../assets/demo/flota.webp
    alt: Pulpit dyspozytora z mapą tras, listą pojazdów w trasie i powiadomieniami o nowych zleceniach
    caption: Pulpit dyspozytora
  - type: tech
    title: Z czym połączyliśmy
    body:
      - Lokalizacje pojazdów przychodzą z systemu GPS floty, a zlecenia synchronizują się z ERP. Dyspozytor niczego nie przepisuje ręcznie.
  - type: text
    title: Co było trudne
    body:
      - Dane z GPS przychodzą nieregularnie i czasem z opóźnieniem. Mapa pokazuje więc wiek ostatniej pozycji, a system nie zgaduje, gdzie auto jest teraz.
  - type: text
    title: Utrzymanie
    body:
      - Utrzymujemy serwery, kopie zapasowe i monitoring. Nowe funkcje dokładamy etapami, kiedy dyspozytorzy zgłaszają potrzebę.
---
