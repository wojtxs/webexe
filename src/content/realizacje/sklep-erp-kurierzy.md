---
# DEMO: fikcyjny projekt do oceny wyglądu, do usunięcia przed wdrożeniem (D3)
title: Sklep, ERP i kurierzy w jednym przepływie
summary: Zamówienia, stany magazynowe i etykiety synchronizują się same. Błędy wracają do kolejki, zanim zauważy je klient.
tags: [Integracje, Utrzymanie]
order: 3
featured: true
demo: true
cover: ../../assets/demo/przeplywy-base.webp
coverAlt: Monitor integracji, mapa połączeń między sklepem, ERP, magazynem, kurierami i księgowością oraz dziennik zdarzeń
live: przeplywy
facts:
  industry: E-commerce
  scope: Integracje, utrzymanie
  status: W utrzymaniu
tech: [nodejs, docker, cloudflare]
blocks:
  - type: text
    title: Problem
    body:
      - Zamówienia ze sklepu ktoś przenosił do ERP, a stany magazynowe aktualizowały się raz dziennie. Zdarzało się, że sklep sprzedawał towar, którego już nie było.
  - type: text
    title: Co zbudowaliśmy
    body:
      - Połączenie sklepu internetowego z systemem ERP, magazynem i usługami kurierskimi.
      - Zamówienia, stany magazynowe i dane wysyłkowe synchronizują się między systemami. Integracja rejestruje błędy i pozwala ponownie przetworzyć operacje, które się nie powiodły.
  - type: media
    image: ../../assets/demo/przeplywy.webp
    alt: Monitor integracji z mapą połączeń między systemami i dziennikiem zdarzeń
  - type: tech
    title: Z czym połączyliśmy
    body:
      - Sklep, ERP, system magazynowy, API kurierów i księgowość. Każde połączenie ma własną kolejkę, więc awaria jednego nie zatrzymuje pozostałych.
  - type: text
    title: Co było trudne
    body:
      - API kurierów potrafią nie odpowiadać w szczycie. Etykiety generują się więc w kolejce z ponowieniami, a magazyn widzi status każdej paczki.
  - type: text
    title: Utrzymanie
    body:
      - Monitorujemy przepływy, aktualizujemy integracje, gdy dostawcy zmieniają API, i dokładamy kolejnych przewoźników.
---
