# Veredictos de la revisión clínica asistida (2026-10-13)

Revisión de las 237 cartas del paquete: las 63 con riesgo letal (hoja `Prioridad (riesgo letal)`), las 174 restantes y las 3 de `Correcciones`. La primera parte describe las 63 de riesgo letal; la sección final, las 174 restantes. Las 63 filas son unas 45 afirmaciones distintas: varias cartas se repiten entre familias (colangitis, neumotórax a tensión, SCACEST, DPPNI).

**Quién y cómo.** La hizo Claude (asistente de IA) contrastando cada afirmación contra PubMed y Consensus, no un médico. Es una primera criba que reduce el trabajo del revisor clínico; no lo sustituye. Los veredictos están en las columnas `Veredicto`, `Corrección sugerida` y `Fuente verificada` de `revision_clinica.xlsx` y `.csv`.

## Resultado

| | Filas |
|---|---|
| Aprobar | 45 |
| Corregir (ya aplicado al juego) | 18 |
| Rechazar | 0 |

Ninguna carta enseña lo contrario de lo que dice la evidencia. Cada carta es una conducta errónea que el jugador debe descartar, y en las 63 esa conducta resultó, en efecto, errónea. Lo que falló en algunas fue el comentario del mentor o la fuente citada.

| Fuente verificada | Filas | Significado |
|---|---|---|
| Sí | 30 | Leí la afirmación en el resumen o el texto completo de la fuente |
| Parcial | 33 | Localicé la guía, pero su texto no estaba disponible para esa afirmación concreta (ATLS es un libro; varias guías de AHA, ESC, ACOG y CDC no tienen texto libre en PubMed Central) |
| No | 0 | Las 8 filas que quedaron sin fuente en la primera pasada se resolvieron en la segunda (ver abajo) |

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

Segunda pasada (fuentes que faltaban). Busqué primero en las GPC mexicanas, pero el entorno no puede abrir dominios `.gob.mx` (IMSS, CENETEC, HRAEI, Edomex), ni `who.int` ni `fda.gov`. Las 8 filas se resolvieron con literatura indexada; las afirmaciones no cambiaron, salvo la de clozapina:

