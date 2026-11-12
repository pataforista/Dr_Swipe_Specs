# Qué hace divertido y qué hace educativo a un juego casual

Revisión del 2026-11-12 para orientar el plan de Dr. Swipe. Responde dos preguntas con la literatura disponible y traduce cada hallazgo en una decisión de diseño.

**Alcance y límites.** Busqué en Consensus y PubMed revisiones sistemáticas y metaanálisis; incluí estudios primarios solo donde no había síntesis (diversión en juegos móviles casuales). Leí resúmenes y, cuando estaban abiertos, fragmentos del texto; no los artículos completos. No es una revisión sistemática propia. Las cifras son las que reportan los autores.

## 1. Lo que dice la evidencia

### 1.1 Diversión

La literatura sobre qué hace disfrutable un juego casual es más delgada de lo que cabría esperar, y casi toda es transversal: encuestas a jugadores, no experimentos.

| Hallazgo | Fuente | Solidez |
|---|---|---|
| En un metaanálisis de decisiones de diseño, **solo la presencia de música** mostró efecto significativo sobre el disfrute. Dificultad y modo de control, los más estudiados, no | Caroux y Pujol, 2023 [1] | Metaanálisis; medidas de disfrute muy heterogéneas |
| En juegos móviles, el disfrute lo explican sobre todo **facilidad de uso, novedad y estética del diseño**. El reto pesó poco | Merikivi et al., 2017 (n = 207) [2] | Transversal |
| En jugadores nuevos, la **facilidad de uso** percibida influye en el disfrute y, por esa vía, en la permanencia | Zhan et al., 2024 (n = 1 375) [3] | Transversal, con datos de uso |
| El modelo GameFlow resume el disfrute en ocho elementos: concentración, reto, habilidad, control, **metas claras, retroalimentación**, inmersión e interacción social | Sweetser y Wyeth, 2005 [4] | Modelo teórico, muy usado |
| En juegos casuales, el disfrute se asocia con interactividad y sensación de presencia | Shafer y Carbonara, 2015 (n = 363) [5] | Transversal |

Lectura prudente: en un juego de sesiones cortas, lo que más se asocia con el disfrute no es la dificultad sino que **se entienda sin esfuerzo, se vea bien y no se repita**.

### 1.2 Aprendizaje

Aquí hay más síntesis, con un patrón constante: los juegos enseñan algo mejor que la instrucción convencional, pero casi nadie ha medido qué elemento del juego produce ese efecto.

| Hallazgo | Fuente | Solidez |
|---|---|---|
| Los juegos serios superan a la instrucción convencional en aprendizaje (d = 0.29). El efecto crece cuando se **combinan con otros métodos**, hay **varias sesiones** y se juega en grupo | Wouters et al., 2013 [6] | Metaanálisis, 77 comparaciones |
| Efecto similar (g = 0.33); las versiones con diseño mejorado superan a la versión base (g = 0.34) | Clark et al., 2016 [7] | Metaanálisis |
| Añadir elementos de diseño mejora el aprendizaje (g = 0.30), y **los elementos pensados para aprender el contenido rinden más que los pensados para la experiencia de juego** | Gui et al., 2023 [8] | Metaanálisis, 44 estudios |
| En profesiones de la salud, los elementos más usados son puntos, historia y retroalimentación. **Ningún estudio evaluó elementos por separado**; no puede concluirse cuál aporta | Aster et al., 2024 [9] | Revisión sistemática, 91 estudios |
| La combinación de evaluación con reto o conflicto aumentó el uso del material de estudio y, a veces, el aprendizaje. Pocos grupos control bien definidos | van Gaalen et al., 2021 [10] | Revisión sistemática, 44 estudios |
| Los juegos serios son al menos tan eficaces como los controles en conocimiento y habilidades. Evidencia de calidad baja o muy baja | Gentry et al., 2019 [11] | Revisión sistemática, 30 ensayos |
| La **retroalimentación inmediata** tuvo efecto grande en habilidades (DME 0.87) y la de resultado, moderado en conocimiento (0.51) | Liu et al., 2025 [12] | Metaanálisis, 8 estudios; enfermería |
| Cinco factores de éxito: historia y producción, realismo, adaptación, interacción y **retroalimentación con análisis posterior** | Ravyse et al., 2017 [13] | Revisión cualitativa, 63 artículos |

Y sobre el mecanismo de fondo de Dr. Swipe, que es recordar bajo prueba y repetir con intervalos:

| Hallazgo | Fuente | Solidez |
|---|---|---|
| Evocar la información supera a reestudiarla en retención (21 de 23 desenlaces) y en transferencia a la clínica (7 de 7) | Green et al., 2018 [14] | Revisión sistemática BEME, 19 estudios |
| Práctica distribuida y de evocación mejoraron calificaciones en 43 de 63 experimentos | Trumble et al., 2024 [15] | Revisión sistemática |
| La repetición espaciada supera al estudio habitual en pruebas objetivas (DME 0.78) | Maye y Hurley, 2026 [16] | Metaanálisis, 13 estudios |
| La educación digital espaciada supera a la concentrada en conocimiento (DME 0.32) | Martinengo et al., 2024 [17] | Metaanálisis, 23 ensayos; riesgo de sesgo alto en la mayoría |

