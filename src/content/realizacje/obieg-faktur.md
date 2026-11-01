---
# DEMO: fikcyjny projekt do oceny wyglądu, do usunięcia przed wdrożeniem (D3)
title: Obieg faktur z agentem AI
summary: Agent odczytuje faktury z poczty i przypisuje je do projektów. Księgowość tylko sprawdza i zatwierdza.
tags: [Automatyzacja, AI]
order: 2
featured: true
demo: true
cover: ../../assets/demo/faktury-base.webp
coverAlt: Kolejka faktur do akceptacji, podgląd dokumentu z zaznaczonymi polami i dane odczytane przez agenta
live: faktury
facts:
  industry: Biuro projektowe
  scope: Automatyzacja, AI
  status: W utrzymaniu
tech: [typescript, nodejs, docker]
blocks:
  - type: text
    title: Problem
    body:
      - Faktury kosztowe przychodziły na kilka skrzynek. Księgowość przepisywała z nich dane i ustalała, do którego projektu należy każdy koszt, często dopytując kierowników.
  - type: text
    title: Co zbudowaliśmy
    body:
      - System pobiera faktury z poczty, odczytuje dane z dokumentów i przypisuje je do odpowiednich projektów.
      - Księgowość dostaje przygotowane informacje do sprawdzenia i zatwierdzenia. Agent przygotowuje, a człowiek zatwierdza.
  - type: media
    image: ../../assets/demo/faktury.webp
    alt: Kolejka faktur do akceptacji z podglądem dokumentu i polami odczytanymi przez agenta
  - type: tech
    title: Z czym połączyliśmy
    body:
      - Skrzynki pocztowe, system księgowy i lista projektów z ERP. Zatwierdzona faktura trafia do księgowości bez ręcznego przepisywania.
  - type: text
    title: Co było trudne
    body:
      - Faktury mają różne układy, a część przychodzi jako skan. Agent przy każdym polu podaje pewność odczytu, a dokumenty z niepewnymi polami trafiają do sprawdzenia w pierwszej kolejności.
  - type: text
    title: Utrzymanie
    body:
      - Pilnujemy jakości odczytu na nowych wzorach faktur i poprawiamy reguły, gdy dostawca zmienia układ dokumentu.
---