| Carta | Fuente nueva |
|---|---|
| Terbutalina en la atonía | Lee 2020: los tocolíticos aumentan la hemorragia por atonía ([doi](https://doi.org/10.1097/md.0000000000023651)) |
| Tocólisis en la corioamnionitis | CNGOF 2019: ante infección intrauterina, nacimiento temprano, grado A ([doi](https://doi.org/10.1016/j.ejogrb.2019.02.021)) |
| Diazepam frente a sulfato de magnesio | Cochrane, Duley 2010: RR de muerte materna 0.59 ([doi](https://doi.org/10.1002/14651858.CD000127.pub2)) |
| Sonda nasogástrica en el choque (2 filas) | Houston 2019 ([doi](https://doi.org/10.1186/s12916-019-1356-z)) y Maitland 2025 ([doi](https://doi.org/10.1056/NEJMoa2505752)): el choque recibe bolos IV |
| Píloro: cirugía antes de corregir | La fuente citada ("AAP Clinical Report") no existe en PubMed; la sustituyen Gilbertson 2019 ([doi](https://doi.org/10.1213/ane.0000000000004446)) y Spicer 1982 ([doi](https://doi.org/10.1002/bjs.1800690304)) |
| Antidepresivo por 3 meses con riesgo suicida | Mann 2005 ([doi](https://doi.org/10.1001/jama.294.16.2064)) y Zalsman 2016 ([doi](https://doi.org/10.1016/s2215-0366(16)30030-x)): restringir medios letales |
| Neutrófilos con clozapina | Consenso Delphi global, Siskind 2025 ([doi](https://doi.org/10.1016/s2215-0366(25)00098-7)): vigilancia durante los primeros 2 años; el comentario ahora lo dice |

Si se habilitan los dominios del IMSS y del CENETEC en la red del entorno, las 33 filas "Parcial" pueden subir a "Sí" citando la GPC mexicana correspondiente.

Hoja `Correcciones`:
- **Crup (CRUP_001_002):** el comentario decía "este paciente tiene tos perruna" y ese escenario no la menciona. Se corrigió. También se corrigieron dos erratas de la tríada ("tipe" → "tipo", "hiponía" → "disfonía").
- **Apendicitis (Marta, 20 años):** el comentario ahora dice que no hay sangrado transvaginal. **Pendiente para el revisor:** si conviene enseñar que en una mujer en edad fértil se pide prueba de embarazo. No lo añadí porque no localicé una guía que lo diga de forma explícita.
- **Adenitis mesentérica (José, 32 años):** el comentario corresponde al paciente. Se aprueba.

## Lo que un médico debe mirar primero

1. **Las 33 filas `Parcial`:** la guía existe y la conducta es estándar, pero su texto no pudo leerse aquí. Son las candidatas a citar la GPC mexicana.
2. **El nimodipino:** la carta dice que va por vía oral. En Europa también se usa en infusión IV continua; lo que se evita es el bolo. El comentario no lo contradice, pero el revisor puede querer matizarlo.
3. **Las 174 cartas sin riesgo letal:** no se revisaron en esta tanda.

## Cómo se reproduce

```bash
python3 tools/export_review_pack.py cases content_drafts REVISION_CLINICA   # regenera el paquete
python3 tools/fill_review_verdicts.py                                       # vuelve a escribir los veredictos
python3 tools/apply_clinical_review_2026_10.py --check                      # el CI comprueba que las correcciones siguen aplicadas
```


## Las 174 cartas sin riesgo letal

162 afirmaciones distintas (algunas se repiten entre familias). Todas pasaron por la misma criba contra PubMed y Consensus.

| | Filas |
|---|---|
| Aprobar | 166 |
| Corregir (ya aplicado al juego) | 8 |
| Rechazar | 0 |

| Fuente verificada | Filas | Significado |
|---|---|---|
| Sí | 93 | Leí la afirmación en el resumen o el texto de la fuente |
| Parcial | 58 | Localicé la guía o el estudio, pero no pude leer esa afirmación (ATLS, AHA, ESC, ACOG, GINA y ADA no tienen texto libre aquí) |
| Texto estándar | 23 | Definiciones de libro de texto (bioestadística, niveles de prevención, vocabulario inglés-español) que no dependen de una guía |

Tampoco aquí hubo una carta que enseñe algo peligroso. Las ocho correcciones afectaron al comentario del mentor, no a la conducta:

| Carta | Qué decía el comentario | Ahora | Fuente |
|---|---|---|---|
| Ácido tranexámico después de 6 h | "Puede aumentar el riesgo de trombosis" | Después de 3 h puede aumentar la **muerte por sangrado** | CRASH-2 exploratorio, *Lancet* 2011 ([doi](https://doi.org/10.1016/S0140-6736(11)60278-X)): RR 1.44 |
| Contraste hidrosoluble en obstrucción por bridas | "Facilita el paso del contenido… terapéutico" | Sirve para estratificar; el efecto terapéutico es discutido | Scotté 2017 ([doi](https://doi.org/10.1016/j.surg.2016.11.026)) y Walshaw 2025 ([doi](https://doi.org/10.1093/bjs/znaf104)) |
| Bajar la TA <140/90 antes de trombólisis | "Bajarla de más reduce la perfusión de la penumbra" | Bajarla más no mejora el desenlace y retrasa el tratamiento | ESO 2026 ([doi](https://doi.org/10.1093/esj/aakag004)) y ENCHANTED ([doi](https://doi.org/10.1016/s0140-6736(19)30038-8)) |
| Profilaxis antibiótica prolongada en OMA recurrente | "La AAP recomienda no usarla" | Reduce los episodios solo mientras se toma y favorece la resistencia; no es de rutina | Cochrane, Leach 2006 ([doi](https://doi.org/10.1002/14651858.cd004401.pub2)) |
| Quimioprofilaxis en mola | "Solo en riesgo alto o sin seguimiento" | La evidencia es de baja calidad; no es de rutina | Cochrane 2017 ([doi](https://doi.org/10.1002/14651858.cd007289.pub3)) |
| DIU tras evacuar una mola | "Se difiere ≥6 semanas por riesgo de perforación" | Las guías no coinciden; la evidencia no muestra más neoplasia | Gaffield 2009 ([doi](https://doi.org/10.1016/j.contraception.2009.03.022)) y Hagey 2024 ([doi](https://doi.org/10.1016/j.contraception.2024.110488)) |
| Citología anual desde los 18 años | "Inicia a los 25 años" | Entre los 21 y los 25 años según la guía; en México, 25 | USPSTF 2018, ACS 2020 ([doi](https://doi.org/10.3322/caac.21628)) |
| Suspender el sulfato de magnesio al nacer | "Se continúa 24 h" | Estándar de 24 h; algunos ensayos sugieren que periodos más cortos podrían bastar | Vigil-De Gracia 2018 ([doi](https://doi.org/10.1111/1471-0528.15320)) y Okonkwo 2022 ([doi](https://doi.org/10.1097/aog.0000000000004720)) |

**Dos para el revisor médico:** el DIU en mola y el sulfato de magnesio posparto. En ambas la norma mexicana puede ser más estricta que la evidencia; no la cambié, solo quité las afirmaciones que la literatura no sostiene.

## Carta nueva: prueba de embarazo en la apendicitis

A petición del dueño del producto, el caso de Marta (20 años, `PROC_SURG_APPENDICITIS_001_001`) ahora tiene una carta de aceptar: *"Prueba de embarazo (β-hCG): en la mujer en edad fértil con dolor en fosa ilíaca derecha se solicita antes de decidir la conducta, para descartar un embarazo ectópico"*. Fuente: Borthwick, *BMJ* 2022 ([doi](https://doi.org/10.1136/bmj-2021-068020)), β-hCG en orina con sensibilidad de 95.3 % y especificidad de 100 %, y ACR 2023 ([doi](https://doi.org/10.1016/j.jacr.2024.02.014)). El caso pasó de 14 a 15 cartas.