### 1.3 Lo que no encontré

- **Presión de tiempo y aprendizaje:** sin datos suficientes. Ninguna síntesis recuperada la evalúa por separado.
- **Mecánica de deslizar cartas:** sin datos suficientes.
- **Rachas, monedas y cosméticos sobre el aprendizaje:** sin evidencia directa; por [8], lo esperable es que aporten menos que las mecánicas de contenido.

## 2. Cómo queda Dr. Swipe frente a esto

| Principio | Dr. Swipe hoy | Veredicto |
|---|---|---|
| Evocar en lugar de releer [14–16] | Cada carta y cada pregunta obliga a decidir | Fortaleza central |
| Repetición espaciada [16, 17] | SM-2 implementado, pero el repaso es un botón más del inicio | Bien hecho, poco visible |
| Retroalimentación inmediata y explicada [12, 13] | Existe, pero la nota de error se encima con la carta y no se lee; al acertar casi no se explica | Debilidad principal |
| Análisis posterior [13] | Perla y repaso de cartas al final; el repaso se ve cortado | A medias |
| Facilidad de uso [2, 3] | Gesto simple; tutorial de tres láminas de texto; avisos que tapan títulos | Mejorable |
| Estética [2] | Legible pero incoherente (tres estilos) | Mejorable |
| Novedad y variedad [2] | 72 familias; variantes que comparten ~91 % de las cartas | Debilidad |
| Música [1] | Solo efectos por síntesis | Ausente |
| Metas claras [4] | Rango que se agota en dos guardias; sin meta diaria | Debilidad |
| Varias sesiones [6] | Racha diaria | Presente |
| Combinar con otros métodos [6] | La perla cita una guía, sin llevar a ella | Ausente |
| Interacción social [4, 6] | Ninguna | Ausente (y no prioritaria) |
| Medir el aprendizaje [9–11] | Sin medición | Ausente |

## 3. Decisiones que se desprenden

Ordenadas por lo que la evidencia respalda con más fuerza.

| # | Decisión | Respaldo | Efecto en el plan |
|---|---|---|---|
| 1 | **La explicación es la mecánica más importante.** Nota de error legible, con el porqué; al acertar una carta crítica, una línea que diga por qué importaba | [8, 12, 13] | Sube a prioridad máxima (deficiencia B1) |
| 2 | **El repaso espaciado pasa a primer plano.** Cuando hay casos vencidos, el botón principal es "Repasar", no "Iniciar guardia"; el cierre muestra cuándo vuelve cada caso | [14–17] | Nueva tarea; va antes que cosméticos y simulacro |
| 3 | **Entender sin esfuerzo.** Tutorial con una carta de práctica; ningún aviso sobre un título | [2, 3] | Ya previsto; se confirma la prioridad |
| 4 | **La estética no es adorno.** Unificar el estilo es de lo poco asociado con el disfrute en juegos móviles | [2] | Confirma la fase estética antes de publicar |
| 5 | **Variedad antes que volumen.** Reducir variantes casi idénticas y evitar que salgan seguidas | [2] | Refuerza las deficiencias D2 y D3 |
| 6 | **Música ambiente opcional.** Es el único factor con efecto significativo en el metaanálisis de disfrute | [1] | Sube de "opcional" a tarea con prueba en teléfono |
| 7 | **Metas claras y alcanzables.** Rangos repartidos en 150 guardias, meta diaria corta | [4] | Ya decidido; se mantiene |
| 8 | **Puente hacia el estudio.** Al final de la guardia, una lista de "temas para leer hoy" con la guía citada | [6] | Nueva tarea, de bajo costo |
| 9 | **Medir.** Registrar en el dispositivo el acierto por especialidad a lo largo del tiempo y mostrarlo; es la carencia que señalan todas las revisiones | [9–11] | Nueva tarea |
| 10 | **No sobreinvertir en recompensas.** Corregir la economía es necesario; ampliarla con más monedas y cosméticos no tiene respaldo como motor de aprendizaje | [8, 9] | Cosméticos bajan de prioridad |
| 11 | **Dificultad adaptativa, sin prisa.** El reto pesó poco en el disfrute de juegos móviles | [1, 2] | Se mantiene al final |
| 12 | **Reloj: decisión abierta.** Sin datos sobre presión de tiempo; conviene que el Modo Estudio (sin reloj) siga a la vista y probar ambos | Sin datos | Sin cambio; a observar |

## Referencias

