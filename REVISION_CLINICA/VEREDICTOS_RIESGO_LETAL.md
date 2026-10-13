# Veredictos: cartas con riesgo letal (2026-10-13)

Revisión de las 63 filas de la hoja `Prioridad (riesgo letal)` y de las 3 de `Correcciones`. Las 63 filas son unas 45 afirmaciones distintas: varias cartas se repiten entre familias (colangitis, neumotórax a tensión, SCACEST, DPPNI).

**Quién y cómo.** La hizo Claude (asistente de IA) contrastando cada afirmación contra PubMed y Consensus, no un médico. Es una primera criba que reduce el trabajo del revisor clínico; no lo sustituye. Los veredictos están en las columnas `Veredicto`, `Corrección sugerida` y `Fuente verificada` de `revision_clinica.xlsx` y `.csv`.

## Resultado

| | Filas |
|---|---|
| Aprobar | 53 |
| Corregir (ya aplicado al juego) | 10 |
| Rechazar | 0 |

Ninguna carta enseña lo contrario de lo que dice la evidencia. Cada carta es una conducta errónea que el jugador debe descartar, y en las 63 esa conducta resultó, en efecto, errónea. Lo que falló en algunas fue el comentario del mentor o la fuente citada.

| Fuente verificada | Filas | Significado |
|---|---|---|
| Sí | 22 | Leí la afirmación en el resumen o el texto completo de la fuente |
| Parcial | 33 | Localicé la guía, pero su texto no estaba disponible para esa afirmación concreta (ATLS es un libro; varias guías de AHA, ESC, ACOG y CDC no tienen texto libre en PubMed Central) |
| No | 8 | No localicé la fuente citada: *Insufficient data*. La afirmación es farmacología o práctica estándar, pero falta la cita |

## Correcciones aplicadas al juego

| Carta | Qué estaba mal | Ahora | Fuente verificada |
|---|---|---|---|
| Transfusión hasta Hb >10 (várices) | Meta "7 a 9 g/dL" | Meta 7 a 8 g/dL | Baveno VII, recomendación 6.2 ([doi](https://doi.org/10.1016/j.jhep.2021.12.022)) |
| Puerta-balón de 4 h | "ICP en ≤90 min desde el primer contacto; si no, fibrinólisis" mezclaba la meta con el umbral de decisión | Fibrinólisis si la ICP no es posible en 120 min desde el diagnóstico | Bhatt, JAMA 2022 ([doi](https://doi.org/10.1001/jama.2022.0358)) |
| Fibrinólisis en choque cardiogénico | "Sin importar el tiempo de retraso… último recurso" | ICP inmediata; fibrinólisis solo si la ICP no llega a tiempo | Samsky, JAMA 2021 ([doi](https://doi.org/10.1001/jama.2021.18323)) |
| Metotrexato en paciente inestable | "El hemoperitoneo contraindica en forma absoluta" | La inestabilidad o los datos de rotura | ACOG PB 193 ([doi](https://doi.org/10.1097/AOG.0000000000002560)) |
| Reiniciar antipsicótico a las 24 h tras un SNM | "Al menos 2 semanas" como regla | Periodo sin fármaco (suele recomendarse ≥2 semanas), otro agente, dosis baja | Pileggi 2016 ([doi](https://doi.org/10.1177/1060028016657553)) |
| Metoclopramida en obstrucción | La fuente (WSES, obstrucción por bridas) no trata la metoclopramida | Fuente cambiada | Ponte 1981 ([doi](https://doi.org/10.1093/ajhp/38.6.829)) |
| Tocólisis de rutina en DPPNI (2 filas) | Fuente: Medscape | Fuente primaria | Towers 1999 ([doi](https://doi.org/10.1016/s0002-9378(99)70053-0)) |
| Aspirina junto con rTPA | Fuente sin el ensayo que la sostiene | Se añade ARTIS | Zinkstok, Lancet 2012 ([doi](https://doi.org/10.1016/S0140-6736(12)60949-0)) |
| SAD PERSONS como único criterio | NICE (no indexado) | Se añade estudio de precisión: AUC 51 % | Steeg 2018 ([doi](https://doi.org/10.1186/s12888-018-1693-z)) |

Hoja `Correcciones`:
- **Crup (CRUP_001_002):** el comentario decía "este paciente tiene tos perruna" y ese escenario no la menciona. Se corrigió. También se corrigieron dos erratas de la tríada ("tipe" → "tipo", "hiponía" → "disfonía").
- **Apendicitis (Marta, 20 años):** el comentario ahora dice que no hay sangrado transvaginal. **Pendiente para el revisor:** si conviene enseñar que en una mujer en edad fértil se pide prueba de embarazo. No lo añadí porque no localicé una guía que lo diga de forma explícita.
- **Adenitis mesentérica (José, 32 años):** el comentario corresponde al paciente. Se aprueba.

## Lo que un médico debe mirar primero

1. **Las 8 filas con `Fuente verificada = No`:** terbutalina en la atonía, tocólisis en la corioamnionitis, diazepam frente a sulfato de magnesio, sonda nasogástrica en el choque por deshidratación, cirugía de píloro antes de corregir la alcalosis, límite de fármaco al alta con riesgo suicida y monitoreo de neutrófilos con clozapina. Las conductas son estándar, pero sus citas no se pudieron comprobar. La de píloro cita un "AAP Clinical Report" que no aparece en PubMed.
2. **El nimodipino:** la carta dice que va por vía oral. En Europa también se usa en infusión IV continua; lo que se evita es el bolo. El comentario no lo contradice, pero el revisor puede querer matizarlo.
3. **Las 174 cartas sin riesgo letal:** no se revisaron en esta tanda.

## Cómo se reproduce

```bash
python3 tools/export_review_pack.py cases content_drafts REVISION_CLINICA   # regenera el paquete
python3 tools/fill_review_verdicts.py                                       # vuelve a escribir los veredictos
python3 tools/apply_clinical_review_2026_10.py --check                      # el CI comprueba que las correcciones siguen aplicadas
```
