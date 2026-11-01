---
# DEMO: fikcyjny projekt do oceny wyglądu, do usunięcia przed wdrożeniem (D3)
title: Portal serwisowy
summary: Zgłoszenia od klientów, przydział techników i historia każdego urządzenia dla firmy serwisującej maszyny.
tags: [Aplikacja]
order: 4
demo: true
cover: ../../assets/demo/serwis-base.webp
coverAlt: Tablica zgłoszeń serwisowych w kolumnach, nowe, w realizacji, czeka na części, zamknięte
live: serwis
facts:
  industry: Serwis maszyn
  scope: Aplikacja
  status: W utrzymaniu
tech: [typescript, nodejs, docker]
blocks:
  - type: text
    title: Problem
    body:
      - Zgłoszenia przychodziły mailem i telefonicznie, a historia napraw każdego urządzenia była w notatkach techników. Klient nie wiedział, na jakim etapie jest jego zgłoszenie.
  - type: text
    title: Co zbudowaliśmy
    body:
      - System do obsługi zgłoszeń i organizowania pracy techników serwisowych.
      - Pozwala przydzielać zadania, sprawdzać status napraw i przeglądać historię serwisową urządzeń. Klient widzi status swojego zgłoszenia w portalu.
  - type: media
    image: ../../assets/demo/serwis.webp
    alt: Tablica zgłoszeń serwisowych z przydzielonymi technikami
  - type: tech
    title: Z czym połączyliśmy
    body:
      - Poczta, z której zgłoszenia trafiają do portalu, i magazyn części, który pokazuje, czy naprawa może ruszyć.
  - type: text
    title: Co było trudne
    body:
      - Technicy pracują w terenie, często bez zasięgu. Aplikacja zapisuje zmiany na telefonie i wysyła je, gdy wróci połączenie.
  - type: text
    title: Utrzymanie
    body:
      - Utrzymujemy portal i serwery, a nowe typy urządzeń i formularze dodajemy na bieżąco.
---