1. [Player Enjoyment in Video Games: A Systematic Review and Meta-analysis of the Effects of Game Design Choices](https://consensus.app/papers/details/w:dc5de7de-49a4-4659-bdd2-47d213fb7e99/?utm_source=claude_desktop) (Caroux y Pujol, 2023, International Journal of Human-Computer Interaction). DOI: 10.1080/10447318.2023.2210880
2. [What makes continued mobile gaming enjoyable?](https://consensus.app/papers/details/w:8939fcf7-7f7b-4aeb-a490-98aebbb78cac/?utm_source=claude_desktop) (Merikivi, Tuunainen y Nguyen, 2016, Computers in Human Behavior). DOI: 10.1016/j.chb.2016.11.070
3. [Ease of Use or Fun Perception? Factors Affecting Retention of Newly Registered Mobile Game Players Based on Flow Theory and The Technology Acceptance Model](https://consensus.app/papers/details/w:55e7c10c-1791-4e90-aad1-033402f49da1/?utm_source=claude_desktop) (Zhan et al., 2024). DOI: 10.70003/160792642024072504001
4. [GameFlow](https://consensus.app/papers/details/w:91035552-1a5a-4462-8f21-a5d5ceeeb370/?utm_source=claude_desktop) (Sweetser y Wyeth, 2005, Computers in Entertainment). DOI: 10.1145/1077246.1077253
5. [Examining Enjoyment of Casual Videogames](https://consensus.app/papers/details/w:ee8a42a1-6d86-435c-80f6-e56c3f95b12c/?utm_source=claude_desktop) (Shafer y Carbonara, 2015, Games for Health Journal). DOI: 10.1089/g4h.2015.0012
6. [A meta-analysis of the cognitive and motivational effects of serious games](https://consensus.app/papers/details/w:9176d6f5-8e95-4fe3-a4c0-0d3e8eeb051a/?utm_source=claude_desktop) (Wouters et al., 2013, Journal of Educational Psychology). DOI: 10.1037/a0031311
7. [Digital Games, Design, and Learning](https://consensus.app/papers/details/w:c919ac69-3695-44df-b098-8a5eb5cd1444/?utm_source=claude_desktop) (Clark, Tanner-Smith y Killingsworth, 2015, Review of Educational Research). DOI: 10.3102/0034654315582065
8. [Effectiveness of digital educational game and game design in STEM learning: a meta-analytic review](https://consensus.app/papers/details/w:d17ba85d-556e-4347-84e2-9b6cf96e8b4c/?utm_source=claude_desktop) (Gui et al., 2023, International Journal of STEM Education). DOI: 10.1186/s40594-023-00424-9
9. [Game design elements of serious games in the education of medical and healthcare professions: a mixed-methods systematic review of underlying theories and teaching effectiveness](https://consensus.app/papers/details/w:f4079654-bf1b-42a8-98ef-5c084be57289/?utm_source=claude_desktop) (Aster et al., 2024, Advances in Health Sciences Education). DOI: 10.1007/s10459-024-10327-1
10. Gamification of health professions education: a systematic review (van Gaalen et al., 2021, Advances in Health Sciences Education). Recuperado de PubMed. [DOI: 10.1007/s10459-020-10000-3](https://doi.org/10.1007/s10459-020-10000-3)
11. Serious Gaming and Gamification Education in Health Professions: Systematic Review (Gentry et al., 2019, Journal of Medical Internet Research). Recuperado de PubMed. [DOI: 10.2196/12994](https://doi.org/10.2196/12994)
12. [The impact of feedback elements in serious games on nursing learning outcomes: A systematic review and meta-analysis](https://consensus.app/papers/details/w:3ab301a3-8296-470e-9ca9-80fa98242897/?utm_source=claude_desktop) (Liu et al., 2025, Nurse Education Today). DOI: 10.1016/j.nedt.2025.106689
13. [Success factors for serious games to enhance learning: a systematic review](https://consensus.app/papers/details/w:112821a6-a440-49b1-ba7f-75b90c426f09/?utm_source=claude_desktop) (Ravyse et al., 2016, Virtual Reality). DOI: 10.1007/s10055-016-0298-4
14. [Test-enhanced learning in health professions education: A systematic review: BEME Guide No. 48](https://consensus.app/papers/details/w:4b7fe680-a921-4244-b959-3d32f7b15547/?utm_source=claude_desktop) (Green, Moeller y Spak, 2018, Medical Teacher). DOI: 10.1080/0142159x.2018.1430354
15. [Systematic review of distributed practice and retrieval practice in health professions education](https://consensus.app/papers/details/w:f9d008c1-6a07-4ceb-a0b0-76a619e90139/?utm_source=claude_desktop) (Trumble et al., 2023, Advances in Health Sciences Education). DOI: 10.1007/s10459-023-10274-3
16. [The Effectiveness of Spaced Repetition in Medical Education: A Systematic Review and Meta-Analysis](https://consensus.app/papers/details/w:5d3f315f-8bb7-4918-91f7-39dc9596eb00/?utm_source=claude_desktop) (Maye y Hurley, 2026, The Clinical Teacher). DOI: 10.1111/tct.70353
17. [Spaced Digital Education for Health Professionals: Systematic Review and Meta-Analysis](https://consensus.app/papers/details/w:1ac5c0bf-aae8-4ab4-a9af-017816820776/?utm_source=claude_desktop) (Martinengo et al., 2024, Journal of Medical Internet Research). DOI: 10.2196/57760
