"""Verdicts for the 174 non-lethal cards of REVISION_CLINICA (2026-10-13).

Generated from a PubMed/Consensus review (done by Claude, not a physician).
verified: "Sí" = the statement was read in a retrieved abstract or full text;
"Parcial" = the guideline/study was located but not readable for this
statement; "Texto estándar" = textbook definition that needs no guideline.
Entries with "comment" rewrite the mentor comment (apply_clinical_review_2026_10.py);
entries with "fuente" replace the draft's source line.
"""

NONLETHAL = [
 {
  "prefix": "Sensibilidad y Prevalencia: Si la prevalencia de la enfermed",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Definición de libro de texto (bioestadística)"
 },
 {
  "prefix": "Valor Predictivo Positivo (VPP): Se calcula como VP / (VP + ",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Definición de libro de texto (bioestadística)"
 },
 {
  "prefix": "Prueba Muy Específica: Si su resultado es NEGATIVO, descarta",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Definición de libro de texto (bioestadística)"
 },
 {
  "prefix": "LR (+) igual a 1: Un cociente de probabilidad positivo de 1 ",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Definición de libro de texto (bioestadística)"
 },
 {
  "prefix": "Área bajo la curva de 0.5: Indica una prueba con capacidad d",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Definición de libro de texto (bioestadística)"
 },
 {
  "prefix": "Prueba de Tamizaje: Para tamizaje poblacional se elige la pr",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Definición de libro de texto (bioestadística)"
 },
 {
  "prefix": "Aspirina 81 mg como dosis inicial: Esquema de carga en el IA",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ACC/AHA y ESC STEMI localizadas, sin texto: dosis de carga estándar"
 },
 {
  "prefix": "Reperfusión solo si el dolor lleva menos de 3 horas: Pasada ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ACC/AHA y ESC STEMI localizadas, sin texto"
 },
 {
  "prefix": "Diferir la estatina hasta el alta: Se prefiere esperar a que",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ACC/AHA y ESC STEMI localizadas, sin texto"
 },
 {
  "prefix": "Antibióticos posoperatorios por 7 días tras apendicectomía d",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "WSES 2020 (doi:10.1186/s13017-020-00306-3): se recomienda no dar antibióticos posoperatorios en la apendicitis no complicada (1A)",
  "fuente": "WSES 2020 (doi:10.1186/s13017-020-00306-3): se recomienda no dar antibióticos posoperatorios en la apendicitis no complicada (1A)"
 },
 {
  "prefix": "Retrasar los analgésicos para no enmascarar la exploración: ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Poonai 2014 (doi:10.1111/acem.12509): sin aumento de perforación ni absceso con opioides en niños; evidencia de calidad baja y solo pediátrica"
 },
 {
  "prefix": "Ultrasonido sin visualizar el apéndice: Resultado suficiente",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "WSES 2020: el apéndice no visualizado es frecuente (34-71 %) y se sigue con RM/TC",
  "fuente": "WSES 2020: el apéndice no visualizado es frecuente (34-71 %) y se sigue con RM/TC"
 },
 {
  "prefix": "Operar sin antibiótico preoperatorio: La profilaxis solo se ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "WSES 2020: una dosis preoperatoria de antibiótico de amplio espectro en toda apendicectomía",
  "fuente": "WSES 2020: una dosis preoperatoria de antibiótico de amplio espectro en toda apendicectomía"
 },
 {
  "prefix": "Pericardiocentesis subxifoidea: Procedimiento inmediato por ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ATLS no está indexado en PubMed"
 },
 {
  "prefix": "Vía biliar sin dilatación en el ultrasonido: Descarta la col",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "TG18 localizada (doi:10.1002/jhbp.509), texto no disponible para esta afirmación"
 },
 {
  "prefix": "Cirugía inmediata en toda obstrucción por bridas sin signos ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Walshaw 2025 (doi:10.1093/bjs/znaf104): el manejo no quirúrgico tiene éxito en >70 % y los retrasos >72 h aumentan la morbilidad",
  "fuente": "Walshaw 2025 (doi:10.1093/bjs/znaf104): el manejo no quirúrgico tiene éxito en >70 % y los retrasos >72 h aumentan la morbilidad"
 },
 {
  "prefix": "Contraste hidrosoluble contraindicado en la obstrucción por ",
  "verdict": "Corregir",
  "verified": "Sí",
  "note": "Solo el comentario: el efecto terapéutico del contraste es discutido (Scotté 2017, doi:10.1016/j.surg.2016.11.026); su valor predictivo es moderado (Walshaw 2025)",
  "comment": "El contraste hidrosoluble oral no está contraindicado en la obstrucción por bridas sin signos de isquemia. Sirve para estratificar (si llega al colon predice resolución), aunque su efecto terapéutico es discutido.",
  "fuente": "el efecto terapéutico del contraste es discutido (Scotté 2017, doi:10.1016/j.surg.2016.11.026); su valor predictivo es moderado (Walshaw 2025)"
 },
 {
  "prefix": "Dieta líquida oral durante la fase conservadora: Mantiene el",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Walshaw 2025: descompresión nasogástrica, reposición hidroelectrolítica y ayuno en el manejo inicial",
  "fuente": "Walshaw 2025: descompresión nasogástrica, reposición hidroelectrolítica y ayuno en el manejo inicial"
 },
 {
  "prefix": "Ácido tranexámico después de las primeras 6 horas del trauma",
  "verdict": "Corregir",
  "verified": "Sí",
  "note": "Solo el comentario: CRASH-2 exploratorio (Lancet 2011, doi:10.1016/S0140-6736(11)60278-X): después de 3 h, RR 1.44 de muerte por sangrado; no se describe riesgo de trombosis",
  "comment": "El ácido tranexámico se da lo antes posible y dentro de las primeras 3 horas. Después de 3 horas no ayuda y puede aumentar la muerte por sangrado.",
  "fuente": "CRASH-2 exploratorio (Lancet 2011, doi:10.1016/S0140-6736(11)60278-X): después de 3 h, RR 1.44 de muerte por sangrado; no se describe riesgo de trombosis"
 },
 {
  "prefix": "Hipotermia permisiva en el paciente con hemorragia grave: Re",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ATLS (tríada letal) no indexado"
 },
 {
  "prefix": "Doxiciclina oral como único tratamiento sostenido: Esquema s",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "AAD 2024 (doi:10.1016/j.jaad.2023.12.017): limitar los antibióticos sistémicos y combinarlos con tratamiento tópico; isotretinoína para acné grave o refractario",
  "fuente": "AAD 2024 (doi:10.1016/j.jaad.2023.12.017): limitar los antibióticos sistémicos y combinarlos con tratamiento tópico; isotretinoína para acné grave o refractario"
 },
 {
  "prefix": "Isotretinoína oral como primera línea en el acné comedoniano",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "AAD 2024 (doi:10.1016/j.jaad.2023.12.017): limitar los antibióticos sistémicos y combinarlos con tratamiento tópico; isotretinoína para acné grave o refractario",
  "fuente": "AAD 2024 (doi:10.1016/j.jaad.2023.12.017): limitar los antibióticos sistémicos y combinarlos con tratamiento tópico; isotretinoína para acné grave o refractario"
 },
 {
  "prefix": "Bicarbonato intravenoso con pH de 7.1 para corregir pronto l",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Duhon 2013 (doi:10.1345/aph.1s014) y Wu 2026 (doi:10.1097/md.0000000000047529): la guía reserva el bicarbonato para pH <6.9",
  "fuente": "Duhon 2013 (doi:10.1345/aph.1s014) y Wu 2026 (doi:10.1097/md.0000000000047529): la guía reserva el bicarbonato para pH <6.9"
 },
 {
  "prefix": "Solución salina al 0.45% como líquido inicial de reanimación",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "JBDS localizada; el texto no menciona la concentración de la solución salina"
 },
 {
  "prefix": "Insulina subcutánea como único tratamiento de una CAD grave:",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "JBDS (guía británica de CAD): insulina IV a ritmo fijo hasta resolver la cetosis",
  "fuente": "JBDS (guía británica de CAD): insulina IV a ritmo fijo hasta resolver la cetosis"
 },
 {
  "prefix": "Cirugía de Hartmann de entrada ante un absceso drenable: Pro",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Cirocchi 2023 (doi:10.3390/jcm12175522) y Peery, BMJ 2021 (doi:10.1136/bmj.n72): drenaje percutáneo según tamaño; cirugía ante contaminación peritoneal",
  "fuente": "Cirocchi 2023 (doi:10.3390/jcm12175522) y Peery, BMJ 2021 (doi:10.1136/bmj.n72): drenaje percutáneo según tamaño; cirugía ante contaminación peritoneal"
 },
 {
  "prefix": "Radiografía simple de abdomen para clasificar el estadio de ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Peery, BMJ 2021: la imagen determina la gravedad (no detalla la radiografía simple)"
 },
 {
  "prefix": "Colonoscopia a los 7 días del alta: Se indica para descartar",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Peery, BMJ 2021 (doi:10.1136/bmj.n72): colonoscopia a las 6-8 semanas",
  "fuente": "Peery, BMJ 2021 (doi:10.1136/bmj.n72): colonoscopia a las 6-8 semanas"
 },
 {
  "prefix": "Radiografía simple de abdomen normal: Resultado suficiente p",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "WSES 2022 (doi:10.1186/s13017-022-00443-x): una radiografía negativa no excluye isquemia mesentérica; la angio-TC es el estudio diagnóstico",
  "fuente": "WSES 2022 (doi:10.1186/s13017-022-00443-x): una radiografía negativa no excluye isquemia mesentérica; la angio-TC es el estudio diagnóstico"
 },
 {
  "prefix": "Balón de Sengstaken-Blakemore como primera medida en lugar d",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Baveno VII (doi:10.1016/j.jhep.2021.12.022) 6.5: vasoactivos lo antes posible; el balón es un rescate",
  "fuente": "Baveno VII (doi:10.1016/j.jhep.2021.12.022) 6.5: vasoactivos lo antes posible; el balón es un rescate"
 },
 {
  "prefix": "Biopsia escisional abierta como primer método diagnóstico: S",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "CNGOF 2016 (doi:10.1016/j.ejogrb.2016.02.017): biopsia percutánea para BI-RADS 4-5 (grado B)",
  "fuente": "CNGOF 2016 (doi:10.1016/j.ejogrb.2016.02.017): biopsia percutánea para BI-RADS 4-5 (grado B)"
 },
 {
  "prefix": "Mastografía negativa con masa palpable: El resultado descart",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "ACR Appropriateness Criteria, masas palpables (doi:10.1016/j.jacr.2017.02.033): diagnóstico por imagen y biopsia si hay hallazgo sospechoso",
  "fuente": "ACR Appropriateness Criteria, masas palpables (doi:10.1016/j.jacr.2017.02.033): diagnóstico por imagen y biopsia si hay hallazgo sospechoso"
 },
 {
  "prefix": "Vacuna VPH como Tratamiento: Aplicarla elimina la infección ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Principio de prevención primaria; no se localizó una guía específica"
 },
 {
  "prefix": "Histerectomía: Tratamiento de primera elección para NIC 2-3 ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ASCCP 2019 (doi:10.1097/lgt.0000000000000525) localizada, sin texto"
 },
 {
  "prefix": "Citología Anual desde los 18 años: Tamizaje recomendado en t",
  "verdict": "Corregir",
  "verified": "Sí",
  "note": "Solo el comentario: las guías inician entre los 21 años (USPSTF 2018) y los 25 (ACS 2020), nunca a los 18, y no es anual",
  "comment": "Castillo: El tamizaje con citología no es anual ni empieza a los 18 años: las guías lo inician entre los 21 y los 25 años (en México, a los 25). Antes aumenta los tratamientos innecesarios de lesiones que suelen regresar.",
  "fuente": "las guías inician entre los 21 años (USPSTF 2018) y los 25 (ACS 2020), nunca a los 18, y no es anual"
 },
 {
  "prefix": "Colposcopia en el Embarazo: Está contraindicada; se difiere ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ASCCP 2019 localizada, sin texto"
 },
 {
  "prefix": "Tratamiento sistemático de la pareja masculina en la vaginos",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "CDC ITS 2021 (doi:10.15585/mmwr.rr7004a1): pareja masculina sin beneficio; solo azoles tópicos 7 días en el embarazo; la VB se diagnostica con Amsel o Nugent",
  "fuente": "CDC ITS 2021 (doi:10.15585/mmwr.rr7004a1): pareja masculina sin beneficio; solo azoles tópicos 7 días en el embarazo; la VB se diagnostica con Amsel o Nugent"
 },
 {
  "prefix": "Fluconazol oral en dosis única para la candidiasis vaginal d",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "CDC ITS 2021 (doi:10.15585/mmwr.rr7004a1): pareja masculina sin beneficio; solo azoles tópicos 7 días en el embarazo; la VB se diagnostica con Amsel o Nugent",
  "fuente": "CDC ITS 2021 (doi:10.15585/mmwr.rr7004a1): pareja masculina sin beneficio; solo azoles tópicos 7 días en el embarazo; la VB se diagnostica con Amsel o Nugent"
 },
 {
  "prefix": "Cultivo vaginal de rutina para Gardnerella: Estudio de confi",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "CDC ITS 2021 (doi:10.15585/mmwr.rr7004a1): pareja masculina sin beneficio; solo azoles tópicos 7 días en el embarazo; la VB se diagnostica con Amsel o Nugent",
  "fuente": "CDC ITS 2021 (doi:10.15585/mmwr.rr7004a1): pareja masculina sin beneficio; solo azoles tópicos 7 días en el embarazo; la VB se diagnostica con Amsel o Nugent"
 },
 {
  "prefix": "Esperar el genotipo de resistencia para iniciar el ART: Se e",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Saag 2018 (doi:10.1001/jama.2018.8431): TAR lo antes posible; el genotipo se solicita pero no se espera",
  "fuente": "Saag 2018 (doi:10.1001/jama.2018.8431): TAR lo antes posible; el genotipo se solicita pero no se espera"
 },
 {
  "prefix": "Diferir el ART hasta que el paciente logre abstinencia de dr",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Coffey 2019 (doi:10.1097/qad.0000000000002124): inicio inmediato con 51 % de consumo de sustancias y 92 % de supresión viral",
  "fuente": "Coffey 2019 (doi:10.1097/qad.0000000000002124): inicio inmediato con 51 % de consumo de sustancias y 92 % de supresión viral"
 },
 {
  "prefix": "Ceftriaxona sola como esquema empírico en el adulto de la co",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "IDSA 2004 (doi:10.1086/425368) localizada, sin texto"
 },
 {
  "prefix": "Dexametasona 24 horas después de iniciar el antibiótico: Se ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "de Gans 2002 (doi:10.1056/nejmoa021334): dexametasona 15-20 min antes o junto con la primera dosis de antibiótico",
  "fuente": "de Gans 2002 (doi:10.1056/nejmoa021334): dexametasona 15-20 min antes o junto con la primera dosis de antibiótico"
 },
 {
  "prefix": "Dopamina: Vasopresor de primera línea en el choque séptico.",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Surviving Sepsis 2021 (doi:10.1007/s00134-021-06506-y): norepinefrina de primera línea, no almidones, PAM de 65",
  "fuente": "Surviving Sepsis 2021 (doi:10.1007/s00134-021-06506-y): norepinefrina de primera línea, no almidones, PAM de 65"
 },
 {
  "prefix": "Almidones (Hidroxietil Almidón): Coloide de elección para la",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Surviving Sepsis 2021 (doi:10.1007/s00134-021-06506-y): norepinefrina de primera línea, no almidones, PAM de 65",
  "fuente": "Surviving Sepsis 2021 (doi:10.1007/s00134-021-06506-y): norepinefrina de primera línea, no almidones, PAM de 65"
 },
 {
  "prefix": "Meta de PAM de 85 mmHg: Objetivo inicial de la reanimación e",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Surviving Sepsis 2021 (doi:10.1007/s00134-021-06506-y): norepinefrina de primera línea, no almidones, PAM de 65",
  "fuente": "Surviving Sepsis 2021 (doi:10.1007/s00134-021-06506-y): norepinefrina de primera línea, no almidones, PAM de 65"
 },
 {
  "prefix": "Pruebas Treponémicas para Seguimiento: El FTA-ABS se negativ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "CDC ITS 2021: las pruebas treponémicas suelen quedar reactivas de por vida",
  "fuente": "CDC ITS 2021: las pruebas treponémicas suelen quedar reactivas de por vida"
 },
 {
  "prefix": "Respuesta Adecuada: Basta con que el VDRL baje una dilución ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "CDC ITS 2021: respuesta = caída de cuatro veces en 12 meses",
  "fuente": "CDC ITS 2021: respuesta = caída de cuatro veces en 12 meses"
 },
 {
  "prefix": "Ceftriaxona IM Dosis Única: Tratamiento de elección para la ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "CDC ITS 2021: ceftriaxona 500 mg IM para gonorrea; penicilina G benzatínica 2.4 MU para sífilis",
  "fuente": "CDC ITS 2021: ceftriaxona 500 mg IM para gonorrea; penicilina G benzatínica 2.4 MU para sífilis"
 },
 {
  "prefix": "Embarrassed: Significa 'Embarazada'.",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Vocabulario médico inglés-español de diccionario"
 },
 {
  "prefix": "Injury: Significa 'Injuria', es decir, un insulto u ofensa.",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Vocabulario médico inglés-español de diccionario"
 },
 {
  "prefix": "Rash: Significa 'Raspón' o abrasión de la piel.",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Vocabulario médico inglés-español de diccionario"
 },
 {
  "prefix": "Physician: Significa 'Físico', el especialista en física.",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Vocabulario médico inglés-español de diccionario"
 },
 {
  "prefix": "Sensible: 'Sensible abdomen' describe un abdomen doloroso a ",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Vocabulario médico inglés-español de diccionario"
 },
 {
  "prefix": "Antibiótico de Rutina: Indicado en toda exacerbación asmátic",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "EAACI 2025 (doi:10.1111/all.70091) y Ramakrishnan 2021: los antibióticos no se recomiendan de rutina en la exacerbación",
  "fuente": "EAACI 2025 (doi:10.1111/all.70091) y Ramakrishnan 2021: los antibióticos no se recomiendan de rutina en la exacerbación"
 },
 {
  "prefix": "Espirometría Normal: Descarta el diagnóstico de asma.",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "GINA localizada; sin texto"
 },
 {
  "prefix": "Glucosa en Ayuno Única: Una sola cifra de 128 mg/dL en un pa",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ADA Standards of Care 2024 (doi:10.2337/dc24-s002) localizada, sin texto"
 },
 {
  "prefix": "HbA1c en Hemoglobinopatías: Es igual de confiable para diagn",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ADA Standards of Care 2024 (doi:10.2337/dc24-s002) localizada, sin texto"
 },
 {
  "prefix": "CTOG con 100 g: Carga oral de 100 g de glucosa para diagnost",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ADA Standards of Care 2024 (doi:10.2337/dc24-s002) localizada, sin texto"
 },
 {
  "prefix": "Insulina para Todos: Tratamiento inicial obligatorio en todo",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ADA Standards of Care 2024 (doi:10.2337/dc24-s002) localizada, sin texto"
 },
 {
  "prefix": "Pioglitazona: Opción segura para el control glucémico en el ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Nesti 2021 (doi:10.1186/s12933-021-01294-7): la pioglitazona aumenta la hospitalización por IC por retención de líquidos; ESC 2021 localizada",
  "fuente": "Nesti 2021 (doi:10.1186/s12933-021-01294-7): la pioglitazona aumenta la hospitalización por IC por retención de líquidos; ESC 2021 localizada"
 },
 {
  "prefix": "AINE (Naproxeno): Analgésico de elección para el dolor artic",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Holt 2023 (doi:10.1016/j.jacc.2023.02.027): los AINE se asocian a hospitalización por IC (OR 1.43)",
  "fuente": "Holt 2023 (doi:10.1016/j.jacc.2023.02.027): los AINE se asocian a hospitalización por IC (OR 1.43)"
 },
 {
  "prefix": "Digoxina: Fármaco de primera línea porque reduce la mortalid",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "DIG original: sin efecto en mortalidad; análisis post hoc (Ahmed 2005, doi:10.1093/eurheartj/ehi687) matiza según concentración"
 },
 {
  "prefix": "Atenolol: Betabloqueador con beneficio demostrado en mortali",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ESC 2021 (doi:10.1093/eurheartj/ehab368) localizada, sin texto"
 },
 {
  "prefix": "IECA más ARA-II como combinación inicial: Doble bloqueo del ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Makani 2013 (doi:10.1136/bmj.f360): el doble bloqueo no reduce la mortalidad y aumenta hiperpotasemia, hipotensión e insuficiencia renal",
  "fuente": "Makani 2013 (doi:10.1136/bmj.f360): el doble bloqueo no reduce la mortalidad y aumenta hiperpotasemia, hipotensión e insuficiencia renal"
 },
 {
  "prefix": "Dímero D Normal en Probabilidad Alta: Descarta TEP aunque la",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "ACEP 2018 (doi:10.1016/j.annemergmed.2018.03.006): el dímero D se aplica a probabilidad baja o intermedia",
  "fuente": "ACEP 2018 (doi:10.1016/j.annemergmed.2018.03.006): el dímero D se aplica a probabilidad baja o intermedia"
 },
 {
  "prefix": "Radiografía de Tórax Normal: Descarta tromboembolia pulmonar",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Duffett, BMJ 2020 (doi:10.1136/bmj.m2177) y ESC 2019 localizadas, sin texto para esta afirmación"
 },
 {
  "prefix": "Warfarina sola desde el Día 1: Iniciar antagonista de vitami",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Duffett, BMJ 2020 (doi:10.1136/bmj.m2177) y ESC 2019 localizadas, sin texto para esta afirmación"
 },
 {
  "prefix": "Papanicolaou (Prevención Primaria): El tamizaje citológico e",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Niveles de prevención de Leavell y Clark; definición de texto"
 },
 {
  "prefix": "Rehabilitación (Prevención Secundaria): Recuperar la función",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Niveles de prevención de Leavell y Clark; definición de texto"
 },
 {
  "prefix": "Prevención Cuaternaria: Realizar todos los estudios disponib",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Niveles de prevención de Leavell y Clark; definición de texto"
 },
 {
  "prefix": "Periodo Prepatogénico: Etapa en la que ya existe lesión tisu",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Niveles de prevención de Leavell y Clark; definición de texto"
 },
 {
  "prefix": "Educación para la salud: Corresponde al nivel de prevención ",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Niveles de prevención de Leavell y Clark; definición de texto"
 },
 {
  "prefix": "Limitación del daño: Pertenece al nivel de prevención primar",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Niveles de prevención de Leavell y Clark; definición de texto"
 },
 {
  "prefix": "Aplicar toda la inmunoglobulina por vía intramuscular glútea",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ACIP 2008 (PMID 18496505) localizada; el resumen no detalla la infiltración"
 },
 {
  "prefix": "Punción lumbar inmediata antes de cualquier imagen: Se obtie",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Perry 2019 (doi:10.1161/strokeaha.119.026969): TC primero; punción lumbar si la TC es negativa y pasaron más de 6 h",
  "fuente": "Perry 2019 (doi:10.1161/strokeaha.119.026969): TC primero; punción lumbar si la TC es negativa y pasaron más de 6 h"
 },
 {
  "prefix": "Tomografía normal a las 24 horas del inicio: Resultado sufic",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Aaseth 2024 (doi:10.1111/ene.16385) y Perry 2019: una TC normal dentro de 6 h descarta HSA; después, no",
  "fuente": "Aaseth 2024 (doi:10.1111/ene.16385) y Perry 2019: una TC normal dentro de 6 h descarta HSA; después, no"
 },
 {
  "prefix": "Bajar la TA a menos de 140/90: Requisito antes de iniciar la",
  "verdict": "Corregir",
  "verified": "Sí",
  "note": "Solo el comentario: ESO 2026 (doi:10.1093/esj/aakag004) <185/110 antes y <180/105 durante 24 h; ENCHANTED (doi:10.1016/s0140-6736(19)30038-8): bajar más no mejora el desenlace",
  "comment": "Mendoza: Para trombolizar basta con TA menor de 185/110 y mantenerla menor de 180/105 durante las siguientes 24 horas. Bajarla más de lo necesario no mejora el desenlace y retrasa el tratamiento.",
  "fuente": "ESO 2026 (doi:10.1093/esj/aakag004) <185/110 antes y <180/105 durante 24 h; ENCHANTED (doi:10.1016/s0140-6736(19)30038-8): bajar más no mejora el desenlace"
 },
 {
  "prefix": "Heparina Plena Urgente: Indicada de rutina en el EVC isquémi",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "AHA/ASA 2019 (doi:10.1161/STR.0000000000000211) y ESO 2021 (doi:10.1177/2396987321989865) localizadas, sin texto para esta afirmación"
 },
 {
  "prefix": "Esperar la Resonancia: Obtener RM antes de decidir la trombó",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "AHA/ASA 2019 (doi:10.1161/STR.0000000000000211) y ESO 2021 (doi:10.1177/2396987321989865) localizadas, sin texto para esta afirmación"
 },
 {
  "prefix": "Glibenclamida como primera elección farmacológica: Hipogluce",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Balsells, BMJ 2015 (doi:10.1136/bmj.h102) y Sénat, JAMA 2018 (doi:10.1001/jama.2018.4072): la glibenclamida no debe ser primera línea",
  "fuente": "Balsells, BMJ 2015 (doi:10.1136/bmj.h102) y Sénat, JAMA 2018 (doi:10.1001/jama.2018.4072): la glibenclamida no debe ser primera línea"
 },
 {
  "prefix": "Cesárea electiva sistemática por diabetes gestacional: Indic",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ACOG localizada sin texto; práctica obstétrica estándar"
 },
 {
  "prefix": "Hemoglobina glucosilada a las 28 semanas: Prueba suficiente ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ACOG localizada sin texto; práctica obstétrica estándar"
 },
 {
  "prefix": "Legrado uterino instrumental como método de elección en el a",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ACOG localizada sin texto; práctica obstétrica estándar"
 },
 {
  "prefix": "Parto Vaginal Contraindicado: Todo DPPNI se resuelve por ces",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ACOG localizada sin texto; práctica obstétrica estándar"
 },
 {
  "prefix": "Ácido Fólico con Metotrexato: Se indica el suplemento para r",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ACOG PB 193 (doi:10.1097/AOG.0000000000002560) localizada; sin texto sobre ácido fólico"
 },
 {
  "prefix": "Ibuprofeno para el Dolor: Analgésico de elección durante el ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "ACOG PB 193 localizada; sin texto sobre AINE"
 },
 {
  "prefix": "Descenso de 10% de la hCG (día 4 a día 7): Se considera resp",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Kirk 2007 (doi:10.1093/humrep/del433): descenso >15 % entre los días 4 y 7 predice éxito",
  "fuente": "Kirk 2007 (doi:10.1093/humrep/del433): descenso >15 % entre los días 4 y 7 predice éxito"
 },
 {
  "prefix": "hCG Inicial Alta: La tasa de éxito del metotrexato es la mis",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Alur-Gupta 2019 (doi:10.1097/ogx.0000000000000750): hCG alta se asocia a menor éxito con dosis única"
 },
 {
  "prefix": "DIU Inmediato: Colocarlo tras la evacuación como método anti",
  "verdict": "Corregir",
  "verified": "Sí",
  "note": "Solo el comentario: hay desacuerdo entre guías (RCOG 2010 vs OMS/CDC); la evidencia (Gaffield 2009, doi:10.1016/j.contraception.2009.03.022; Hagey 2024, doi:10.1016/j.contraception.2024.110488) no muestra más neoplasia con DIU. Se sugiere confirmación médica",
  "comment": "Castillo: El DIU suele diferirse hasta que la hCG sea normal por el riesgo de perforación y sangrado; las guías no coinciden y la evidencia no muestra más neoplasia con él. En el seguimiento se prefieren métodos hormonales o de barrera.",
  "fuente": "hay desacuerdo entre guías (RCOG 2010 vs OMS/CDC); la evidencia (Gaffield 2009, doi:10.1016/j.contraception.2009.03.022; Hagey 2024, doi:10.1016/j.contraception.2024.110488) no muestra más neoplasia con DIU. Se sugiere confirmación médica"
 },
 {
  "prefix": "Quimioprofilaxis de Rutina: Administrar metotrexato a toda p",
  "verdict": "Corregir",
  "verified": "Sí",
  "note": "Solo el comentario: Cochrane 2017 (doi:10.1002/14651858.cd007289.pub3): la quimioprofilaxis no puede recomendarse por la baja calidad de la evidencia",
  "comment": "Castillo: La quimioprofilaxis no es de rutina: la evidencia es de baja calidad y puede retrasar el diagnóstico del tumor y aumentar la resistencia a la quimioterapia. Solo se discute en la mola completa de alto riesgo.",
  "fuente": "Cochrane 2017 (doi:10.1002/14651858.cd007289.pub3): la quimioprofilaxis no puede recomendarse por la baja calidad de la evidencia"
 },
 {
  "prefix": "Anti-D en Mola: No se requiere inmunoglobulina porque la mol",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Soper 2021 (doi:10.1097/aog.0000000000004240) localizada, sin texto para esta afirmación"
 },
 {
  "prefix": "Legrado Instrumental Cortante: Método de elección para evacu",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Soper 2021 (doi:10.1097/aog.0000000000004240) localizada, sin texto para esta afirmación"
 },
 {
  "prefix": "Ácido Tranexámico Tardío: Ofrece el mismo beneficio si se ad",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "FIGO 2022 (doi:10.1002/ijgo.14116): ácido tranexámico en las primeras 3 h; la histerectomía es la última opción quirúrgica",
  "fuente": "FIGO 2022 (doi:10.1002/ijgo.14116): ácido tranexámico en las primeras 3 h; la histerectomía es la última opción quirúrgica"
 },
 {
  "prefix": "Histerectomía Inmediata: Primera medida ante atonía uterina ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "FIGO 2022 (doi:10.1002/ijgo.14116): ácido tranexámico en las primeras 3 h; la histerectomía es la última opción quirúrgica",
  "fuente": "FIGO 2022 (doi:10.1002/ijgo.14116): ácido tranexámico en las primeras 3 h; la histerectomía es la última opción quirúrgica"
 },
 {
  "prefix": "Útero Contraído: Si el útero está bien contraído, no es nece",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "FIGO 2022 localizada; las 4 T son un recurso mnemotécnico estándar"
 },
 {
  "prefix": "Cesárea Inmediata: El diagnóstico de corioamnionitis es, por",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Conde-Agudelo 2020 (doi:10.1016/j.ajog.2020.09.044) y Jung 2023 (doi:10.1016/j.ajog.2023.02.002): ampicilina más gentamicina, antibiótico intraparto, cesárea solo por indicación obstétrica",
  "fuente": "Conde-Agudelo 2020 (doi:10.1016/j.ajog.2020.09.044) y Jung 2023 (doi:10.1016/j.ajog.2023.02.002): ampicilina más gentamicina, antibiótico intraparto, cesárea solo por indicación obstétrica"
 },
 {
  "prefix": "Diferir Antibióticos: Esperar hemocultivos y cultivo de líqu",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Conde-Agudelo 2020 (doi:10.1016/j.ajog.2020.09.044) y Jung 2023 (doi:10.1016/j.ajog.2023.02.002): ampicilina más gentamicina, antibiótico intraparto, cesárea solo por indicación obstétrica",
  "fuente": "Conde-Agudelo 2020 (doi:10.1016/j.ajog.2020.09.044) y Jung 2023 (doi:10.1016/j.ajog.2023.02.002): ampicilina más gentamicina, antibiótico intraparto, cesárea solo por indicación obstétrica"
 },
 {
  "prefix": "Clindamicina en Monoterapia: Esquema de primera línea para c",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Conde-Agudelo 2020 (doi:10.1016/j.ajog.2020.09.044) y Jung 2023 (doi:10.1016/j.ajog.2023.02.002): ampicilina más gentamicina, antibiótico intraparto, cesárea solo por indicación obstétrica",
  "fuente": "Conde-Agudelo 2020 (doi:10.1016/j.ajog.2020.09.044) y Jung 2023 (doi:10.1016/j.ajog.2023.02.002): ampicilina más gentamicina, antibiótico intraparto, cesárea solo por indicación obstétrica"
 },
 {
  "prefix": "Amniocentesis Obligatoria: Se requiere un cultivo de líquido",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Conde-Agudelo 2020 (doi:10.1016/j.ajog.2020.09.044) y Jung 2023 (doi:10.1016/j.ajog.2023.02.002): ampicilina más gentamicina, antibiótico intraparto, cesárea solo por indicación obstétrica",
  "fuente": "Conde-Agudelo 2020 (doi:10.1016/j.ajog.2020.09.044) y Jung 2023 (doi:10.1016/j.ajog.2023.02.002): ampicilina más gentamicina, antibiótico intraparto, cesárea solo por indicación obstétrica"
 },
 {
  "prefix": "Antipiréticos como Tratamiento: Controlar la fiebre con para",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Conde-Agudelo 2020 (doi:10.1016/j.ajog.2020.09.044) y Jung 2023 (doi:10.1016/j.ajog.2023.02.002): ampicilina más gentamicina, antibiótico intraparto, cesárea solo por indicación obstétrica",
  "fuente": "Conde-Agudelo 2020 (doi:10.1016/j.ajog.2020.09.044) y Jung 2023 (doi:10.1016/j.ajog.2023.02.002): ampicilina más gentamicina, antibiótico intraparto, cesárea solo por indicación obstétrica"
 },
 {
  "prefix": "Suspender el sulfato de magnesio al terminar el nacimiento: ",
  "verdict": "Corregir",
  "verified": "Sí",
  "note": "Solo el comentario: 24 h es el esquema estándar; Vigil-De Gracia 2018 (doi:10.1111/1471-0528.15320) y Okonkwo 2022 (doi:10.1097/aog.0000000000004720) sugieren que periodos más cortos podrían bastar. Se sugiere confirmación médica",
  "comment": "Castillo: El riesgo de eclampsia persiste en el posparto, por eso el esquema estándar mantiene el sulfato de magnesio 24 horas después del nacimiento. Algunos ensayos sugieren que periodos más cortos podrían bastar, pero no es la conducta estándar.",
  "fuente": "24 h es el esquema estándar; Vigil-De Gracia 2018 (doi:10.1111/1471-0528.15320) y Okonkwo 2022 (doi:10.1097/aog.0000000000004720) sugieren que periodos más cortos podrían bastar. Se sugiere confirmación médica"
 },
 {
  "prefix": "Enalapril para controlar la crisis hipertensiva del embarazo",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Contraindicación de IECA en el embarazo: práctica estándar; ACOG localizada"
 },
 {
  "prefix": "Nitrazina con Sangre: Un papel azul confirma la ruptura aunq",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "SOGC 430 (doi:10.1016/j.jogc.2022.08.014) localizada, sin texto"
 },
 {
  "prefix": "Helecho con Moco Cervical: Tomar la muestra del cérvix mejor",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "SOGC 430 (doi:10.1016/j.jogc.2022.08.014) localizada, sin texto"
 },
 {
  "prefix": "Antibióticos solo 48 horas: Es suficiente con la fase intrav",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Navathe 2019 (doi:10.1016/j.ajog.2019.03.009) y CNGOF 2019 (doi:10.1016/j.ejogrb.2019.02.021): ampicilina más macrólido 48 h y luego vía oral hasta 7 días",
  "fuente": "Navathe 2019 (doi:10.1016/j.ajog.2019.03.009) y CNGOF 2019 (doi:10.1016/j.ejogrb.2019.02.021): ampicilina más macrólido 48 h y luego vía oral hasta 7 días"
 },
 {
  "prefix": "Dilatar la pupila para explorar el fondo de ojo: Estudio pri",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Práctica estándar; AAO localizada"
 },
 {
  "prefix": "Iridotomía láser inmediata como único tratamiento del ataque",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Lam 2002 (doi:10.1016/s0161-6420(02)01158-2): tratamiento médico para bajar la presión mientras se prepara la iridotomía",
  "fuente": "Lam 2002 (doi:10.1016/s0161-6420(02)01158-2): tratamiento médico para bajar la presión mientras se prepara la iridotomía"
 },
 {
  "prefix": "Pilocarpina intensiva como medida principal con presión intr",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Lam 2002: la pilocarpina forma parte del tratamiento inicial; su ineficacia con presión muy alta es enseñanza estándar"
 },
 {
  "prefix": "Cabeza hacia Atrás: Inclinar la cabeza hacia atrás mientras ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "AAO-HNSF 2020 (doi:10.1177/0194599819890327): compresión firme en el tercio inferior de la nariz; la guía no detalla la posición de la cabeza"
 },
 {
  "prefix": "Cauterización Bilateral: Cauterizar ambos lados del tabique ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "AAO-HNSF 2020: el cauterio se limita al sitio o sitios de sangrado",
  "fuente": "AAO-HNSF 2020: el cauterio se limita al sitio o sitios de sangrado"
 },
 {
  "prefix": "Coagulación de Rutina: Solicitar TP y TTP a todo paciente co",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "AAO-HNSF 2020: la guía pide documentar factores de sangrado; no menciona estudios de coagulación de rutina"
 },
 {
  "prefix": "Suspender el Anticoagulante: Primera medida en todo paciente",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "AAO-HNSF 2020: sin sangrado que ponga en riesgo la vida, los tratamientos de primera línea van antes de revertir o suspender el anticoagulante",
  "fuente": "AAO-HNSF 2020: sin sangrado que ponga en riesgo la vida, los tratamientos de primera línea van antes de revertir o suspender el anticoagulante"
 },
 {
  "prefix": "Azitromicina: Antibiótico de primera línea para la OMA del l",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Frost 2022 (doi:10.1016/j.jpeds.2022.07.053): menos fracasos con amoxicilina que con azitromicina",
  "fuente": "Frost 2022 (doi:10.1016/j.jpeds.2022.07.053): menos fracasos con amoxicilina que con azitromicina"
 },
 {
  "prefix": "Observación sin Antibiótico: Opción válida en lactantes meno",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Marchisio 2019 (doi:10.1097/inf.0000000000002452): antibiótico inmediato en menores de 6 meses",
  "fuente": "Marchisio 2019 (doi:10.1097/inf.0000000000002452): antibiótico inmediato en menores de 6 meses"
 },
 {
  "prefix": "Tubos de Ventilación tras el Primer Episodio: Indicados desp",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Hoberman 2021 (doi:10.1056/nejmoa2027278) y AAO-HNSF 2022 (doi:10.1177/01945998211065662): criterios de OMA recurrente",
  "fuente": "Hoberman 2021 (doi:10.1056/nejmoa2027278) y AAO-HNSF 2022 (doi:10.1177/01945998211065662): criterios de OMA recurrente"
 },
 {
  "prefix": "Profilaxis Antibiótica Prolongada: Recomendada para reducir ",
  "verdict": "Corregir",
  "verified": "Sí",
  "note": "Solo el comentario: Leach 2006, Cochrane (doi:10.1002/14651858.cd004401.pub2): la profilaxis prolongada reduce los episodios mientras se toma; no se encontró la recomendación de la AAP que citaba el comentario",
  "comment": "Navarro: La profilaxis antibiótica prolongada reduce los episodios solo mientras se toma, y a cambio favorece la resistencia; no se recomienda de rutina. En la OMA recurrente se valora primero la prevención y, si cumple criterios, los tubos de ventilación.",
  "fuente": "Leach 2006, Cochrane (doi:10.1002/14651858.cd004401.pub2): la profilaxis prolongada reduce los episodios mientras se toma; no se encontró la recomendación de la AAP que citaba el comentario"
 },
 {
  "prefix": "Transfusión: Indicada en todo lactante con Hb menor de 10 g/",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Baker, Pediatrics 2010 (doi:10.1542/peds.2010-2576) localizada, sin texto"
 },
 {
  "prefix": "Hierro con Leche: Administrar el sulfato ferroso junto con l",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Gallahan 2024 (doi:10.3390/nu16223834): la leche de vaca sin modificar reduce la absorción de hierro",
  "fuente": "Gallahan 2024 (doi:10.3390/nu16223834): la leche de vaca sin modificar reduce la absorción de hierro"
 },
 {
  "prefix": "Leche de Vaca antes del Año: Buena fuente de hierro para el ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Zipper 2025 (doi:10.1182/blood-2025-2903): el exceso de leche de vaca es causa principal de anemia ferropénica grave; Baker 2010 localizada",
  "fuente": "Zipper 2025 (doi:10.1182/blood-2025-2903): el exceso de leche de vaca es causa principal de anemia ferropénica grave; Baker 2010 localizada"
 },
 {
  "prefix": "Suspender el Hierro al Normalizar la Hb: Una vez corregida l",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Baker, Pediatrics 2010 localizada, sin texto sobre la duración"
 },
 {
  "prefix": "Exclusión escolar hasta la desaparición del exantema: Medida",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Broliden 2006 (doi:10.1111/j.1365-2796.2006.01697.x): cuadro leve y autolimitado en el niño inmunocompetente; sin texto sobre la exclusión escolar"
 },
 {
  "prefix": "Inmunoglobulina intravenosa: Tratamiento indicado en todo ni",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Broliden 2006: citopenias graves en inmunodeprimidos; sin texto sobre la inmunoglobulina"
 },
 {
  "prefix": "Ribavirina: Antiviral específico que acorta el curso del sar",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "D'Souza 2001, Cochrane (doi:10.1002/14651858.cd001479): vitamina A como tratamiento de sostén; no se localizó una fuente sobre ribavirina"
 },
 {
  "prefix": "Vacuna SRP al séptimo día de la exposición: Profilaxis posex",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Matysiak-Klose 2018 (doi:10.1016/j.vaccine.2018.10.070): inmunoglobulina preferentemente dentro de 6 días; la ventana de 72 h para la vacuna no se leyó en una fuente"
 },
 {
  "prefix": "Vitamina A solo si hay desnutrición: Se reserva para el niño",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "D'Souza 2001 y Fawzi 1993 (doi:10.1001/jama.269.7.898): dos dosis de 200 000 UI reducen la mortalidad; todo paciente con sarampión, con o sin déficit",
  "fuente": "D'Souza 2001 y Fawzi 1993 (doi:10.1001/jama.269.7.898): dos dosis de 200 000 UI reducen la mortalidad; todo paciente con sarampión, con o sin déficit"
 },
 {
  "prefix": "Aciclovir oral por 7 días: Acorta el exantema y previene la ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Principio antiviral: el aciclovir no actúa sobre el Rubivirus; sin fuente específica"
 },
 {
  "prefix": "Suspender la Alimentación: Ayuno hasta que cedan las evacuac",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "ESPGHAN/ESPID 2014 (doi:10.1097/mpg.0000000000000375): rehidratación oral hipoosmolar, alimentación sin cambios, antibióticos solo en casos excepcionales; la vía enteral es superior a la intravenosa",
  "fuente": "ESPGHAN/ESPID 2014 (doi:10.1097/mpg.0000000000000375): rehidratación oral hipoosmolar, alimentación sin cambios, antibióticos solo en casos excepcionales; la vía enteral es superior a la intravenosa"
 },
 {
  "prefix": "Refrescos o Bebidas Deportivas: Alternativa equivalente al V",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "ESPGHAN/ESPID 2014 (doi:10.1097/mpg.0000000000000375): rehidratación oral hipoosmolar, alimentación sin cambios, antibióticos solo en casos excepcionales; la vía enteral es superior a la intravenosa",
  "fuente": "ESPGHAN/ESPID 2014 (doi:10.1097/mpg.0000000000000375): rehidratación oral hipoosmolar, alimentación sin cambios, antibióticos solo en casos excepcionales; la vía enteral es superior a la intravenosa"
 },
 {
  "prefix": "Antibiótico Empírico de Rutina: Indicado en toda diarrea agu",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "ESPGHAN/ESPID 2014 (doi:10.1097/mpg.0000000000000375): rehidratación oral hipoosmolar, alimentación sin cambios, antibióticos solo en casos excepcionales; la vía enteral es superior a la intravenosa",
  "fuente": "ESPGHAN/ESPID 2014 (doi:10.1097/mpg.0000000000000375): rehidratación oral hipoosmolar, alimentación sin cambios, antibióticos solo en casos excepcionales; la vía enteral es superior a la intravenosa"
 },
 {
  "prefix": "Diluir la fórmula a la mitad durante la rehidratación: Se ev",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "ESPGHAN/ESPID 2014 (doi:10.1097/mpg.0000000000000375): rehidratación oral hipoosmolar, alimentación sin cambios, antibióticos solo en casos excepcionales; la vía enteral es superior a la intravenosa",
  "fuente": "ESPGHAN/ESPID 2014 (doi:10.1097/mpg.0000000000000375): rehidratación oral hipoosmolar, alimentación sin cambios, antibióticos solo en casos excepcionales; la vía enteral es superior a la intravenosa"
 },
 {
  "prefix": "Líquidos intravenosos como primera opción en toda deshidrata",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "ESPGHAN/ESPID 2014 (doi:10.1097/mpg.0000000000000375): rehidratación oral hipoosmolar, alimentación sin cambios, antibióticos solo en casos excepcionales; la vía enteral es superior a la intravenosa",
  "fuente": "ESPGHAN/ESPID 2014 (doi:10.1097/mpg.0000000000000375): rehidratación oral hipoosmolar, alimentación sin cambios, antibióticos solo en casos excepcionales; la vía enteral es superior a la intravenosa"
 },
 {
  "prefix": "Hormona de crecimiento en el preescolar con talla baja famil",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Principio clínico: la talla baja familiar es una variante normal; sin fuente específica"
 },
 {
  "prefix": "Curvas del CDC en el menor de 5 años: Referencia estándar de",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "OMS: patrón de crecimiento para <5 años; la literatura discute estándares nacionales (Christesen 2016, doi:10.1371/journal.pone.0157277)"
 },
 {
  "prefix": "Peso para edad como indicador de elección para diagnosticar ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Definición estándar de desnutrición crónica (talla para edad)"
 },
 {
  "prefix": "Talla baja desde -1 desviación estándar para la edad: Umbral",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Christesen 2016 (doi:10.1371/journal.pone.0157277): el umbral clínico de talla baja es -2 DE",
  "fuente": "Christesen 2016 (doi:10.1371/journal.pone.0157277): el umbral clínico de talla baja es -2 DE"
 },
 {
  "prefix": "Oxígeno al 100% desde el inicio de la ventilación en el reci",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Sankaran 2025 (doi:10.1159/000549372): la reanimación del recién nacido inicia con 21 % de oxígeno y se titula; Wang 2008 matiza a los prematuros",
  "fuente": "Sankaran 2025 (doi:10.1159/000549372): la reanimación del recién nacido inicia con 21 % de oxígeno y se titula; Wang 2008 matiza a los prematuros"
 },
 {
  "prefix": "Tamizaje de autismo con M-CHAT a los 6 meses: Edad recomenda",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Sturner 2022 (doi:10.1186/s13229-021-00480-4): el tamizaje de autismo se recomienda a los 18 y 24 meses",
  "fuente": "Sturner 2022 (doi:10.1186/s13229-021-00480-4): el tamizaje de autismo se recomienda a los 18 y 24 meses"
 },
 {
  "prefix": "Vigilancia del desarrollo solo cuando los padres expresan pr",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Lipkin 2019, AAP (doi:10.1542/peds.2019-3449): vigilancia en cada visita y tamizaje estandarizado a edades fijas",
  "fuente": "Lipkin 2019, AAP (doi:10.1542/peds.2019-3449): vigilancia en cada visita y tamizaje estandarizado a edades fijas"
 },
 {
  "prefix": "Sonrisa social a los 6 meses: Hito esperado en esa edad.",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Hito del desarrollo estándar (CDC); sin texto localizado"
 },
 {
  "prefix": "Procinéticos orales como tratamiento definitivo: Se evita la",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Spicer 1982 (doi:10.1002/bjs.1800690304): la cirugía sustituyó al tratamiento médico"
 },
 {
  "prefix": "Amoxicilina-clavulanato: Cobertura empírica indicada por la ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Bjornson 2004 (doi:10.1056/nejmoa033534) respalda el crup como diagnóstico clínico viral tratado con corticoide; la guía de antibióticos y radiografía no se localizó"
 },
 {
  "prefix": "Dexametasona solo si hay estridor en reposo: En el crup leve",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Bjornson 2004 (doi:10.1056/nejmoa033534): la dexametasona reduce las consultas de retorno incluso en el crup leve",
  "fuente": "Bjornson 2004 (doi:10.1056/nejmoa033534): la dexametasona reduce las consultas de retorno incluso en el crup leve"
 },
 {
  "prefix": "Radiografía lateral de cuello antes de tratar: Estudio oblig",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Bjornson 2004 (doi:10.1056/nejmoa033534) respalda el crup como diagnóstico clínico viral tratado con corticoide; la guía de antibióticos y radiografía no se localizó"
 },
 {
  "prefix": "Azitromicina: Antibiótico de primera elección en el preescol",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Bradley 2011 (doi:10.1093/cid/cir531) y Ambroggio 2023 (doi:10.1093/cid/ciad385): la guía enfatiza aminopenicilinas",
  "fuente": "Bradley 2011 (doi:10.1093/cid/cir531) y Ambroggio 2023 (doi:10.1093/cid/ciad385): la guía enfatiza aminopenicilinas"
 },
 {
  "prefix": "Radiografía de tórax de control a las 48 horas: Se solicita ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Ambroggio 2023: la guía IDSA/PIDS restó énfasis a la radiografía y al hemocultivo en pacientes ambulatorios",
  "fuente": "Ambroggio 2023: la guía IDSA/PIDS restó énfasis a la radiografía y al hemocultivo en pacientes ambulatorios"
 },
 {
  "prefix": "Hemocultivo en todo niño con NAC manejado de forma ambulator",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Ambroggio 2023: la guía IDSA/PIDS restó énfasis a la radiografía y al hemocultivo en pacientes ambulatorios",
  "fuente": "Ambroggio 2023: la guía IDSA/PIDS restó énfasis a la radiografía y al hemocultivo en pacientes ambulatorios"
 },
 {
  "prefix": "Chi-Cuadrada: Prueba de elección para comparar Medias de una",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Definiciones estándar de bioestadística"
 },
 {
  "prefix": "Valor p > 0.05: Demuestra que no existe diferencia entre los",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Definiciones estándar de bioestadística"
 },
 {
  "prefix": "Poder Estadístico: Se calcula como 1 - α (alfa).",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Definiciones estándar de bioestadística"
 },
 {
  "prefix": "U de Mann-Whitney: Prueba paramétrica que exige distribución",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Definiciones estándar de bioestadística"
 },
 {
  "prefix": "Correlación de Pearson para variables ordinales o sin distri",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Definiciones estándar de bioestadística"
 },
 {
  "prefix": "Razón de momios cuyo intervalo de confianza al 95% incluye e",
  "verdict": "Aprobar",
  "verified": "Texto estándar",
  "note": "Definiciones estándar de bioestadística"
 },
 {
  "prefix": "Reiniciar todo el esquema de hexavalente por el retraso: Se ",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Principio estándar de vacunación (esquemas retrasados no se reinician); sin fuente específica localizada"
 },
 {
  "prefix": "SRP y varicela aplicadas en días distintos sin intervalo mín",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Kirtland 2019 (doi:10.1016/j.vaccine.2019.09.058) y Zimmermann 2020 (doi:10.1136/archdischild-2020-320091): vacunas vivas el mismo día o con 24-28 días de separación",
  "fuente": "Kirtland 2019 (doi:10.1016/j.vaccine.2019.09.058) y Zimmermann 2020 (doi:10.1136/archdischild-2020-320091): vacunas vivas el mismo día o con 24-28 días de separación"
 },
 {
  "prefix": "Contrato de no suicidio como medida de protección: Se firma ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Bryan 2017 (doi:10.1016/j.jad.2017.01.028) y Kroll 2000 (doi:10.1176/appi.ajp.157.10.1684): sin datos de eficacia de los contratos; el plan de crisis es superior",
  "fuente": "Bryan 2017 (doi:10.1016/j.jad.2017.01.028) y Kroll 2000 (doi:10.1176/appi.ajp.157.10.1684): sin datos de eficacia de los contratos; el plan de crisis es superior"
 },
 {
  "prefix": "Evitar preguntar por suicidio para no inducirlo: Se espera a",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Dazzi 2014 (doi:10.1017/s0033291714001299) y Blades 2018 (doi:10.1016/j.cpr.2018.07.001): preguntar por suicidio no lo induce",
  "fuente": "Dazzi 2014 (doi:10.1017/s0033291714001299) y Blades 2018 (doi:10.1016/j.cpr.2018.07.001): preguntar por suicidio no lo induce"
 },
 {
  "prefix": "Valproato como primera elección en la mujer bipolar en edad ",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Pack 2024, AAN/AES/SMFM (doi:10.1212/wnl.0000000000209279): evitar el valproato en personas con potencial de embarazo",
  "fuente": "Pack 2024, AAN/AES/SMFM (doi:10.1212/wnl.0000000000209279): evitar el valproato en personas con potencial de embarazo"
 },
 {
  "prefix": "Antiinflamatorios no esteroideos para el dolor en el pacient",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Müller-Oerlinghausen 1999 (doi:10.2165/00023210-199911010-00004): los AINE y las tiazidas reducen la depuración renal de litio",
  "fuente": "Müller-Oerlinghausen 1999 (doi:10.2165/00023210-199911010-00004): los AINE y las tiazidas reducen la depuración renal de litio"
 },
 {
  "prefix": "Paracetamol como tratamiento de la hipertermia: Medida sufic",
  "verdict": "Aprobar",
  "verified": "Parcial",
  "note": "Pileggi 2016 (doi:10.1177/1060028016657553): el tratamiento es suspender el antipsicótico, enfriar y dar soporte; sin texto sobre antipiréticos"
 },
 {
  "prefix": "Clozapina como primera línea en el primer episodio: Es el an",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Agid 2024 (doi:10.1016/j.euroneuro.2024.04.012): la clozapina se reserva para esquizofrenia resistente tras dos antipsicóticos",
  "fuente": "Agid 2024 (doi:10.1016/j.euroneuro.2024.04.012): la clozapina se reserva para esquizofrenia resistente tras dos antipsicóticos"
 },
 {
  "prefix": "Suspender el antipsicótico al remitir los síntomas del prime",
  "verdict": "Aprobar",
  "verified": "Sí",
  "note": "Kishi 2026 (doi:10.1016/j.euroneuro.2026.112828): mantener el antipsicótico reduce la recaída hasta 24 meses (RR 0.45)",
  "fuente": "Kishi 2026 (doi:10.1016/j.euroneuro.2026.112828): mantener el antipsicótico reduce la recaída hasta 24 meses (RR 0.45)"
 }
]
