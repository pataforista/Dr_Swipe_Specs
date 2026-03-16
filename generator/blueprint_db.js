const BLUEPRINTS = [
    {
        id: "surg_appendicitis_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [15, 35],
                mood_options: ["dolorido", "ansioso"],
                bio_templates: [
                    "Acude por dolor abdominal de {duration} horas de evolución. Inició periumbilical y migró a Fosa Ilíaca Derecha.",
                    "Refiere dolor punzante en cuadrante inferior derecho desde hace {duration} hrs. Acompañado de náuseas y anorexia."
                ],
                duration_options: ["12", "24", "48"],
                vitals: {
                    TA: ["110/70", "120/80", "130/85"],
                    FC: ["90 lpm", "100 lpm", "110 lpm"],
                    Temp: ["37.8°C", "38.2°C", "38.5°C"]
                },
                details_templates: [
                    "Signo de McBurney Positivo. Rebote dudoso. Leucocitosis de {leucos} mil.",
                    "Psoas y Obturador positivos. Sin antecedentes quirúrgicos. Labs: {leucos} leucos con neutrofilia."
                ],
                leucos_options: ["12", "14", "16"]
            },
            differentials: [
                {
                    title: "A) Apendicitis Aguda",
                    text: "Cuadro clásico de migración del dolor (Cronología de Murphy) y febrícula o fiebre. Requiere abordaje quirúrgico.",
                    is_match: true,
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Match! La cronología, fiebre y signos focales apuntan a apendicitis. La conducta es interconsulta a cirugía.",
                        discard: "Error: Descartar este diagnóstico retrasa una cirugía urgente y aumenta el riesgo de perforación."
                    }
                },
                {
                    title: "B) Gastroenteritis Infecciosa",
                    text: "Dolor abdominal generalizado, fiebre y náuseas. Frecuentemente autolimitado.",
                    is_match: false,
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "La gastroenteritis suele tener diarrea predominante y dolor generalizado, no focalizado en FID profunda.",
                        discard: "¡Buen ojo! La focalización (McBurney) y la leucocitosis alejan el diagnóstico de algo viral autolimitado."
                    }
                },
                {
                    title: "C) Embarazo Ectópico Roto",
                    text: "Dolor pélvico agudo, sangrado transvaginal y datos de choque hipovolémico.",
                    is_match: false,
                    safety_flags: { lethal_risk: true, condition: "female" },
                    feedback: {
                        match: "La TA está estable y no hay factores de riesgo claros mencionados, pero siempre debe descartarse en mujeres en edad fértil con PIE.",
                        discard: "¡Correcto! TA normal y cuadro más compatible con foco infeccioso intestinal."
                    }
                }
            ],
            perla_enarm: {
                title: "Diagnóstico Clínico de Apendicitis",
                text: "El diagnóstico de apendicitis aguda es fundamentalmente CLÍNICO (Escala de Alvarado). La TAC se reserva para casos dudosos, no para cuadros típicos como este.",
                gpc_ref: "GPC Diagnóstico y Tratamiento de Apendicitis Aguda"
            }
        }
    },
    {
        id: "int_ami_001",
        difficulty: "hard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [50, 75],
                mood_options: ["angustiado", "diaforético"],
                bio_templates: [
                    "Paciente diabético llega con dolor torácico opresivo de {duration} minutos. Irradia a mandíbula y brazo izquierdo.",
                    "Cuadro de diaforesis profusa y dolor retroesternal intenso que inició estando en reposo hace {duration} mins."
                ],
                duration_options: ["45", "90", "120"],
                vitals: {
                    TA: ["150/90", "160/100", "90/60 (tendencia al choque)"],
                    FC: ["110 lpm", "115 lpm", "50 lpm (bloqueo)"],
                    Temp: ["36.5°C", "36.8°C"]
                },
                details_templates: [
                    "ECG muestra supra-desnivel del ST en derivaciones {leads}. Tabaquista activo (20 paq/año).",
                    "Elevación del ST en {leads}. Refiere que 'siente que se va a morir' (angor animi). DM2 de 15 años de evolución."
                ],
                leads_options: ["V1-V4 (Antero-septal)", "II, III, aVF (Inferior)"]
            },
            differentials: [
                {
                    title: "A) Infarto Agudo al Miocardio (SCACEST)",
                    text: "Dolor típico, factores de riesgo (DM2) y cambios electrocardiográficos evidentes. Urgencia absoluta.",
                    is_match: true,
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Perfect Match! El cuadro clínico más el ECG con elevación del ST hacen el diagnóstico. ICP primaria en menos de 90 min ideal.",
                        discard: "Error Crítico: El paciente tiene cambios isquémicos activos. Retrasar tratamiento aumenta mortalidad exponencialmente."
                    }
                },
                {
                    title: "B) Costocondritis (Síndrome de Tietze)",
                    text: "Dolor torácico reproducible a la palpación de las articulaciones condrocostales, sin cambios en ECG.",
                    is_match: false,
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "Error. No explica la diaforesis, el ECG alterado ni la irradiación. Podría costar la vida.",
                        discard: "¡Ojo clínico! El dolor reproducible a la palpación casi siempre descarta origen isquémico clásico, aquí el dolor es visceral."
                    }
                },
                {
                    title: "C) Tromboembolia Pulmonar",
                    text: "Disnea súbita, taquicardia, dolor pleurítico, hipoxia severa. S1Q3T3 raro pero posible.",
                    is_match: false,
                    safety_flags: { red_flag: true, lethal_risk: true },
                    feedback: {
                        match: "Aunque es un dolor torácico letal, la presentación clásica del TEP es DISNEA SÚBITA profunda y desaturación, más que dolor opresivo.",
                        discard: "Felicidades por descartarlo. Los cambios ST y el tipo de dolor nos centran en las coronarias."
                    }
                }
            ],
            perla_enarm: {
                title: "Cardiopatía Isquémica: Tiempo es Músculo",
                text: "En un SCACEST, el diagnóstico se hace con clínica + ECG (en <10 min). NO se debe esperar el resultado de las troponinas para activar código infarto ni trombolizar/ICP.",
                gpc_ref: "GPC Infarto Agudo al Miocardio con Elevación del ST"
            }
        }
    },
    {
        id: "ped_exant_measles_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino", "Masculino"],
                age_range: [2, 10],
                mood_options: ["decadente", "febril"],
                bio_templates: [
                    "Niño de {duration} años con fiebre alta, tos, coriza y conjuntivitis. Aparece exantema maculopapular cefalocaudal.",
                    "Paciente preescolar de {duration} años presenta manchas blancas de 1mm en mucosa yugal, seguidas de exantema confluente."
                ],
                duration_options: ["4", "5", "6"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["120 lpm"],
                    Temp: ["39.5°C"]
                },
                details_templates: [
                    "A la exploración: Manchas de Koplik presentes. Exantema que inicia tras las orejas y se extiende al tronco. Tos persistente.",
                    "Cuadro prodrómico de 'triple catarro' (tos, rinitis, conjuntivitis). Exantema morbiliforme confluente."
                ],
            },
            differentials: [
                {
                    title: "A) Sarampión",
                    is_match: true,
                    text: "Virus del Sarampión. Triada: Tos, coriza, conjuntivitis + Manchas de Koplik patognomónicas.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! El 'triple catarro' y las manchas de Koplik son oro puro en el ENARM para Sarampión.",
                        discard: "Error grave: No reconocer Sarampión arriesga brotes comunitarios. Las manchas de Koplik son la clave."
                    }
                },
                {
                    title: "B) Rubéola",
                    is_match: false,
                    text: "Exantema menos confluente, adenopatías retroauriculares dolorosas y manchas de Forchheimer.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. En la rubéola la fiebre es leve y las adenopatías retroauriculares son el dato pivote, no la tos intensa.",
                        discard: "¡Bien! Diferenciaste el cuadro severo del sarampión del más leve de la rubéola."
                    }
                },
                {
                    title: "C) Escarlatina",
                    is_match: false,
                    text: "S. pyogenes. Lengua en fresa, líneas de Pastia y fascies de Filatov. Exantema en lija.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "Falso. La escarlatina no tiene conjuntivitis ni manchas de Koplik, y su exantema tiene textura de 'lija'.",
                        discard: "Correcto. El cuadro respiratorio prodrómico es típico de virus, no de bacterias como el pyogenes."
                    }
                }
            ],
            perla_enarm: {
                title: "Sarampión: Vitamina A",
                text: "Tratamiento Clave: A TODO niño con sarampión se le debe administrar VITAMINA A para reducir complicaciones y mortalidad.",
                gpc_ref: "GPC Prevención, Diagnóstico y Tratamiento del Sarampión"
            }
        }
    },
    {
        id: "ped_exant_varicella_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino", "Masculino"],
                age_range: [1, 12],
                mood_options: ["irritado", "pruriginoso"],
                bio_templates: [
                    "Paciente de {duration} años con lesiones cutáneas pruriginosas en diferentes estadios de evolución.",
                    "Niño de {duration} años presenta exantema que inició en tronco y se extendió a cara. Presenta 'cielo estrellado'."
                ],
                duration_options: ["4", "5", "8"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["90 lpm"],
                    Temp: ["38.2°C"]
                },
                details_templates: [
                    "A la exploración: máculas, pápulas, vesículas y costras que coexisten en la misma región abdominal.",
                    "Fiebre moderada. Las vesículas tienen aspecto de 'gota de rocío'. Prurito intenso referido por la madre."
                ],
            },
            differentials: [
                {
                    title: "A) Varicela (Tratamiento: Paracetamol)",
                    is_match: true,
                    text: "Virus Varicela-Zóster. Pleomorfismo regional (mácula, pápula, vesícula, costra).",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Perfecto! El 'pleomorfismo regional' o 'cielo estrellado' es el término técnico que buscarás en el examen.",
                        discard: "Error: El pleomorfismo regional es patognomónico de Varicela. No lo puedes pasar por alto."
                    }
                },
                {
                    title: "B) Viruela",
                    is_match: false,
                    text: "Lesiones en el mismo estadio de evolución (monomórficas), centrífugas y umbilicadas.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. La viruela está erradicada y sus lesiones son monomórficas (todas iguales), no pleomórficas.",
                        discard: "¡Bien! Reconociste la diferencia clave en el estadio de las lesiones."
                    }
                },
                {
                    title: "C) Varicela (Tratamiento: Ácido Acetilsalicílico)",
                    is_match: false,
                    text: "Uso de Aspirina para mitigar la fiebre intensa en varicela.",
                    safety_flags: { lethal_risk: true, decision_critical: false },
                    feedback: {
                        match: "¡Peligro! El uso de Aspirina en varicela causa Síndrome de Reye (encefalopatía hepática).",
                        discard: "¡Excelente! Evitaste el Síndrome de Reye por salicilatos."
                    }
                }
            ],
            perla_enarm: {
                title: "Varicela: Contraindicado el ASA",
                text: "Prohibido: El uso de Ácido Acetilsalicílico en varicela aumenta el riesgo de SÍNDROME DE REYE. Usa Paracetamol.",
                gpc_ref: "GPC Diagnóstico y Tratamiento de la Varicela en el Paciente Pediátrico"
            }
        }
    },
    {
        id: "ped_vac_catchup_001",
        difficulty: "hard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [1.5, 6], // Edad en años
                mood_options: ["tranquilo", "inquieto"],
                bio_templates: [
                    "Paciente de {duration} meses traído a consulta. Esquema previo completo para su edad anterior, pero no ha recibido dosis desde los 12 meses.",
                    "Lactante de {duration} meses que acude para regularizar esquema de vacunación tras periodo de desabasto."
                ],
                duration_options: ["18", "19", "20"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["110 lpm"],
                    Temp: ["36.7°C"]
                },
                details_templates: [
                    "Se revisa cartilla anterior: recibió Pentavalente, Neumococo y Rotavirus a los 2, 4 y 6 meses. Primera dosis de SRP al año de vida.",
                    "La madre pregunta si debe esperar a los 6 años para la segunda dosis de SRP, como le dijeron con su hijo mayor."
                ],
            },
            differentials: [
                {
                    title: "A) Adelantar SRP 2ª dosis hoy (18 meses)",
                    is_match: true,
                    text: "Normativa 2024: La 2ª dosis de SRP se aplica a los 18 meses para cerrar brechas de inmunidad.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! Este es el cambio más rentable del 2025. La SRP ya no se espera a los 6 años.",
                        discard: "Error: Ignoraste el cambio normativo 2024. Mantendrás al niño desprotegido por 4 años innecesariamente."
                    }
                },
                {
                    title: "B) Diferir SRP hasta los 6 años de edad",
                    is_match: false,
                    text: "Esquema antiguo previo a la actualización 2024-2025.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "Mal. Te quedaste con la norma vieja. El ENARM evaluará la actualización 2024 (18 meses).",
                        discard: "¡Bien! Reconociste que el esquema antiguo ya no es vigente."
                    }
                },
                {
                    title: "C) Aplicar Hexavalente de refuerzo (18 meses)",
                    is_match: true,
                    text: "La Hexavalente tiene dosis a los 2, 4, 6 y 18 meses (refuerzo acelular).",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "Exacto. A los 18 meses coinciden la 2ª de SRP y la 4ª de Hexavalente.",
                        discard: "Error: Los 18 meses son un hito crítico de refuerzos que no debes omitir."
                    }
                }
            ],
            perla_enarm: {
                title: "Cambio SRP 2024: 18 Meses",
                text: "Dato Clave ENARM 2025: La segunda dosis de SRP (Triple Viral) se adelantó de los 6 años a los 18 meses de edad.",
                gpc_ref: "Cartilla Nacional de Salud 2024-2025"
            }
        }
    },
    {
        id: "ped_growth_tally_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [2, 5], 
                mood_options: ["activo"],
                bio_templates: [
                    "Paciente de {duration} años en control de niño sano. Reporta dieta basada en carbohidratos, poca proteína.",
                    "Evaluación antropométrica de rutina para preescolar de {duration} años."
                ],
                duration_options: ["2", "3", "4"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["100 lpm"],
                    Temp: ["36.6°C"]
                },
                details_templates: [
                    "Peso para Edad: -1.5 DE. Talla para Edad: -2.5 DE. Peso para Talla: -0.5 DE.",
                    "Se observa talla baja persistente. El peso actual es adecuado para su talla baja, pero insuficiente para su edad cronológica."
                ],
            },
            differentials: [
                {
                    title: "A) Desnutrición Crónica (Talla Baja)",
                    is_match: true,
                    text: "Talla para Edad < -2 DE indica desnutrición crónica o retraso en el crecimiento longitudinal.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! El indicador T/E mide cronicidad. Si el P/T es normal pero T/E es baja, el niño está 'armonizado' pero pequeño.",
                        discard: "Error: No interpretar la talla baja como desnutrición crónica es un fallo grave en la evaluación pediátrica."
                    }
                },
                {
                    title: "B) Desnutrición Aguda (Emaciación)",
                    is_match: false,
                    text: "Se define por el indicador Peso para Talla (P/T) < -2 DE.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "Incorrecto. En este caso el P/T es -0.5 DE (Normal). El problema no es el peso actual, sino la talla acumulada.",
                        discard: "¡Bien! Diferenciaste agudo de crónico. El P/T normal descarta emaciación actual."
                    }
                }
            ],
            perla_enarm: {
                title: "Indicadores OMS: T/E = Crónico",
                text: "Indicador Talla para Edad (T/E) evalúa desnutrición CRÓNICA. Peso para Talla (P/T) evalúa desnutrición AGUDA (emaciación).",
                gpc_ref: "NOM-031-SSA2-1999 Para la salud del niño"
            }
        }
    },
    {
        id: "obs_preeclampsia_001",
        difficulty: "hard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [18, 38],
                mood_options: ["angustiada", "con cefalea"],
                bio_templates: [
                    "Gestante de {duration} SDG Acude por cefalea pulsátil, fosfenos y acúfenos.",
                    "Embarazo de {duration} SDG, nota edema facial y en manos. Refiere dolor en epigastrio (en barra)."
                ],
                duration_options: ["32", "34", "36"],
                vitals: {
                    TA: ["160/110", "170/115"],
                    FC: ["90 lpm", "95 lpm"],
                    Temp: ["36.8°C", "37.0°C"]
                },
                details_templates: [
                    "Tira reactiva con proteínas ++. Reflejos osteotendinosos hiperactivos (+++/++++).",
                    "Laboratorios muestran plaquetas en 85,000 y AST/ALT al doble del límite superior."
                ],
            },
            differentials: [
                {
                    title: "A) Preeclampsia con Datos de Severidad",
                    is_match: true,
                    text: "PA ≥160/110 + Síntomas neurológicos (fosfenos, cefalea) + Trombocitopenia.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! Requiere interrupción del embarazo previa estabilización con Sulfato de Magnesio.",
                        discard: "Error: No reconocer datos de severidad arriesga la vida del binomio."
                    }
                },
                {
                    title: "B) Manejo Expectante hasta Término",
                    is_match: false,
                    text: "Control ambulatorio hasta las 38 SDG.",
                    safety_flags: { lethal_risk: true, decision_critical: false },
                    feedback: {
                        match: "¡Mortalidad Materna! Esta paciente tiene datos de severidad. No se puede manejar expectante.",
                        discard: "¡Bien! Reconociste la urgencia."
                    }
                }
            ],
            perla_enarm: {
                title: "Neuroprotección en Preeclampsia",
                text: "El Sulfato de Magnesio es el fármaco de elección para prevenir eclampsia. Dosis de impregnación: 4g IV.",
                gpc_ref: "GPC Preeclampsia - Eclampsia"
            }
        }
    },
    {
        id: "obs_hemorrhage_dppni_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [18, 45],
                mood_options: ["angustiada"],
                bio_templates: [
                    "Multigesta de {duration} semanas con dolor abdominal súbito e intenso. Refiere sangrado vaginal oscuro.",
                    "Paciente de {duration} semanas con antecedente de hipertensión crónica. Presenta útero hipertónico y dolor intenso."
                ],
                duration_options: ["30", "32", "35"],
                vitals: {
                    TA: ["90/60 mmHg"],
                    FC: ["115 lpm"],
                    Temp: ["36.5°C"]
                },
                details_templates: [
                    "A la exploración: Útero de consistencia leñosa (hipertonía). Sangrado transvaginal oscuro, escaso para el nivel de dolor.",
                    "Frecuencia cardiaca fetal con desaceleraciones tardías. La paciente refiere que el abdomen 'se le puso duro' de golpe."
                ],
            },
            differentials: [
                {
                    title: "A) Desprendimiento Prematuro de Placenta (DPPNI)",
                    is_match: true,
                    text: "Dolor abdominal intenso + Hipertonía uterina + Sangrado oscuro + Sufrimiento fetal.",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! El dolor y la hipertonía son la clave para diferenciarlo de la Placenta Previa.",
                        discard: "Error: Confundir DPPNI con Placenta Previa es peligroso. El dolor es el síntoma pivote aquí."
                    }
                },
                {
                    title: "B) Placenta Previa",
                    is_match: false,
                    text: "Sangrado rojo rutilante, INDOLORO, sin hipertonía uterina.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. La Placenta Previa NO duele. Si hay dolor e hipertonía, es un desprendimiento.",
                        discard: "¡Bien! Reconociste que el dolor intenso descarta Placenta Previa."
                    }
                }
            ],
            perla_enarm: {
                title: "DPPNI vs Placenta Previa",
                text: "DPPNI: Dolor, sangrado oscuro, hipertonía. Placenta Previa: Indoloro, sangrado rojo rutilante, útero relajado.",
                gpc_ref: "GPC Diagnóstico y Tratamiento del DPPNI"
            }
        }
    },
    {
        id: "int_sca_iam_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [45, 75],
                mood_options: ["diaforético", "angustiado"],
                bio_templates: [
                    "Paciente de {duration} años con dolor torácico opresivo de gran intensidad, irradiado a mandíbula y brazo izquierdo.",
                    "Hombre de {duration} años con antecedente de DM2 e hipertensión que inicia con dolor precordial súbito y náuseas."
                ],
                duration_options: ["58", "62", "68"],
                vitals: {
                    TA: ["100/60 mmHg"],
                    FC: ["110 lpm"],
                    Temp: ["36.4°C"]
                },
                details_templates: [
                    "ECG: Elevación del segmento ST ≥1mm en V1-V4. El paciente se encuentra pálido y sudoroso.",
                    "Refiere que el dolor inició hace 2 horas y no cede con el reposo. Se observa elevación de Biomarcadores (Troponinas)."
                ],
            },
            differentials: [
                {
                    title: "A) IAMCEST de Cara Anterior",
                    is_match: true,
                    text: "Elevación del ST en precordiales (V1-V4). Requiere reperfusión inmediata (ICP o Fibrinólisis).",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! El ST elevado en V1-V4 indica compromiso de la Descendente Anterior. El tiempo es músculo.",
                        discard: "Error fatal: Ignorar un IAMCEST en cara anterior es sentenciar al paciente a una falla cardiaca masiva."
                    }
                },
                {
                    title: "B) Angina Inestable",
                    is_match: false,
                    text: "Dolor isquémico sin elevación del ST ni biomarcadores positivos.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. La elevación del ST y las troponinas positivas descartan la angina inestable.",
                        discard: "¡Bien! Los biomarcadores y el ECG confirmaron el infarto."
                    }
                }
            ],
            perla_enarm: {
                title: "Ventana Reperfusión SCA",
                text: "Meta ICP primaria: <90 min (puerta-balón). Meta Fibrinólisis: <30 min (puerta-aguja) si no hay ICP disponible.",
                gpc_ref: "GPC Diagnóstico y Tratamiento del Infarto Agudo de Miocardio"
            }
        }
    },
    {
        id: "surg_atls_tension_pneumo_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Masculino"],
                age_range: [18, 50],
                mood_options: ["cianótico", "agitado"],
                bio_templates: [
                    "Masculino de {duration} años tras accidente automovilístico. Presenta dificultad respiratoria severa y desviación traqueal.",
                    "Paciente de {duration} años con herida por arma blanca en tórax. Presenta hipotensión, ruidos respiratorios ausentes en hemitórax derecho."
                ],
                duration_options: ["24", "30", "35"],
                vitals: {
                    TA: ["80/40 mmHg"],
                    FC: ["130 lpm"],
                    Temp: ["36.2°C"]
                },
                details_templates: [
                    "A la exploración: Ingurgitación yugular, ausencia de ruidos respiratorios a la derecha y timpanismo a la percusión.",
                    "Diagnóstico clínico de Neumotórax a Tensión. El paciente se deteriora rápidamente."
                ],
            },
            differentials: [
                {
                    title: "A) Descompresión con aguja hoy (5º espacio)",
                    is_match: true,
                    text: "ATLS 10ª Edición: El sitio recomendado de descompresión es el 5º espacio intercostal, línea axilar anterior/media.",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! Te actualizaste al ATLS 10ª. La descompresión en el 5º espacio es ahora el estándar.",
                        discard: "Error: No descomprimir un neumotórax a tensión es una omisión letal en trauma."
                    }
                },
                {
                    title: "B) Punción en 2º espacio intercostal",
                    is_match: false,
                    text: "Sitio recomendado en guías anteriores (ATLS 9ª y normas mexicanas viejas).",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "Cuidado. Aunque antes se usaba el 2º espacio, el ATLS 10ª (ENARM 2025) prioriza el 5º espacio por mayor éxito.",
                        discard: "¡Bien! Reconociste que el 2º espacio ya no es el sitio preferido en las guías más recientes."
                    }
                }
            ],
            perla_enarm: {
                title: "ATLS 10ª: Neumotórax a Tensión",
                text: "Cambio Crítico: La descompresión inmediata se realiza en el 5º espacio intercostal, línea axilar anterior o media (mismo sitio del tubo de tórax).",
                gpc_ref: "Manual ATLS 10ª Edición"
            }
        }
    },
    {
        id: "int_endo_cad_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [18, 25],
                mood_options: ["somnoliento", "con deshidratación"],
                bio_templates: [
                    "Acude por vómitos persistentes de {duration} horas, dolor abdominal difuso y alteración del sensorio.",
                    "Familiar reporta poliuria y polidipsia intensa desde hace {duration} días, hoy amanece letárgico."
                ],
                duration_options: ["24", "48"],
                vitals: {
                    TA: ["90/60", "100/65"],
                    FC: ["115 lpm", "125 lpm"],
                    Temp: ["36.5°C"]
                },
                details_templates: [
                    "Diaforesis, aliento afrutado (cetónico) y respiración rápida/profunda (Kussmaul). Glucosa capilar 'HI' (>500 mg/dl).",
                    "Respiración de Kussmaul evidente. Mucosas muy secas. Glucosa reportada en 480 mg/dl. Gasometría con pH 7.15, HCO3 12."
                ],
            },
            differentials: [
                {
                    title: "A) Cetoacidosis Diabética (CAD)",
                    is_match: true,
                    text: "Descompensación diabética aguda (típica en pacientes jóvenes/DM1). Triada: Hiperglucemia, Cetonemia/Cetonuria y Acidosis Metabólica.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! Paciente joven con dolor abdominal, Kussmaul y aliento afrutado. La piedra angular inicial es la hidratación IV agresiva y medición de potasio ANTES de iniciar insulina.",
                        discard: "Error: No reconociste la urgencia endocrinológica clásica de un paciente joven diabético."
                    }
                },
                {
                    title: "B) Estado Hiperosmolar Hiperglucémico (EHH)",
                    is_match: false,
                    text: "Suele presentarse en adultos mayores (DM2) con hiperglucemias extremas (>600), deshidratación profunda y SIN acidosis significativa.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "El EHH rara vez debuta con respiración de Kussmaul o acidosis severa (pH 7.15), además es propio de pacientes mayores de 65 años.",
                        discard: "¡Buen ojo! La presencia de acidosis franca y Kussmaul hace la diferencia entre EHH y CAD."
                    }
                }
            ],
            perla_enarm: {
                title: "Manejo de la CAD: Líquidos Primero",
                text: "En la Cetoacidosis Diabética, lo principal es la REPOSICIÓN DE LÍQUIDOS (Sol. Salina al 0.9%). Nunca se debe iniciar Insulina si el Potasio está bajo (<3.3 mEq/L) para evitar arritmias fatales.",
                gpc_ref: "GPC Manejo de Cetoacidosis Diabética"
            }
        }
    },
    {
        id: "surg_biliary_cholangitis_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino", "Masculino"],
                age_range: [40, 65],
                mood_options: ["ictérico", "tóxico"],
                bio_templates: [
                    "Cuadro de {duration} de dolor en hipocondrio derecho irradiado a escápula, que se agregó fiebre (39°C) e ictericia.",
                    "Refiere dolor biliar antiguo. Hoy acude por fiebre con escalofríos, dolor en CSD y tinte ictérico franco."
                ],
                duration_options: ["48 hrs", "2 días"],
                vitals: {
                    TA: ["100/65", "110/70"],
                    FC: ["115 lpm", "120 lpm"],
                    Temp: ["39.0°C", "39.5°C"]
                },
                details_templates: [
                    "Escleras con tinte ictérico +++. Abdomen con Murphy negativo pero doloroso a palpación profunda en CSD. Leucos 18,000.",
                    "Al interrogatorio la paciente se encuentra completamente orientada, respondiendo bien, aunque febril."
                ],
            },
            differentials: [
                {
                    title: "A) Colangitis Aguda",
                    is_match: true,
                    text: "Infección de la vía biliar secundaria a obstrucción (ej. coledocolitiasis). Presenta la Tríada de Charcot.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Perfect Match! Ictericia + Fiebre + Dolor en HD = Tríada de Charcot. El manejo empírico incluye antibióticos IV y CPRE precoz para drenaje.",
                        discard: "Error: No reconociste la tríada clásica de infección biliar, la cual puede progresar a sepsis rápidamente si no se descomprime."
                    }
                },
                {
                    title: "B) Colecistitis Aguda Litiásica",
                    is_match: false,
                    text: "Inflamación de la vesícula biliar por litiasis. Dolor en CSD, fiebre leve, Murphy positivo.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "La Colecistitis pura NO causa ictericia franca (bilirrubina >2.5). Si hay ictericia, el problema no está en la vesícula, sino en la Vía Biliar Principal.",
                        discard: "¡Bien hecho! Supiste que la ictericia marcada excluye inflamación puramente vesicular."
                    }
                }
            ],
            perla_enarm: {
                title: "Tríada de Charcot",
                text: "Componentes: 1. Dolor en hipocondrio derecho, 2. Ictericia, 3. Fiebre (con escalofríos). Si se agrega Choque y Confusión, es Péntada de Reynolds.",
                gpc_ref: "GPC Diagnóstico y Manejo de Colangitis Aguda"
            }
        }
    },
    {
        id: "int_tep_001",
        difficulty: "hard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino", "Masculino"],
                age_range: [40, 70],
                mood_options: ["ansioso", "disneico"],
                bio_templates: [
                    "Acude por disnea súbita y dolor torácico pleurítico de {duration} minutos. Antecedente de cirugía de cadera hace 2 semanas.",
                    "Paciente con cáncer de pulmón en tratamiento, presenta disnea de inicio abrupto y taquipnea importante desde hace {duration} mins."
                ],
                duration_options: ["15", "30", "60"],
                vitals: {
                    TA: ["110/70", "90/60 (tendencia al choque)"],
                    FC: ["120 lpm", "130 lpm"],
                    Temp: ["37.0°C", "37.2°C"]
                },
                details_templates: [
                    "Saturación de O2 al 85% al aire ambiente. Miembro inferior derecho con edema y dolor (TVP). ECG con taquicardia sinusal.",
                    "Auscultación pulmonar normal. Taquicardia y taquipnea notables. Wells de 7 puntos (Alta probabilidad)."
                ],
            },
            differentials: [
                {
                    title: "A) Tromboembolia Pulmonar (TEP)",
                    is_match: true,
                    text: "Obstrucción del flujo arterial pulmonar por trombos. Triada de Virchow presente.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! La disnea súbita en un paciente con factores de riesgo (cirugía reciente/cáncer) y pulmones 'limpios' a la auscultación grita TEP.",
                        discard: "Error Letal: El TEP es una de las causas más comunes de muerte hospitalaria prevenible."
                    }
                }
            ],
            perla_enarm: {
                title: "Diagnóstico de TEP: AngioTAC",
                text: "El estándar de oro para el diagnóstico de TEP es la Angio-Tomografía Computarizada. El ECG más común es la taquicardia sinusal.",
                gpc_ref: "GPC Diagnóstico y Tratamiento de la Tromboembolia Pulmonar"
            }
        }
    },
    {
        id: "ped_pyloric_senosis_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino"],
                age_range: [2, 6],
                mood_options: ["hambriento", "irritable"],
                bio_templates: [
                    "Lactante de {duration} semanas de vida, traído por vómitos no biliar en proyectil tras cada toma. Se muestra muy hambriento después de vomitar.",
                    "Varón primogénito de {duration} semanas. Vómitos postprandiales inmediatos, abundantes y de contenido alimentario (leche)."
                ],
                duration_options: ["3", "4", "5"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["140 lpm"],
                    Temp: ["36.6°C"]
                },
                details_templates: [
                    "A la palpación abdominal profunda: masa móvil, firme en forma de oliva en cuadrante superior derecho.",
                    "Se observa onda peristáltica gástrica de izquierda a derecha. Deshidratación leve. Labs con alcalosis metabólica hipoclorémica."
                ],
            },
            differentials: [
                {
                    title: "A) Estenosis Hipertrófica del Píloro",
                    is_match: true,
                    text: "Hipertrofia de la muscular del píloro. Vómito no biliar en proyectil. Signo de la Oliva patognomónico.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Perfecto! El estudio inicial es el Ultrasonido.",
                        discard: "Error: No reconociste el 'signo de la oliva', dato pivote para el diagnóstico."
                    }
                }
            ],
            perla_enarm: {
                title: "Vómito en Píloro: Alcalosis Hipoclorémica",
                text: "El trastorno ácido-base clásico de la Estenosis de Píloro es la ALCALOSIS METABÓLICA HIPOCLORÉMICA e hipokalémica.",
                gpc_ref: "GPC Diagnóstico y Tratamiento de Estenosis Hipertrófica de Píloro"
            }
        }
    },
    {
        id: "obs_rpm_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [20, 35],
                mood_options: ["preocupada"],
                bio_templates: [
                    "Gestante de {duration} SDG Acude por salida brusca de abundantes líquidos transparentes transvaginales con olor a cloro.",
                    "Reporta sensación de 'mojado' persistente desde hace {duration} horas, sospecha ruptura de fuente."
                ],
                duration_options: ["32", "34", "36"],
                vitals: {
                    TA: ["110/70"],
                    FC: ["85 lpm"],
                    Temp: ["36.8°C"]
                },
                details_templates: [
                    "Especuloscopía: maniobra de Valsalva positiva con salida de líquido amniótico. Papel de Nitrazina vira a color azul (alcalino).",
                    "Cristalografía (test de helecho) positiva. FCF 140 lpm sin datos de pérdida de bienestar fetal."
                ],
            },
            differentials: [
                {
                    title: "A) Ruptura Prematura de Membranas (RPM)",
                    is_match: true,
                    text: "Pérdida de la integridad de las membranas antes del inicio del trabajo de parto.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! El diagnóstico se confirma mediante especuloscopía estéril.",
                        discard: "Error: Ignorar una RPM aumenta el riesgo de corioamnionitis."
                    }
                }
            ],
            perla_enarm: {
                title: "Diagnóstico de RPM: No Tacto Vaginal",
                text: "Ante sospecha de RPM, el tacto vaginal debe evitarse para no introducir bacterias.",
                gpc_ref: "GPC Diagnóstico y Manejo de Ruptura Prematura de Membranas"
            }
        }
    },
    {
        id: "surg_obstruction_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [40, 80],
                mood_options: ["con náuseas", "distendido"],
                bio_templates: [
                    "Paciente con antecedente de 3 cirugías abdominales. Presenta dolor abdominal tipo cólico, distensión y ausencia de canalización de gases de {duration} horas.",
                    "Cuadro de vómitos fecaloideos, dolor abdominal difuso intenso y gran distensión abdominal progresiva desde hace {duration} hrs."
                ],
                duration_options: ["24", "48", "72"],
                vitals: {
                    TA: ["100/60", "110/70"],
                    FC: ["110 lpm"],
                    Temp: ["37.2°C"]
                },
                details_templates: [
                    "Auscultación: ruidos peristálticos de lucha (metálicos) seguidos de silencio. Rx de abdomen con niveles hidroaéreos y 'pila de monedas'.",
                    "Gran distensión timpánica. Ampolla rectal vacía al tacto."
                ],
            },
            differentials: [
                {
                    title: "A) Obstrucción Intestinal por Bridas y Adherencias",
                    is_match: true,
                    text: "Principal causa de obstrucción en pacientes con cirugía previa.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! La 'pila de monedas' es característica de intestino delgado.",
                        discard: "Error: El riesgo de isquemia intestinal es alto."
                    }
                }
            ],
            perla_enarm: {
                title: "Obstrucción: Niveles Hidroaéreos",
                text: "La causa #1 de obstrucción intestinal en adultos son las BRIDAS post-quirúrgicas.",
                gpc_ref: "GPC Diagnóstico y Tratamiento de la Obstrucción Intestinal"
            }
        }
    },
    {
        id: "psych_mania_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [20, 35],
                mood_options: ["eufórico", "disruptivo"],
                bio_templates: [
                    "Ingresa por agitación psicomotriz. Familia refiere que lleva {duration} días sin dormir, gastando dinero excesivamente y hablando sin parar.",
                    "Presenta verborrea, fuga de ideas y grandiosidad. Afirma ser el 'nuevo director del hospital' sin tener formación médica."
                ],
                duration_options: ["7", "10", "14"],
                vitals: {
                    TA: ["130/85"],
                    FC: ["105 lpm"],
                    Temp: ["36.8°C"]
                },
                details_templates: [
                    "Muestra disminución de la necesidad de dormir. Hipersexualidad y conducta de riesgo (compras impulsivas).",
                    "Afecto expansivo, pobre juicio de realidad. Escala DIGFAST positiva."
                ],
            },
            differentials: [
                {
                    title: "A) Episodio Maníaco (Trastorno Bipolar I)",
                    is_match: true,
                    text: "Estado de ánimo elevado/expansivo por al menos 1 semana. Criterios DIGFAST presentes.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! La duración de una semana define el episodio maníaco.",
                        discard: "Error: Confundiste la euforia patológica con un estado normal."
                    }
                }
            ],
            perla_enarm: {
                title: "Criterios Manía: DIGFAST",
                text: "Mnemotecnia DIGFAST: Distractibility, Indiscretion, Grandiosity, Flight of ideas, Activity increase, Sleep deficit, Talkativeness.",
                gpc_ref: "Guía de Práctica Clínica Trastorno Bipolar"
            }
        },
    },
    {
        id: "int_dm2_dx_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [40, 60],
                mood_options: ["preocupado"],
                bio_templates: [
                    "Acude a revisión tras hallazgo casual de glucosa de 135 mg/dl en ayuno. Niega síntomas cardinales.",
                    "Paciente con obesidad grado I, refiere poliuria y polidipsia ocasional. Glucosa al azar de 210 mg/dl."
                ],
                duration_options: ["1 semana"],
                vitals: {
                    TA: ["130/85"],
                    FC: ["80 lpm"],
                    Temp: ["36.5°C"]
                },
                details_templates: [
                    "Se realiza segunda medición de glucosa en ayuno: 128 mg/dl. HbA1c reportada en 6.7%.",
                    "Glucosa plasmática a las 2 horas de carga de 75g: 205 mg/dl."
                ],
            },
            differentials: [
                {
                    title: "A) Diabetes Mellitus Tipo 2 (Confirmada)",
                    is_match: true,
                    text: "Criterios: Glucosa ayuno ≥126, HbA1c ≥6.5%, o Glucosa azar ≥200 con síntomas.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! Cumple criterios de la NOM-015 para diagnóstico definitivo.",
                        discard: "Error: Los niveles reportados son diagnósticos. Retrasar el tratamiento aumenta riesgo de complicaciones microvasculares."
                    }
                },
                {
                    title: "B) Prediabetes (Glucosa Alterada en Ayuno)",
                    is_match: false,
                    text: "Glucosa en ayuno entre 100 y 125 mg/dl.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. El paciente ya superó el umbral de 126 mg/dl en dos ocasiones o tiene HbA1c diagnóstica.",
                        discard: "¡Bien! Reconociste que ya es un cuadro franco de Diabetes."
                    }
                }
            ],
            perla_enarm: {
                title: "Criterios Diagnósticos DM2 (NOM-015)",
                text: "1. Glucosa ayuno ≥126 (x2), 2. HbA1c ≥6.5%, 3. Curva (75g) ≥200 a las 2h, 4. Azar ≥200 + síntomas clásicos.",
                gpc_ref: "NOM-015-SSA2-2010"
            }
        }
    },
    {
        id: "ped_neo_apgar_001",
        difficulty: "standard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [0, 0],
                mood_options: ["cianótico", "con llanto débil"],
                bio_templates: [
                    "Recién nacido a término. Tras el nacimiento presenta FC de 90 lpm, llanto débil, cierta flexión de extremidades e irritabilidad reflexiva (mueca).",
                    "Neonato de 39 SDG. Al minuto: acrocianosis, FC 110, muecas al estimular, respiración irregular y flacidez."
                ],
                duration_options: ["1 min", "5 min"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["90 lpm", "110 lpm"],
                    Temp: ["36.5°C"]
                },
                details_templates: [
                    "Se evalúa APGAR al primer minuto. El cuerpo está rosado pero las manos y pies están azules.",
                    "Se observa Silverman-Andersen: aleteo nasal leve, tiraje intercostal discreto. Resto normal."
                ],
            },
            differentials: [
                {
                    title: "A) APGAR 5 (Depresión Moderada)",
                    is_match: true,
                    text: "FC <100 (1) + Llanto débil (1) + Mueca (1) + Flexión (1) + Acrocianosis (1).",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Excelente cálculo! El APGAR evalúa vitalidad, no pronóstico neurológico a largo plazo.",
                        discard: "Error: No saber calcular el APGAR es un fallo básico en pediatría ENARM."
                    }
                },
                {
                    title: "B) Silverman-Andersen 2 (Dificultad Leve)",
                    is_match: true,
                    text: "Aleteo (1) + Tiraje (1) = 2. A diferencia del APGAR, a mayor puntaje Silverman, mayor gravedad.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! El Silverman mide dificultad respiratoria. 1-3 es leve.",
                        discard: "Ojo: Confundiste la dirección de las escalas. Silverman alto es MALO."
                    }
                }
            ],
            perla_enarm: {
                title: "APGAR vs Silverman",
                text: "APGAR: Evalúa vitalidad (1 y 5 min). Silverman: Evalúa dificultad respiratoria. RECUERDA: Silverman 0 es el éxito, APGAR 10 es el éxito.",
                gpc_ref: "GPC Reanimación Neonatal"
            }
        }
    },
    {
        id: "ped_respiratory_crup_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [1, 3],
                mood_options: ["irritable", "con estridor"],
                bio_templates: [
                    "Lactante de {duration} que inicia súbitamente por la noche con tos 'perruna', estridor inspiratorio y disfonía. Antecedente de coriza leve.",
                    "Paciente de {duration} con fiebre leve y dificultad respiratoria progresiva. A la auscultación estridor laríngeo."
                ],
                duration_options: ["2 años", "18 meses"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["120 lpm"],
                    Temp: ["37.8°C"]
                },
                details_templates: [
                    "Rx lateral de cuello muestra estrechamiento subglótico (Signo de la torre o del lápiz).",
                    "El paciente mejora notablemente al contacto con el aire frío de la noche."
                ],
            },
            differentials: [
                {
                    title: "A) Laringotraqueítis (CRUP)",
                    is_match: true,
                    text: "Virus Parainfluenza tipe 1 y 3. Triada: Tos traqueal, estridor e hiponía.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Perfecto! El manejo de elección según GPC es la DEXAMETASONA dosis única (IM u Oral).",
                        discard: "Error: Confundiste Crup con Epiglotitis. La fiebre leve y la tos perruna son típicas de Crup."
                    }
                },
                {
                    title: "B) Epiglotitis Aguda",
                    is_match: false,
                    text: "H. influenzae tipo b. Fiebre alta, babeo (sialorrea), posición de trípode y AUSENCIA de tos.",
                    safety_flags: { lethal_risk: true, decision_critical: false },
                    feedback: {
                        match: "¡Peligro! La epiglotitis es una emergencia quirúrgica. No hay tos perruna en epiglotitis.",
                        discard: "¡Bien! Reconociste que el babeo y el aspecto tóxico (ausentes aquí) son de Epiglotitis."
                    }
                }
            ],
            perla_enarm: {
                title: "Tratamiento de CRUP",
                text: "GPC: El pilar es Dexametasona (0.6 mg/kg). Si hay estridor en reposo, agregar Epinefrina Racémica nebulizada.",
                gpc_ref: "GPC Diagnóstico y Manejo de la Laringotraqueítis"
            }
        }
    },
    {
        id: "ped_stats_tests_001",
        difficulty: "hard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [20, 50],
                mood_options: ["analítico"],
                bio_templates: [
                    "En una comunidad se aplica una nueva prueba para cáncer gástrico. De 100 enfermos, 90 salen positivos. De 100 sanos, 80 salen negativos.",
                    "Análisis de prueba diagnóstica: Sensibilidad 90%, Especificidad 80%. Prevalencia de la enfermedad 10%."
                ],
                duration_options: ["Estudio"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["N/A"],
                    Temp: ["N/A"]
                },
                details_templates: [
                    "¿Cuál es el Valor Predictivo Negativo (VPN) si la prueba sale negativa en un paciente?",
                    "Si la sensibilidad aumenta al 100%, ¿qué parámetro se vuelve máximo?"
                ],
            },
            differentials: [
                {
                    title: "A) Alta Sensibilidad (SNNeg)",
                    is_match: true,
                    text: "Una prueba con alta sensibilidad es útil para DESCARTAR (SnNOut) porque tiene pocos falsos negativos.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! Sensibilidad = Capacidad de detectar enfermos (Positivos / Enfermos totales).",
                        discard: "Error: Confundiste Sensibilidad con Especificidad. Es un clásico del ENARM."
                    }
                },
                {
                    title: "B) Especificidad (SpPos)",
                    is_match: true,
                    text: "Alta especificidad es útil para CONFIRMAR (SpPIn) porque tiene pocos falsos positivos.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "Exacto. Especificidad = Negativos / Sanos totales.",
                        discard: "Mal. La especificidad mide a los sanos, no a los enfermos."
                    }
                }
            ],
            perla_enarm: {
                title: "VPN vs VPP",
                text: "El VPP y VPN dependen de la PREVALENCIA. La Sensibilidad y Especificidad son propiedades intrínsecas de la prueba y NO cambian con la prevalencia.",
                gpc_ref: "Bioestadística Clínica ENARM"
            }
        }
    },
    {
        id: "int_htn_dx_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [45, 65],
                mood_options: ["asintomático"],
                bio_templates: [
                    "Acude a consulta externa. En la primera medición presenta TA 145/95 mmHg. Se le pide reposar 5 min y se repite: 142/92 mmHg.",
                    "Paciente con antecedente de tabaquismo. En campañas de salud le detectan TA 150/100 mmHg. Acude para corroborar diagnóstico."
                ],
                duration_options: ["1 semana"],
                vitals: {
                    TA: ["145/95 mmHg"],
                    FC: ["75 lpm"],
                    Temp: ["36.6°C"]
                },
                details_templates: [
                    "Se registran bitácoras de TA en casa (AMPA) con promedio de 138/88 mmHg. En consultorio hoy: 146/94 mmHg.",
                    "Se realiza diagnóstico tras tres mediciones en días distintos con promedio ≥140/90 mmHg."
                ],
            },
            differentials: [
                {
                    title: "A) Hipertensión Arterial Sistémica Grado 1 (Sustentada)",
                    is_match: true,
                    text: "Criterios NOM-030: ≥140/90 mmHg en 2 o más visitas, o promedio de bitácora diagnóstica.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! El diagnóstico se sustenta tras mediciones repetidas adecuadamente.",
                        discard: "Error: No iniciar protocolo diagnóstico o terapéutico ante cifras sostenidas arriesga daño a órgano blanco."
                    }
                },
                {
                    title: "B) Hipertensión de Bata Blanca",
                    is_match: false,
                    text: "Cifras altas en consultorio pero NORMALES en AMPA/MAPA.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. En este caso el AMPA (138/88) también está por encima de los límites normales para casa (135/85), confirmando HAS.",
                        discard: "¡Bien! Diferenciaste el fenómeno de bata blanca de una HAS real."
                    }
                }
            ],
            perla_enarm: {
                title: "Diagnóstico HAS (NOM-030)",
                text: "Diagnóstico inicial: Promedio ≥140/90 mmHg en al menos dos consultas. Si el paciente llega con ≥180/110 mmHg, el diagnóstico se hace en la PRIMERA visita.",
                gpc_ref: "NOM-030-SSA2-2009"
            }
        }
    },
    {
        id: "ped_git_dehydration_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [1.5, 4],
                mood_options: ["irritable", "sediento"],
                bio_templates: [
                    "Lactante con 5 evacuaciones líquidas y 2 vómitos. Presenta ojos hundidos, llanto sin lágrimas y signo del lienzo húmedo (desaparece lento).",
                    "Paciente preescolar con diarrea profusa. Se encuentra muy inquieto, bebe agua con avidez, pero sus mucosas están secas."
                ],
                duration_options: ["24 horas"],
                vitals: {
                    TA: ["90/60 mmHg"],
                    FC: ["125 lpm"],
                    Temp: ["37.5°C"]
                },
                details_templates: [
                    "Fontanela anterior ligeramente hundida. El paciente está consciente pero muy irritable.",
                    "Se observa que el paciente acepta bien el Vida Suero Oral (VSO) en la sala de urgencias."
                ],
            },
            differentials: [
                {
                    title: "A) Deshidratación Moderada (Plan B)",
                    is_match: true,
                    text: "Paciente con signos de deshidratación pero SIN choque. Manejo con VSO 100 ml/kg en 4 horas.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Exacto! El Plan B es para deshidratación clínica moderada. Se administra VSO fraccionado.",
                        discard: "Error: No hidratar adecuadamente bajo supervisión puede llevar al paciente al Plan C (choque)."
                    }
                },
                {
                    title: "B) Deshidratación Grave / Choque (Plan C)",
                    is_match: false,
                    text: "Falla orgánica, llenado capilar >3s, pulsos débiles, alteración de conciencia.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. El paciente está irritable y sediento (Plan B). En el Plan C ya no beben agua y están letárgicos.",
                        discard: "¡Bien! Diferenciaste la irritabilidad (B) de la letargia (C)."
                    }
                }
            ],
            perla_enarm: {
                title: "Plan ABC de Hidratación",
                text: "Plan A: Casa (VSO tras cada evacuación). Plan B: Clínica (100 ml/kg VSO en 4h). Plan C: Hospital (Hartmann/Salina IV 60 ml/kg en 1h o esquema fraccionado).",
                gpc_ref: "GPC Prevención y Manejo de la Diarrea Aguda"
            }
        }
    },
    {
        id: "ped_neuro_milestones_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino", "Masculino"],
                age_range: [0.5, 2], 
                mood_options: ["curioso", "tranquilo"],
                bio_templates: [
                    "Lactante de {duration} meses traído a control. La madre pregunta si su desarrollo es normal para su edad.",
                    "Evaluación de rutina para niño de {duration} meses. Se observa su interacción en el consultorio."
                ],
                duration_options: ["9", "18"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["110 lpm"],
                    Temp: ["36.5°C"]
                },
                details_templates: [
                    "A los 9 meses: Realiza pinza fina, se mantiene sentado sin apoyo y busca objetos ocultos.",
                    "A los 18 meses: Camina solo, dice 15 palabras claras y señala lo que quiere. No sube escaleras sin apoyo aún."
                ],
            },
            differentials: [
                {
                    title: "A) Desarrollo Psicomotor Normal",
                    is_match: true,
                    text: "Sigue los hitos esperados: 9 meses (pinza fina), 18 meses (marcha independiente).",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! Reconocer la normalidad es tan importante como detectar la patología.",
                        discard: "Error: El niño cumple con los hitos pivote para su edad cronológica."
                    }
                },
                {
                    title: "B) Retraso Global del Desarrollo",
                    is_match: false,
                    text: "Ausencia de hitos clave como marcha a los 18 meses o pinza a los 10 meses.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. Este paciente SÍ tiene los hitos clave para su edad. El retraso se sospecha si a los 18 meses NO camina.",
                        discard: "¡Bien! No patologizaste un desarrollo normal."
                    }
                }
            ],
            perla_enarm: {
                title: "Hitos Críticos: 18 Meses",
                text: "Dato Pivote: La ausencia de MARCHA INDEPENDIENTE a los 18 meses es un signo de alarma auditivo/motriz que requiere evaluación inmediata.",
                gpc_ref: "GPC Control y Vigilancia de la salud del niño <5 años"
            }
        }
    },
    {
        id: "ped_exant_rubeola_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [3, 8],
                mood_options: ["estable"],
                bio_templates: [
                    "Escolar de {duration} años presenta exantema rosado que inició en cara y se generalizó en 24 horas. Febricula persistente.",
                    "Niña de {duration} años con adenopatías retroauriculares y cervicales dolorosas, seguidas de exantema pálido."
                ],
                duration_options: ["5", "6", "7"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["95 lpm"],
                    Temp: ["37.8°C"]
                },
                details_templates: [
                    "A la exploración: Manchas de Forchheimer (puntilleo rojo) en paladar blando. Adenopatías retroauriculares muy marcadas.",
                    "Exantema que no confluye, desaparece al tercer día. Madre gestante en primer trimestre (contacto de riesgo)."
                ],
            },
            differentials: [
                {
                    title: "A) Rubéola",
                    is_match: true,
                    text: "Adenopatías retroauriculares + Manchas de Forchheimer + Exantema de 3 días.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! El dato pivote son las adenopatías dolorosas y las manchas de Forchheimer.",
                        discard: "Error: Ignoraste las adenopatías retroauriculares, clásicas de Rubéola."
                    }
                },
                {
                    title: "B) Sarampión",
                    is_match: false,
                    text: "Cuadro mucho más tóxico, conjuntivitis y manchas de Koplik.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. El sarampión es 'confluente' y el paciente se ve mucho más enfermo (tóxico).",
                        discard: "¡Bien! Diferenciaste la rubéola (leve) del sarampión (severo)."
                    }
                }
            ],
            perla_enarm: {
                title: "Rubéola: Manchas de Forchheimer",
                text: "Las manchas de Forchheimer (paladar) son sugerentes, pero las adenopatías retroauriculares/occipitales dolorosas son el 'clue' del examen.",
                gpc_ref: "GPC Diagnóstico de Enfermedades Exantemáticas"
            }
        }
    },
    {
        id: "ped_exant_roseola_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino", "Masculino"],
                age_range: [0.5, 2],
                mood_options: ["irritable", "inquieto"],
                bio_templates: [
                    "Lactante de {duration} meses con fiebre de 39.5°C por 3 días sin foco aparente. Hoy la fiebre desaparece y brota exantema rosado.",
                    "Tras 4 días de fiebre alta difícil de controlar, el niño amanece sin fiebre pero con manchas rosadas en tronco y cuello."
                ],
                duration_options: ["10", "14", "18"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["130 lpm (durante fiebre)"],
                    Temp: ["36.6°C (post-fiebre)"]
                },
                details_templates: [
                    "Exantema maculopapular no pruriginoso que afecta principalmente tronco. El niño luce bien tras la caída de la fiebre.",
                    "Antecedente de crisis convulsiva febril hace 24 horas durante el pico máximo de temperatura."
                ],
            },
            differentials: [
                {
                    title: "A) Exantema Súbito (6ta Enfermedad)",
                    is_match: true,
                    text: "Fiebre ALTA que desaparece → Aparece exantema. Virus Herpes Humano 6.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! 'Súbito' porque el exantema sale en cuanto la fiebre se va de golpe.",
                        discard: "Error: La cronología Fiebre -> Exantema (sin coincidir) es patognomónica aquí."
                    }
                }
            ],
            perla_enarm: {
                title: "Roséola: Fiebre y Convulsión",
                text: "Es la causa más frecuente de crisis convulsivas febriles debido a la rapidez y magnitud del ascenso térmico.",
                gpc_ref: "GPC Diagnóstico de Enfermedades Exantemáticas"
            }
        }
    },
    {
        id: "ped_exant_erythema_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino", "Masculino"],
                age_range: [5, 12],
                mood_options: ["estable"],
                bio_templates: [
                    "Escolar de {duration} años que presenta eritema súbito en ambas mejillas, con aspecto de 'bofetada'.",
                    "Paciente con mejillas muy rojas 'como si lo hubieran golpeado', seguidas de exantema reticulado en brazos."
                ],
                duration_options: ["6", "8", "10"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["80 lpm"],
                    Temp: ["37.2°C"]
                },
                details_templates: [
                    "Exantema en extremidades con aspecto de 'encaje' o reticulado. No presenta fiebre ni malestar general.",
                    "Paciente con esferocitosis hereditaria (complicación latente por Parvovirus B19)."
                ],
            },
            differentials: [
                {
                    title: "A) Eritema Infeccioso (5ta Enfermedad)",
                    is_match: true,
                    text: "Parvovirus B19. Signo de la bofetada + Exantema reticulado.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Match! El aspecto de 'encaje' es el descriptor clásico ENARM para Parvovirus B19.",
                        discard: "Error: El signo de la bofetada es inconfundible en las preguntas de pediatría."
                    }
                },
                {
                    title: "B) Crisis Aplásica",
                    is_match: true,
                    text: "Riesgo real en pacientes con anemias hemolíticas crónicas infectados por Parvovirus B19.",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! En el examen, si mencionan un niño con anemia y este exantema, la respuesta es crisis aplásica.",
                        discard: "Ojo: Si hay anemia de base, el Parvovirus B19 deja de ser banal y se vuelve una urgencia."
                    }
                }
            ],
            perla_enarm: {
                title: "Bofetada y Encaje",
                text: "Descriptor clave: Exantema reticulado o en encaje. Riesgo: Hidrops fetalis en embarazadas y crisis aplásica en anémicos.",
                gpc_ref: "GPC Diagnóstico de Enfermedades Exantemáticas"
            }
        }
    },
    {
        id: "ped_exant_scarlet_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [3, 15],
                mood_options: ["con dolor faríngeo"],
                bio_templates: [
                    "Escolar con fiebre alta y faringitis severa. Presenta exantema eritematoso de textura rugosa (lija).",
                    "Paciente de {duration} años con lengua en fresa, palidez perioral y exantema que inició en cuello y axilas."
                ],
                duration_options: ["6", "9"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["110 lpm"],
                    Temp: ["39.0°C"]
                },
                details_templates: [
                    "Líneas de Pastia (hiperpigmentación en pliegues) y Fascies de Filatov (palidez perioral) presentes.",
                    "Al tercer día el exantema descama en finas láminas. Faringe hiperémica con exudado purulento."
                ],
            },
            differentials: [
                {
                    title: "A) Escarlatina",
                    is_match: true,
                    text: "S. pyogenes. Toxina eritrogénica. Lengua en fresa + Líneas de Pastia.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Logrado! El tratamiento es Penicilina benzatínica para prevenir Fiebre Reumática.",
                        discard: "Error: La textura de 'lija' y las líneas de Pastia obligan a pensar en Escarlatina."
                    }
                }
            ],
                perla_enarm: {
                title: "Pastia y Filatov",
                text: "Escarlatina: Exantema en lija, Líneas de Pastia (pliegues), Fascies de Filatov (boca blanca/mejillas rojas) y Lengua en Fresa.",
                gpc_ref: "GPC Prevención de Fiebre Reumática"
            }
        }
    },
    {
        id: "obs_hem_abortion_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [18, 35],
                mood_options: ["angustiada", "con dolor"],
                bio_templates: [
                    "Gestante de {duration} semanas acude por sangrado vaginal transcurrente y dolor tipo cólico en hipogastrio.",
                    "Paciente con amenorrea de {duration} semanas. Presenta sangrado rojo rutilante y expulsión de tejido blanquecino."
                ],
                duration_options: ["8", "10", "12"],
                vitals: {
                    TA: ["110/70"],
                    FC: ["90 lpm"],
                    Temp: ["36.8°C"]
                },
                details_templates: [
                    "Especuloscopía: Cérvix con orificios abiertos, se observa presencia de restos ovulares en canal vaginal.",
                    "Útero menor de lo esperado para amenorrea. USG reporta útero con ecos heterogéneos y ausencia de saco gestacional íntegro."
                ],
            },
            differentials: [
                {
                    title: "A) Aborto Incompleto",
                    is_match: true,
                    text: "Expulsión parcial de restos. Cérvix abierto + Sangrado persistente + Útero contraído.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! Requiere evacuación mediante AMEU o Legrado según estabilidad y semanas.",
                        discard: "Error: Dejar restos ovulares arriesga a hemorragia severa o aborto séptico."
                    }
                },
                {
                    title: "B) Amenaza de Aborto",
                    is_match: false,
                    text: "Sangrado vaginal SIN modificación cervical (cérvix cerrado).",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. Si el cérvix está abierto, deja de ser una 'amenaza' y se vuelve un aborto en evolución o incompleto.",
                        discard: "¡Bien! El cérvix abierto fue el dato clave para descartar la amenaza."
                    }
                }
            ],
            perla_enarm: {
                title: "Clasificación de Aborto",
                text: "Clave ENARM: Cérvix CERRADO = Amenaza o Diferido. Cérvix ABIERTO = Inevitable, En Evolución o Incompleto.",
                gpc_ref: "GPC Diagnóstico y Tratamiento del Aborto"
            }
        }
    },
    {
        id: "obs_hem_ectopic_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [18, 40],
                mood_options: ["pálida", "con dolor intenso"],
                bio_templates: [
                    "Acude a urgencias por dolor abdominal súbito en fosa ilíaca derecha de intensidad 10/10. Refiere manchado vaginal escaso.",
                    "Paciente con retraso menstrual de {duration} semanas. Presenta síncope y dolor a la movilización cervical intenso."
                ],
                duration_options: ["6", "7", "8"],
                vitals: {
                    TA: ["80/40 mmHg"],
                    FC: ["120 lpm"],
                    Temp: ["36.2°C"]
                },
                details_templates: [
                    "Signos de irritación peritoneal (rebote positivo). USG transvaginal: Fondo uterino vacío, líquido libre en fondo de saco de Douglas.",
                    "HCG cuantitativa de 2,500 mUI/ml. Se observa imagen anexial compleja. Grito de Douglas positivo."
                ],
            },
            differentials: [
                {
                    title: "A) Embarazo Ectópico Roto",
                    is_match: true,
                    text: "Triada: Amenorrea + Dolor pélvico + Sangrado escaso. Evoluciona a choque hemoperitoneo.",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! Es una emergencia quirúrgica (Salpingectomía). El dolor a la movilización cervical es clave.",
                        discard: "Error fatal: El ectópico roto es una de las principales causas de muerte materna en el primer trimestre."
                    }
                },
                {
                    title: "B) Apendicitis Aguda",
                    is_match: false,
                    text: "Puede simular el dolor en FID, pero no explica el choque súbito ni la amenorrea.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "Cuidado. Siempre pide prueba de embarazo en mujeres en edad fértil con dolor abdominal. La amenorrea apunta a ectópico.",
                        discard: "¡Bien! El contexto de amenorrea y el líquido libre sugieren origen obstétrico."
                    }
                }
            ],
            perla_enarm: {
                title: "HCG y USG: Zona de Discriminación",
                text: "Si HCG >1,500 y el útero está VACÍO en USG transvaginal, se sospecha de Embarazo Ectópico hasta no demostrar lo contrario.",
                gpc_ref: "GPC Diagnóstico y Manejo del Embarazo Ectópico"
            }
        }
    },
    {
        id: "obs_hem_mola_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [15, 45],
                mood_options: ["con náuseas intensas"],
                bio_templates: [
                    "Paciente de {duration} semanas con sangrado vaginal intermitente, refiere haber expulsado 'bolitas como uvas'.",
                    "Acude por hiperemesis gravídica severa. Al EF, el útero se palpa a nivel de cicatriz umbilical, mayor a su edad gestacional de {duration} semanas."
                ],
                duration_options: ["12", "14"],
                vitals: {
                    TA: ["150/90 mmHg (HTA temprana)"],
                    FC: ["100 lpm"],
                    Temp: ["36.7°C"]
                },
                details_templates: [
                    "USG obstétrico revela imagen en 'tormenta de nieve' o 'panal de abejas'. Ausencia de feto.",
                    "HCG reportada en 250,000 mUI/ml. Presencia de quistes tecaluteínicos bilaterales en ovarios."
                ],
            },
            differentials: [
                {
                    title: "A) Mola Hidatidiforme Completa",
                    is_match: true,
                    text: "Proliferación trofoblástica. Útero mayor a amenorrea + Tormenta de nieve + HCG >100,000.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Acertaste! El manejo inicial es la evacuación mediante AMEU.",
                        discard: "Error: No diagnosticar una mola arriesga a coriocarcinoma o embolismo trofoblástico."
                    }
                }
            ],
            perla_enarm: {
                title: "Mola: Tormenta de Nieve",
                text: "Descriptor clave: Imagen en 'Copo de Nieve' o 'Panal de Abejas'. Dato clínico: Útero mayor a amenorrea e hiperemesis severa.",
                gpc_ref: "GPC Diagnóstico y Tratamiento de la Enfermedad Trofoblástica"
            }
        }
    },
    {
        id: "obs_gdm_dx_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [24, 35],
                mood_options: ["estable"],
                bio_templates: [
                    "Gestante de {duration} semanas de gestación acude para tamizaje de diabetes gestacional. Antecedente de IMC 30.",
                    "Paciente cursando con {duration} SDG. Se realiza curva de tolerancia a la glucosa de 75g (Estrategia de Un Paso)."
                ],
                duration_options: ["24", "26", "28"],
                vitals: {
                    TA: ["110/70"],
                    FC: ["80 lpm"],
                    Temp: ["36.5°C"]
                },
                details_templates: [
                    "Resultados de CTGO 75g: Ayuno 95 mg/dl, 1 hora 185 mg/dl, 2 horas 140 mg/dl.",
                    "Ayuno reportado en 91 mg/dl. A la hora presenta 190 mg/dl. ¿Cuál es la conducta?"
                ],
            },
            differentials: [
                {
                    title: "A) Diabetes Gestacional (Confirmada)",
                    is_match: true,
                    text: "Estrategia Un Paso (75g): Ayuno ≥92, 1h ≥180, o 2h ≥153. Solo se requiere un valor alterado.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! Cumple criterios de la ADA/GPC con un solo valor por encima del punto de corte.",
                        discard: "Error: No diagnosticar DG en este punto arriesga macrosomía fetal y complicaciones metabólicas."
                    }
                },
                {
                    title: "B) Tolerancia a la Glucosa Normal",
                    is_match: false,
                    text: "Valores por debajo de 92, 180 y 153 respectivamente.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. El valor de 1 hora (185 o 190) ya es diagnóstico según la normativa actual.",
                        discard: "¡Bien! Reconociste el umbral diagnóstico riguroso para gestantes."
                    }
                }
            ],
            perla_enarm: {
                title: "Tamizaje DG: Un Paso vs Dos Pasos",
                text: "Clave: Estrategia Un Paso (75g) usa puntos de corte 92-180-153. Con UN solo valor alterado se hace el diagnóstico.",
                gpc_ref: "GPC Diagnóstico y Tratamiento de la Diabetes en el Embarazo"
            }
        }
    },
    {
        id: "obs_infection_corio_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [18, 40],
                mood_options: ["febril", "angustiada"],
                bio_templates: [
                    "Gestante de {duration} semanas con ruptura de membranas de 18 horas de evolución. Presenta fiebre de 38.5°C y taquicardia fetal.",
                    "Acude por fiebre y dolor uterino a la palpación. El líquido amniótico se observa turbio y con mal olor."
                ],
                duration_options: ["30", "34", "36"],
                vitals: {
                    TA: ["100/60 mmHg"],
                    FC: ["110 lpm (materna)"],
                    Temp: ["38.8°C"]
                },
                details_templates: [
                    "FCF de 170 lpm (taquicardia fetal persistente). Leucocitosis de 18,000 con neutrofilia.",
                    "Útero sensible a la palpación. Diagnóstico clínico de Corioamnionitis (Criterios de Gibbs)."
                ],
            },
            differentials: [
                {
                    title: "A) Corioamnionitis (Criterios de Gibbs)",
                    is_match: true,
                    text: "Fiebre + Taquicardia (materna/fetal) + Sensibilidad uterina + Leucocitosis.",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Manejo correcto! Requiere antibióticos IV (Ampicilina/Gentamicina) e interrupción del embarazo.",
                        discard: "Error Crítico: Ignorar la corioamnionitis lleva a sepsis neonatal y choque séptico materno."
                    }
                }
            ],
            perla_enarm: {
                title: "Criterios de Gibbs",
                text: "Indispensable: Fiebre materna ≥38°C + 2 de: Taquicardia Materna, Taquicardia Fetal, Sensibilidad Uterina, Líquido fétido.",
                gpc_ref: "GPC Diagnóstico y Tratamiento de Corioamnionitis"
            }
        }
    },
    {
        id: "gyn_infection_vaginitis_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [18, 50],
                mood_options: ["incómoda", "con prurito"],
                bio_templates: [
                    "Consulta por flujo vaginal blanquecino, espeso, tipo 'queso cottage' y prurito intenso de {duration} días.",
                    "Refiere flujo grisáceo con mal olor (a pescado) que aumenta tras el coito. Niega prurito."
                ],
                duration_options: ["3", "5"],
                vitals: {
                    TA: ["110/70"],
                    FC: ["75 lpm"],
                    Temp: ["36.5°C"]
                },
                details_templates: [
                    "PH vaginal de 4.0. Al microscopio se observan hifas y levaduras. Cérvix normal.",
                    "PH vaginal de 5.5. Prueba de KOH (Whiff test) positiva. Se observan 'Células Clave' (Clue Cells)."
                ],
            },
            differentials: [
                {
                    title: "A) Candidiasis Vaginal",
                    is_match: true,
                    text: "Flujo grumoso + PH <4.5 + Prurito. Tx: Azoles (Miconazol/Fluconazol).",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Match! La acidez (PH <4.5) es típica de Candida.",
                        discard: "Error: No reconocer el flujo en 'queso cottage' es un fallo básico en ginecología."
                    }
                },
                {
                    title: "B) Vaginosis Bacteriana (Gardnerella)",
                    is_match: true,
                    text: "Flujo gris + Mal olor + PH >4.5 + Células Clave. Tx: Metronidazol.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! Las Clue Cells son el dato patognomónico de la Vaginosis.",
                        discard: "Error: Ignorar el PH alcalino y las células clave lleva a un diagnóstico erróneo."
                    }
                }
            ],
            perla_enarm: {
                title: "Diferencial de Vaginitis",
                text: "Clave PH: PH <4.5 = Candida. PH >4.5 = Vaginosis o Tricomoniasis. Clave Célula: Clue Cell = Vaginosis.",
                gpc_ref: "GPC Diagnóstico y Tratamiento de Infecciones Vaginales"
            }
        }
    },
    {
        id: "gyn_cancer_breast_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [40, 65],
                mood_options: ["preocupada"],
                bio_templates: [
                    "Mujer de {duration} años acude a mastografía de tamizaje anual. Refiere ser tabaquista y nulípara.",
                    "Se realiza mastografía en paciente de {duration} años tras detectar nódulo firme e indoloro en cuadrante superior externo."
                ],
                duration_options: ["45", "52", "60"],
                vitals: {
                    TA: ["120/80"],
                    FC: ["70 lpm"],
                    Temp: ["36.5°C"]
                },
                details_templates: [
                    "Reporte de mastografía: Nódulo circunscrito de 1cm con microcalcificaciones pleomórficas agrupadas. Clasificado como BI-RADS 4.",
                    "Se observa asimetría focal con distorsión de la arquitectura. Categoría BI-RADS 5. ¿Cuál es el siguiente paso?"
                ],
            },
            differentials: [
                {
                    title: "A) Biopsia Percutánea (Trucut)",
                    is_match: true,
                    text: "BI-RADS 4 y 5 requieren confirmación histopatológica inmediata mediante biopsia con aguja gruesa.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! El diagnóstico definitivo es histopatológico. Nunca se debe retrasar ante una sospecha BI-RADS 4/5.",
                        discard: "Error grave: Ante un BI-RADS 4 o 5, el seguimiento a 6 meses es negligencia. Requiere biopsia."
                    }
                },
                {
                    title: "B) Seguimiento en 6 meses (BI-RADS 3)",
                    is_match: false,
                    text: "Conducta ante hallazgos probablemente benignos (<2% riesgo de malignidad).",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. En este caso el reporte es BI-RADS 4/5 (Sospechoso/Sugestivo), lo que obliga a biopsia inmediata.",
                        discard: "¡Bien! Diferenciaste el seguimiento (BI-RADS 3) de la acción agresiva (BI-RADS 4+)."
                    }
                }
            ],
            perla_enarm: {
                title: "BI-RADS y Conducta",
                text: "BI-RADS 1-2: Rutina. BI-RADS 3: Seguimiento 6 meses. BI-RADS 4-5: BIOPSIA obligatoria.",
                gpc_ref: "GPC Prevención y Diagnóstico del Cáncer de Mama"
            }
        }
    },
    {
        id: "gyn_cancer_cervical_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [25, 45],
                mood_options: ["tranquila"],
                bio_templates: [
                    "Acude por resultado de citología cervical (Papanicolaou) de rutina. Inicio de VSA a los 16 años.",
                    "Mujer de {duration} años con reporte de citología reciente que indica Lesión Intraepitelial Escamosa de Bajo Grado (LSIL)."
                ],
                duration_options: ["28", "35", "42"],
                vitals: {
                    TA: ["110/70"],
                    FC: ["72 lpm"],
                    Temp: ["36.4°C"]
                },
                details_templates: [
                    "Citología reporta HSIL (Lesión de Alto Grado). Durante colposcopia se observa zona de transformación tipo 2 con epitelio acetoblanco denso.",
                    "Reporte de Papanicolaou con NIC 2 (Neoplasia Intraepitelial Grado 2). ¿Cuál es la conducta terapéutica?"
                ],
            },
            differentials: [
                {
                    title: "A) Colposcopia con Biopsia Dirigida",
                    is_match: true,
                    text: "Ante HSIL o LSIL persistente, el estándar de oro es la visualización colposcópica y toma de biopsia.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Logrado! La colposcopia permite localizar el sitio exacto de la lesión para normar el tratamiento quirúrgico (cono).",
                        discard: "Error: No se puede tratar una lesión de alto grado sin corroboración histológica previa o tratamiento escisional."
                    }
                },
                {
                    title: "B) Conización Cervical (LLETZ/Frío)",
                    is_match: true,
                    text: "Tratamiento de elección para NIC 2 y NIC 3 (lesiones de alto grado) para asegurar márgenes libres.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! En NIC 2 o 3 el objetivo es la remoción de la zona de transformación.",
                        discard: "Error: Ignorar una lesión de alto grado permite la progresión a cáncer invasor."
                    }
                }
            ],
            perla_enarm: {
                title: "Citología: Bethesda 2014",
                text: "Clave: LSIL (Bajo grado) suele vigilarse o colposcopia según edad. HSIL (Alto grado) SIEMPRE va a colposcopia/biopsia/tratamiento.",
                gpc_ref: "NOM-014-SSA2-1994 Prevención Cacu"
            }
        }
    },
    {
        id: "neur_stroke_ischemic_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [55, 80],
                mood_options: ["afásico", "confundido"],
                bio_templates: [
                    "Traído por familiares por presentar desviación de la comisura bucal y pérdida de fuerza en hemicuerpo derecho de {duration} horas de evolución.",
                    "Paciente con antecedente de FA que súbitamente presenta dificultad para hablar y debilidad en brazo izquierdo."
                ],
                duration_options: ["2", "3", "5"],
                vitals: {
                    TA: ["170/90 mmHg"],
                    FC: ["110 lpm (irregular)"],
                    Temp: ["36.6°C"]
                },
                details_templates: [
                    "Escala de Cincinnati positiva. TC de cráneo simple reporta ausencia de áreas hemorrágicas. Glucosa capilar 110 mg/dl.",
                    "Inició con los síntomas hace exactamente 2.5 horas. El paciente es candidato potencial a terapia de reperfusión."
                ],
            },
            differentials: [
                {
                    title: "A) ACV Isquémico (Ventana de Fibrinolisis)",
                    is_match: true,
                    text: "Sintomatología focal <4.5 horas + TC sin hemorragia. Manejo: rTPA (Alteplase).",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! La ventana de 4.5 horas es sagrada en el ENARM para el uso de fibrinolíticos.",
                        discard: "Error Crítico: No activar el código ICTUS en ventana arriesga discapacidad permanente."
                    }
                },
                {
                    title: "B) Hemorragia Intracraneal",
                    is_match: false,
                    text: "Clínica similar pero TC mostraría hiperdensidad súbita.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. La TC simple es el primer paso justamente para DESCARTAR la hemorragia antes de fibrinar.",
                        discard: "¡Bien! La TC negativa a sangre confirma el origen isquémico temprano."
                    }
                }
            ],
            perla_enarm: {
                title: "Ventana de rTPA",
                text: "Tiempo es Cerebro: La ventana ideal es <3h, extendida hasta 4.5h en casos seleccionados. Contraindicación absoluta: TA >185/110 persistente.",
                gpc_ref: "GPC Diagnóstico y Tratamiento de ACV Isquémico"
            }
        }
    },
    {
        id: "neur_headache_thunder_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Femenino", "Masculino"],
                age_range: [30, 50],
                mood_options: ["con dolor atroz"],
                bio_templates: [
                    "Presenta la 'peor cefalea de su vida', de inicio súbito tras realizar esfuerzo físico (maniobra de Valsalva).",
                    "Cefalea en trueno que alcanza intensidad máxima en menos de 1 minuto. Presenta náuseas, vómito y rigidez de nuca."
                ],
                duration_options: ["1 hora"],
                vitals: {
                    TA: ["160/100 mmHg"],
                    FC: ["95 lpm"],
                    Temp: ["37.2°C"]
                },
                details_templates: [
                    "Examen físico: Signos de Kerning y Brudzinski positivos. Fondo de ojo sin papiledema inicial.",
                    "TC simple de cráneo muestra hiperdensidad en cisternas de la base y polígono de Willis."
                ],
            },
            differentials: [
                {
                    title: "A) Hemorragia Subaracnoidea (HSA)",
                    is_match: true,
                    text: "Cefalea en trueno + Irritación meníngea. Causa principal: Rotura de aneurisma sacular.",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Manejo Perfecto! La HSA es una emergencia neuroquirúrgica. La TC es el primer estudio.",
                        discard: "Error Fatal: Ignorar la 'peor cefalea de la vida' suele ser catastrófico."
                    }
                },
                {
                    title: "B) Migraña con Aura",
                    is_match: false,
                    text: "Dolor pulsátil de inicio gradual, precedido por escotomas. No es súbito ni 'en trueno'.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. Nunca diagnostiques migraña en una cefalea súbita explosiva. Es HSA hasta demostrar lo contrario.",
                        discard: "¡Bien! El inicio súbito es el red flag que descarta la migraña."
                    }
                }
            ],
            perla_enarm: {
                title: "Cefalea en Trueno",
                text: "Si la TC es NEGATIVA pero la sospecha de HSA es alta, el siguiente paso es la PUNCIÓN LUMBAR buscando xantocromía.",
                gpc_ref: "GPC Manejo de la Hemorragia Subaracnoidea"
            }
        }
    },
    {
        id: "psyc_dep_suicide_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino"],
                age_range: [20, 70],
                mood_options: ["desesperanzado", "abatido"],
                bio_templates: [
                    "Acude por pérdida de interés en sus actividades desde hace 1 mes. Refiere insomnio de despertar temprano y sentimientos de culpa.",
                    "Paciente que ha regalado sus pertenencias y refiere que 'su familia estaría mejor sin él'. Presenta anhedonia severa."
                ],
                duration_options: ["4 semanas"],
                vitals: {
                    TA: ["120/80"],
                    FC: ["80 lpm"],
                    Temp: ["36.5°C"]
                },
                details_templates: [
                    "Al interrogatorio directo admite tener un plan estructurado para quitarse la vida mediante ingesta de fármacos.",
                    "Antecedente de intento suicida previo. Presenta descuido en su higiene personal y falta de energía (aprovechamiento)."
                ],
            },
            differentials: [
                {
                    title: "A) Depresión Mayor con Riesgo Suicida Agudo",
                    is_match: true,
                    text: "Sintomatología depresiva >2 semanas + Plan/Ideación suicida. Requiere hospitalización o vigilancia estrecha.",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! La seguridad del paciente es prioridad. Si hay plan estructurado, no se debe enviar a casa solo.",
                        discard: "Error: Ignorar la ideación suicida en un paciente con plan es una omisión grave en psiquiatría."
                    }
                },
                {
                    title: "B) Duelo Normal",
                    is_match: false,
                    text: "Reacción a pérdida; la funcionalidad suele mantenerse y no hay ideación suicida estructurada.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. El plan suicida y la anhedonia profunda inclinan la balanza hacia Trastorno Depresivo Mayor.",
                        discard: "¡Bien! Identificaste que el plan suicida marca la patología."
                    }
                }
            ],
            perla_enarm: {
                title: "Pregunta por el Suicidio",
                text: "Mito ENARM: Preguntar sobre el suicidio NO incita al paciente a hacerlo; al contrario, reduce el riesgo al permitir intervención.",
                gpc_ref: "GPC Diagnóstico y Tratamiento de la Depresión"
            }
        }
    },
    {
        id: "psyc_psi_schizo_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [18, 30],
                mood_options: ["desorganizado", "extraño"],
                bio_templates: [
                    "Familiares refieren que el paciente escucha voces que le dan órdenes y se ha aislado socialmente desde hace 8 meses.",
                    "Presenta delirios de persecución, afirma que el gobierno le ha implantado un chip. Habla incoherencias y tiene afecto aplanado."
                ],
                duration_options: ["8 meses"],
                vitals: {
                    TA: ["120/80"],
                    FC: ["90 lpm"],
                    Temp: ["36.8°C"]
                },
                details_templates: [
                    "No se identifican causas médicas ni consumo de sustancias tras toxicología negativa. Deterioro evidente de la funcionalidad.",
                    "Durante la entrevista presenta soliloquios y refiere que los comerciales de TV tienen mensajes dirigidos a él (referencia)."
                ],
            },
            differentials: [
                {
                    title: "A) Esquizofrenia",
                    is_match: true,
                    text: "Síntomas psicóticos (alucinaciones/delirios) con duración >6 meses y deterioro funcional.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Asiduo! El criterio temporal (>6 meses) es lo que define la esquizofrenia frente a otros trastornos psicóticos.",
                        discard: "Error: No considerar el tiempo llevó a un diagnóstico impreciso."
                    }
                },
                {
                    title: "B) Trastorno Psicótico Breve",
                    is_match: false,
                    text: "Psicosis súbita con duración MENOR a 1 mes, usualmente tras evento estresante.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. El paciente lleva 8 meses con síntomas; el psicótico breve se resuelve en menos de 30 días.",
                        discard: "¡Bien! El factor tiempo fue el diferenciador."
                    }
                }
            ],
            perla_enarm: {
                title: "Psicosis: El Reloj es Clave",
                text: "<1 mes = Psicótico Breve. 1-6 meses = Esquizofreniforme. >6 meses = Esquizofrenia.",
                gpc_ref: "Guía de Práctica Clínica Salud Mental"
            }
        }
    },
    {
        id: "card_sca_iamcest_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Masculino"],
                age_range: [45, 75],
                mood_options: ["diaforético", "con angustia de muerte"],
                bio_templates: [
                    "Acude por dolor precordial opresivo irradiado a mandíbula de {duration} minutos de evolución. Presenta náuseas y sudoración fría.",
                    "Paciente con antecedente de tabaquismo y HAS. Refiere dolor retroesternal intenso que no cede con el reposo."
                ],
                duration_options: ["40", "60", "90"],
                vitals: {
                    TA: ["100/60 mmHg (en descenso)"],
                    FC: ["95 lpm"],
                    Temp: ["36.5°C"]
                },
                details_templates: [
                    "ECG muestra elevación del segmento ST de 3mm en V1, V2, V3 y V4. Imagen recíproca en II, III y aVF.",
                    "Se encuentra en un centro de salud sin sala de hemodinamia. El hospital con ICP más cercano está a 3 horas de distancia."
                ],
            },
            differentials: [
                {
                    title: "A) IAMCEST (Fibrinolisis Sistémica)",
                    is_match: true,
                    text: "IAMCEST Cara Anterior. Si la ICP >120 min de retraso, se opta por Fibrinolisis (Alteplase).",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! En el ENARM, si el tiempo a ICP es >120 min (o 90 min en centros grandes), la FIBRINOLISIS es la respuesta correcta.",
                        discard: "Error Crítico: Retrasar la reperfusión esperando un traslado inviable causa necrosis miocárdica irreversible."
                    }
                },
                {
                    title: "B) Angina Inestable",
                    is_match: false,
                    text: "Dolor isquémico SIN elevación del ST y SIN elevación de troponinas.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. La elevación del ST en el ECG es diagnóstica de INFARTO (IAMCEST), no de angina.",
                        discard: "¡Bien! El ST elevado marca la pauta de tratamiento invasivo inmediato."
                    }
                }
            ],
            perla_enarm: {
                title: "Tiempos en IAMCEST",
                text: "Puerta-Balón (ICP): <90 min (estándar). Puerta-Aguja (Fibrinolisis): <30 min. Si ICP >120 min de retraso total: FIBRINAR.",
                gpc_ref: "GPC Diagnóstico y Tratamiento del Infarto Agudo de Miocardio"
            }
        }
    },
    {
        id: "endo_dm2_cad_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [15, 30],
                mood_options: ["obnubilado", "deshidratado"],
                bio_templates: [
                    "Familiar refiere poliuria y polidipsia de 1 semana. El paciente presenta respiración profunda y rápida (Kussmaul) y aliento a frutas.",
                    "Paciente con DM conocido que suspende insulina. Llega con dolor abdominal, náuseas y vómito."
                ],
                duration_options: ["24 horas"],
                vitals: {
                    TA: ["90/60 mmHg"],
                    FC: ["120 lpm"],
                    Temp: ["37.5°C"]
                },
                details_templates: [
                    "Laboratorio: Glucosa 450 mg/dl, PH 7.15, HCO3 12 mEq/L. Cetonas en orina ++++. Brecha aniónica aumentada.",
                    "Paciente con deshidratación grado 2. Se inicia protocolo de manejo metabólico urgente."
                ],
            },
            differentials: [
                {
                    title: "A) Cetoacidosis Diabética (CAD)",
                    is_match: true,
                    text: "Triada: Hiperglucemia + Acidosis Metabólica (Anion Gap ↑) + Cetonemia/Cetonuria.",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! El manejo es hidratación agresiva seguida de insulina IV y monitoreo de potasio.",
                        discard: "Error: Ignorar la acidosis y las cetonas lleva a un manejo incompleto con riesgo de muerte."
                    }
                },
                {
                    title: "B) Estado Hiperosmolar Hiperglucémico (EHH)",
                    is_match: false,
                    text: "Hiperglucemia extrema (>600) + Osmolaridad ↑ (>320). Típico de DM2 ancianos SIN acidosis severa.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. La CAD tiene acidosis y cetonuria; el EHH no suele presentar acidosis metabólica severa.",
                        discard: "¡Bien! Diferenciaste los dos estados según el PH y las cetonas."
                    }
                }
            ],
            perla_enarm: {
                title: "Manejo de Potasio en CAD",
                text: "Regla de Oro: Si el K <3.3 mEq/L, NO inicies insulina; repón K primero para evitar parálisis respiratoria o arritmias fatales.",
                gpc_ref: "GPC Diagnóstico y Tratamiento de la CAD y EHH"
            }
        }
    },
    {
        id: "endo_dm2_management_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [45, 65],
                mood_options: ["asintomático"],
                bio_templates: [
                    "Paciente con DM2 de 5 años de evolución en manejo con Metformina 850 mg c/12h. Su HbA1c actual es de 8.2%.",
                    "Acude a control. Presenta antecedente de infarto previo y tiene IMC de 32. Su tratamiento actual es insuficiente."
                ],
                duration_options: ["3 meses"],
                vitals: {
                    TA: ["130/80 mmHg"],
                    FC: ["72 lpm"],
                    Temp: ["36.5°C"]
                },
                details_templates: [
                    "TFG reportada en 75 mL/min/1.73m². El paciente desea un fármaco que le ayude a bajar de peso y proteja su corazón.",
                    "No tiene antecedentes de pancreatitis. Se busca intensificar tratamiento según las últimas guías ADA/GPC."
                ],
            },
            differentials: [
                {
                    title: "A) Agregar Agonista GLP-1 (Liraglutida/Semaglutida)",
                    is_match: true,
                    text: "Indicado en DM2 con riesgo cardiovascular establecido y obesidad. Excelente control de HbA1c.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! En pacientes con enfermedad CV o deseo de bajar de peso, los GLP-1 son la elección actual sobre las sulfonilureas.",
                        discard: "Error: Ignoraste el beneficio cardioprotector y la obesidad del paciente al elegir otro fármaco."
                    }
                },
                {
                    title: "B) Agregar Sulfonilurea (Glibenclamida)",
                    is_match: false,
                    text: "Eficaz para bajar glucosa, pero causa ganancia de peso y riesgo alto de hipoglucemia. No tiene beneficio CV.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No es la mejor opción. Aunque baja la glucosa, el paciente tiene obesidad y riesgo CV; hay fármacos superiores.",
                        discard: "¡Bien! Evitaste el riesgo de hipoglucemia y la ganancia de peso innecesaria."
                    }
                }
            ],
            perla_enarm: {
                title: "Algoritmo ADA: Cardio-Nefroprotección",
                text: "Si hay ECV establecida → GLP-1 o iSGLT2. Si hay Falla Cardíaca o ERC (Nefropatía) → iSGLT2 (Empagliflozina).",
                gpc_ref: "ADA Standards of Care in Diabetes"
            }
        }
    },
    {
        id: "gast_mesenteric_ischemia_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [60, 85],
                mood_options: ["con dolor severo"],
                bio_templates: [
                    "Acude por dolor abdominal de inicio súbito, periumbilical, de intensidad 10/10. Tiene antecedente de Fibrilación Auricular.",
                    "Paciente anciano con antecedente de tabaquismo y cardiopatía isquémica. Presenta dolor abdominal atroz que no mejora con analgésicos."
                ],
                duration_options: ["2", "4", "6"],
                vitals: {
                    TA: ["100/60 mmHg"],
                    FC: ["120 lpm (arrítmico)"],
                    Temp: ["37.0°C"]
                },
                details_templates: [
                    "Al examen físico: El abdomen está blando, depresible, sin rebote ni defensa muscular notable ('mismatch' dolor-clínica).",
                    "Se sospecha etiología embólica. Se solicita Angio-TC de abdomen de forma urgente."
                ],
            },
            differentials: [
                {
                    title: "A) Isquemia Mesentérica Aguda",
                    is_match: true,
                    text: "Dolor desproporcionado a la exploración física + Factores de riesgo embólico (FA).",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Excelente ojo clínico! El 'abdomen blando' con dolor 10/10 es la pista clásica para Isquemia Mesentérica.",
                        discard: "Error Crítico: El retraso en el diagnóstico de isquemia mesentérica conlleva una mortalidad >80% por necrosis intestinal."
                    }
                },
                {
                    title: "B) Volvulus de Sigmoides",
                    is_match: false,
                    text: "Causa obstrucción intestinal, distensión severa y signo de 'grano de café' en Rayos X. No suele ser súbito sin distensión.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. El vólvulo causaría una distensión abdominal marcada, lo cual no coincide con el 'abdomen blando' reportado.",
                        discard: "¡Bien! El antecedente de FA te orientó correctamente hacia un evento vascular."
                    }
                }
            ],
            perla_enarm: {
                title: "Isquemia: El Gran Mismatch",
                text: "Clave ENARM: Dolor 10/10 + Abdomen depresible/asintomático a la palpación = ISQUEMIA MESENTÉRICA. Pedir Angio-TC.",
                gpc_ref: "GPC Diagnóstico de Abdomen Agudo Vascular"
            }
        }
    },
    {
        id: "gast_diverticulitis_hinchey_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [50, 75],
                mood_options: ["con dolor en FII"],
                bio_templates: [
                    "Acude por dolor en fosa ilíaca izquierda, fiebre de 38.3°C y estreñimiento de 3 días.",
                    "Paciente con antecedente de enfermedad diverticular. Presenta dolor punzante en cuadrante inferior izquierdo y leucocitosis."
                ],
                duration_options: ["48 horas"],
                vitals: {
                    TA: ["130/85 mmHg"],
                    FC: ["92 lpm"],
                    Temp: ["38.5°C"]
                },
                details_templates: [
                    "TC de abdomen reporta inflamación pericólica con presencia de un absceso de 5cm localizado (Hinchey II).",
                    "Se observa aire libre subdiafragmático y datos de irritación peritoneal generalizada (Hinchey III/IV)."
                ],
            },
            differentials: [
                {
                    title: "A) Diverticulitis Hinchey II (Drenaje Percutáneo)",
                    is_match: true,
                    text: "Absceso >4cm requiere drenaje guiado por imagen + antibióticos IV.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! Los abscesos pequeños se manejan con antibióticos, pero >4cm requieren drenaje percutáneo.",
                        discard: "Error: No drenar un absceso de ese tamaño aumenta el riesgo de perforación y peritonitis."
                    }
                },
                {
                    title: "B) Diverticulitis Hinchey III/IV (Cirugía - Hartmann)",
                    is_match: true,
                    text: "Peritonitis purulenta o fecaloide requiere cirugía de urgencia (Procedimiento de Hartmann).",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Manejo correcto de urgencia! La peritonitis generalizada es una indicación quirúrgica absoluta.",
                        discard: "Error fatal: Intentar manejo conservador en una peritonitis generalizada causará choque séptico."
                    }
                }
            ],
            perla_enarm: {
                title: "Hinchey y Manejo",
                text: "Hinchey I: Médico. Hinchey II: Drenaje (>4cm). Hinchey III/IV: Cirugía (Hartmann).",
                gpc_ref: "GPC Diagnóstico y Tratamiento de Enfermedad Diverticular"
            }
        }
    },
    {
        id: "surg_trauma_atls10_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Masculino"],
                age_range: [20, 45],
                mood_options: ["disneico", "cianótico"],
                bio_templates: [
                    "Llega tras accidente automovilístico a alta velocidad. Presenta dificultad respiratoria severa, desviación traqueal a la derecha y ausencia de murmullo vesicular izquierdo.",
                    "Paciente con trauma torácico penetrante. Se observa ingurgitación yugular, hipotensión (80/40) y timpanismo a la percusión del hemitórax derecho."
                ],
                duration_options: ["Inmediato"],
                vitals: {
                    TA: ["80/50 mmHg"],
                    FC: ["130 lpm"],
                    Temp: ["36.2°C"]
                },
                details_templates: [
                    "Bajo estándares de ATLS 10ª Edición, se identifica Neumotórax a Tensión. ¿Cuál es el sitio de descompresión inmediata con aguja?",
                    "El paciente presenta choque obstructivo. Se debe realizar descompresión urgente sin esperar radiografía."
                ],
            },
            differentials: [
                {
                    title: "A) Descompresión en 5º Espacio Intercostal (LAA/LAM)",
                    is_match: true,
                    text: "ATLS 10ª Edición (2024): El sitio preferido es el 5º espacio intercostal en la línea axilar anterior o media.",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! Estás actualizado con el ATLS 10. El 5º espacio es ahora el estándar para evitar lesiones y asegurar éxito.",
                        discard: "Error Crítico: El 5º espacio es el sitio recomendado actualmente para minimizar fallos en la descompresión."
                    }
                },
                {
                    title: "B) Descompresión en 2º Espacio Intercostal (LMC)",
                    is_match: false,
                    text: "Sitio recomendado en versiones antiguas (ATLS 9ª y previas). Menos efectivo por grosor de pared.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. Aunque se usó por años, el ATLS 10ª ahora prioriza el 5º espacio intercostal.",
                        discard: "¡Bien! Notaste el cambio normativo crítico del ATLS 10."
                    }
                }
            ],
            perla_enarm: {
                title: "ATLS 10: El Cambio del Espacio",
                text: "Neumotórax a Tensión: Punción inmediata en 5º Espacio Intercostal (Línea Axilar Anterior/Media). NO esperar Rayos X.",
                gpc_ref: "ATLS 10th Edition Student Course Manual"
            }
        }
    },
    {
        id: "surg_appendicitis_alvarado_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [15, 35],
                mood_options: ["con dolor en FID"],
                bio_templates: [
                    "Inicia con dolor epigástrico que migra a fosa ilíaca derecha. Presenta náuseas, anorexia y fiebre de 38.2°C.",
                    "Paciente con dolor abdominal agudo. Al examen: Punto de McBurney (+) y signo de Rovsing (+). Leucocitosis de 14,000 con neutrofilia."
                ],
                duration_options: ["12 horas"],
                vitals: {
                    TA: ["120/80"],
                    FC: ["100 lpm"],
                    Temp: ["38.3°C"]
                },
                details_templates: [
                    "Cálculo de Escala de Alvarado: Migración (1), Anorexia (1), Náusea (1), McBurney (2), Rebote (1), Fiebre (1), Leucocitosis (2). Total: 9/10.",
                    "Puntuación de Alvarado ≥8. ¿Cuál es la conducta recomendada en un hombre adulto?"
                ],
            },
            differentials: [
                {
                    title: "A) Apendicectomía (Sin necesidad de imagen extra)",
                    is_match: true,
                    text: "En hombres adultos con Alvarado ≥8, la probabilidad es >95%. Indicación quirúrgica directa.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! En hombres con cuadro clásico, la cirugía directa es costo-efectiva. En mujeres se prefiere USG inicial.",
                        discard: "Error: No retraces la cirugía en un cuadro clínico tan evidente e irrefutable."
                    }
                },
                {
                    title: "B) Observación y Antibióticos",
                    is_match: false,
                    text: "No es la conducta estándar ante una sospecha tan alta de apendicitis aguda no complicada.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. La apendicectomía sigue siendo el estándar de oro quirúrgico ante Alvarado >8.",
                        discard: "¡Bien! El manejo expectante en apendicitis confirmada es arriesgado."
                    }
                }
            ],
            perla_enarm: {
                title: "Alvarado: MANTREM",
                text: "M: Migración (1), A: Anorexia (1), N: Náusea (1), T: Tenderness/Dolor FID (2), R: Rebote (1), E: Elevación temp (1), M: Modif. WBC (2).",
                gpc_ref: "GPC Diagnóstico de Apendicitis Aguda"
            }
        }
    },
    {
        id: "surg_biliary_colangitis_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [40, 70],
                mood_options: ["ictérica", "obnubilada"],
                bio_templates: [
                    "Paciente con antecedente de colelitiasis que acude por fiebre, dolor en hipocondrio derecho e ictericia (Tríada de Charcot).",
                    "Presenta choque séptico: hipotensión y alteración del estado de alerta, sumado a la tríada de Charcot (Pentada de Reynolds)."
                ],
                duration_options: ["24 horas"],
                vitals: {
                    TA: ["85/50 mmHg"],
                    FC: ["125 lpm"],
                    Temp: ["39.5°C"]
                },
                details_templates: [
                    "USG de hígado y vías biliares muestra colédoco de 12mm con imagen hiperecoica que proyecta sombra acústica en su interior.",
                    "Leucocitosis de 22,000, Bilirrubina Total 5.2 mg/dl a expensas de Directa. ¿Cuál es el tratamiento definitivo urgente?"
                ],
            },
            differentials: [
                {
                    title: "A) ERCP (Drenaje Biliar Urgente)",
                    is_match: true,
                    text: "La colangitis obstructiva (especialmente Reynolds) requiere descompresión biliar endoscópica inmediata.",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Salvación lograda! El drenaje biliar es lo único que detiene la sepsis en una colangitis obstructiva.",
                        discard: "Error Fatal: La colecistectomía en fase aguda de colangitis SIN drenar el colédoco tiene altísima mortalidad."
                    }
                },
                {
                    title: "B) Colecistectomía Laparoscópica Urgente",
                    is_match: false,
                    text: "La colecistectomía es para la COLECISTITIS. En COLANGITIS, el problema está en el colédoco y debe drenarse primero.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. Operar la vesícula no resuelve la obstrucción del colédoco que causa la sepsis.",
                        discard: "¡Bien! Diferenciaste el manejo de la inflamación vesicular del drenaje de la vía biliar."
                    }
                }
            ],
            perla_enarm: {
                title: "Charcot vs Reynolds",
                text: "Charcot: Fiebre, Ictericia, Dolor. Reynolds: Charcot + Hipotensión + Confusión (Mortalidad >50% sin ERCP).",
                gpc_ref: "GPC Diagnóstico y Manejo de la Colangitis"
            }
        }
    },
    {
        id: "inf_hiv_art_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [25, 50],
                mood_options: ["preocupado"],
                bio_templates: [
                    "Paciente con diagnóstico reciente de VIH. Acude para inicio de tratamiento. Se encuentra asintomático actualmente.",
                    "Usuario de drogas IV con pérdida de peso y candidiasis oral persistente. ELISA y Western Blot positivos para VIH."
                ],
                duration_options: ["1 mes"],
                vitals: {
                    TA: ["120/80"],
                    FC: ["72 lpm"],
                    Temp: ["36.7°C"]
                },
                details_templates: [
                    "Conteo de CD4: 350 cél/mm³. Carga viral: 50,000 copias/mL. ¿Cuál es la conducta recomendada respecto al inicio de ART?",
                    "Independientemente del conteo de CD4, el paciente solicita iniciar tratamiento. No tiene antecedentes de ERC."
                ],
            },
            differentials: [
                {
                    title: "A) Iniciar ART Inmediatamente (Tratamiento Universal)",
                    is_match: true,
                    text: "Guías actuales (GPC/WHO): Se recomienda iniciar ART en TODOS los pacientes, sin importar el nivel de CD4.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! El inicio temprano reduce la transmisión y mejora el pronóstico a largo plazo.",
                        discard: "Error: Diferir el tratamiento hasta que el CD4 baje de 200 ya no es la práctica estándar."
                    }
                },
                {
                    title: "B) Diferir inicio hasta CD4 <200 (SIDA)",
                    is_match: false,
                    text: "Práctica obsoleta que aumentaba el riesgo de infecciones oportunistas y mortalidad.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. Retrasar el tratamiento es perjudicial según la evidencia más reciente.",
                        discard: "¡Bien! Reconociste el cambio hacia el tratamiento universal proactivo."
                    }
                }
            ],
            perla_enarm: {
                title: "VIH: Inicio de ART",
                text: "Regla ENARM: Inicio de ART en TODO paciente diagnosticado, sin importar CD4. Esquema preferente: 2 ITNR + 1 INSTI (Dolutegravir).",
                gpc_ref: "GPC Tratamiento Antirretroviral del Adulto con VIH"
            }
        }
    },
    {
        id: "inf_sepsis_sofa_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Femenino", "Masculino"],
                age_range: [60, 85],
                mood_options: ["confundido", "aletargado"],
                bio_templates: [
                    "Ingresa por cuadro de neumonía. Presenta alteración del estado de alerta, FR 24 y TA sistólica de 90 mmHg (qSOFA positivo).",
                    "Paciente post-operado de apendicectomía con fiebre, taquicardia y oliguria. Presenta lactato sérico de 4.5 mmol/L."
                ],
                duration_options: ["6 horas"],
                vitals: {
                    TA: ["85/50 mmHg"],
                    FC: ["115 lpm"],
                    Temp: ["39.0°C"]
                },
                details_templates: [
                    "Sepsis-3: Se identifica disfunción orgánica mediante aumento de ≥2 puntos en escala SOFA. ¿Cuál es el primer paso en el manejo?",
                    "Se han administrado 30 mL/kg de cristaloides y persiste hipotensión sistólica. Requiere soporte vasopresor."
                ],
            },
            differentials: [
                {
                    title: "A) Bundle de 1 Hora (Cultivos, AB Empírico, Cristaloides)",
                    is_match: true,
                    text: "Resucitación inicial agresiva: Toma de lactato, cultivos, antibióticos de amplio espectro y fluidos IV.",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Manejo Gold Standard! Cada hora de retraso en los antibióticos aumenta la mortalidad drásticamente.",
                        discard: "Error Fatal: El retraso en la administración de fluidos y antibióticos en sepsis es inaceptable."
                    }
                },
                {
                    title: "B) Administrar Esteroide IV Inmediatamente",
                    is_match: false,
                    text: "Solo se consideran en choque séptico REFRACTARIO a fluidos y vasopresores. No es manejo inicial.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. Los esteroides son terapia de rescate avanzada, no parte del bundle inicial de 1 hora.",
                        discard: "¡Bien! Priorizaste la resucitación con fluidos y antibióticos."
                    }
                }
            ],
            perla_enarm: {
                title: "Sepsis-3: Choque Séptico",
                text: "Definición: Sepsis + Necesidad de vasopresores para PAM ≥65 + Lactato >2 mmol/L pese a reanimación volémica.",
                gpc_ref: "Surviving Sepsis Campaign Guidelines 2021"
            }
        }
    },
    {
        id: "inf_meningitis_bacterial_001",
        difficulty: "hard",
        mode: "shock_room",
        template: {
            patient: {
                sex_options: ["Masculino"],
                age_range: [20, 45],
                mood_options: ["con fotofobia", "confuso"],
                bio_templates: [
                    "Acude por cefalea intensa, fiebre de 39°C y rigidez de nuca. Se observan petequias en extremidades inferiores.",
                    "Presenta signos de Kernig y Brudzinski positivos. Al interrogatorio refiere haber estado en un dormitorio militar recientemente."
                ],
                duration_options: ["24 horas"],
                vitals: {
                    TA: ["110/70 mmHg"],
                    FC: ["105 lpm"],
                    Temp: ["39.4°C"]
                },
                details_templates: [
                    "LCR: Aspecto turbio, 1500 leucos (90% PMN), Glucosa 20 mg/dl, Proteínas 150 mg/dl. ¿Cuál es el manejo empírico?",
                    "Se sospecha N. meningitidis. Se debe iniciar tratamiento y aislamiento de gotitas inmediatamente."
                ],
            },
            differentials: [
                {
                    title: "A) Ceftriaxona + Vancomicina + Dexametasona",
                    is_match: true,
                    text: "Tratamiento empírico estándar para meningitis bacteriana comunitaria. Dexametasona previene secuelas (sordera).",
                    safety_flags: { lethal_risk: true, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! La administración de Dexametasona antes o con la primera dosis de AB es vital para el pronóstico.",
                        discard: "Error: Omitir la vancomicina arriesga fallo ante neumococos resistentes, y sin esteroides aumentan las secuelas."
                    }
                },
                {
                    title: "B) Aciclovir IV",
                    is_match: false,
                    text: "Tratamiento para Encefalitis herpética (hallazgos LCR suelen ser linfocitosis y glucosa normal).",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. El LCR es purulento (PMN altísimos, glucosa baja), lo que dicta etiología BACTERIANA.",
                        discard: "¡Bien! Diferenciaste la meningitis bacteriana de la viral/encefalitis."
                    }
                }
            ],
            perla_enarm: {
                title: "LCR: Bacterias vs Virus",
                text: "Bacterias: PMN ↑, Glucosa ↓, Proteínas ↑. Virus: Linfocitos ↑, Glucosa normal, Proteínas levemente ↑.",
                gpc_ref: "GPC Diagnóstico y Tratamiento de Meningitis Bacteriana"
            }
        }
    },
    {
        id: "prev_levels_leavell_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [18, 45],
                mood_options: ["sana"],
                bio_templates: [
                    "Mujer de {duration} años acude a su Unidad de Medicina Familiar para asesoría preventiva. No tiene antecedentes de importancia.",
                    "Se presenta para control de salud. Pregunta por las acciones necesarias para evitar el cáncer cervicouterino."
                ],
                duration_options: ["25", "32"],
                vitals: {
                    TA: ["110/70"],
                    FC: ["68 lpm"],
                    Temp: ["36.5°C"]
                },
                details_templates: [
                    "¿Cuál sería un ejemplo de Prevención PRIMARIA en esta paciente respecto al virus del papiloma humano (VPH)?",
                    "¿Cuál sería un ejemplo de Prevención SECUNDARIA en esta paciente respecto al cáncer cervicouterino?"
                ],
            },
            differentials: [
                {
                    title: "A) Aplicación de Vacuna contra VPH (Primaria)",
                    is_match: true,
                    text: "Prevención Primaria: Acciones dirigidas a evitar la aparición de la enfermedad (vacunación).",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! La vacuna evita la infección; es el pilar de la prevención primaria.",
                        discard: "Error: La detección precoz (Pap) no es prevención primaria, es secundaria."
                    }
                },
                {
                    title: "B) Realización de Citología Cervical / Pap (Secundaria)",
                    is_match: true,
                    text: "Prevención Secundaria: Detección precoz de lesiones en etapas asintomáticas (Tamizaje).",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Logrado! El Papanicolaou busca detectar la enfermedad ya establecida pero incipiente.",
                        discard: "Error: La citología es secundaria, no primaria; no evita la infección inicial."
                    }
                }
            ],
            perla_enarm: {
                title: "Leavell y Clark",
                text: "P1: Vacunas/Estilo Vida. P2: Detección/Tamizaje (Pap, Mastografía). P3: Rehabilitación/Evitar complicaciones.",
                gpc_ref: "Fundamentos de Salud Pública"
            }
        }
    },
    {
        id: "stats_dx_metrics_001",
        difficulty: "hard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [30, 60],
                mood_options: ["analítico"],
                bio_templates: [
                    "Se evalúa una nueva prueba diagnóstica para una enfermedad con prevalencia del 1% en la población general.",
                    "La prueba tiene una Sensibilidad del 90% y una Especificidad del 90%. El resultado del paciente es POSITIVO."
                ],
                duration_options: ["Muestra actual"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["N/A"],
                    Temp: ["N/A"]
                },
                details_templates: [
                    "¿Cuál es la probabilidad de que el paciente realmente tenga la enfermedad (VPP) en este escenario de baja prevalencia?",
                    "Cálculo: De 1000 personas, 10 están enfermas. La prueba detecta 9 (VP). De 990 sanos, falla en 99 (FP). VPP = 9 / (9 + 99)."
                ],
            },
            differentials: [
                {
                    title: "A) Probabilidad BAJA (<10%)",
                    is_match: true,
                    text: "En enfermedades raras, incluso pruebas 'buenas' tienen un Valor Predictivo Positivo (VPP) muy bajo por el peso de los FP.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Cerebro Matemático! Entiendes que el VPP depende críticamente de la prevalencia poblacional.",
                        discard: "Error: Sobreestimaste la precisión. En baja prevalencia, un positivo suele ser falso positivo."
                    }
                },
                {
                    title: "B) Probabilidad ALTA (>90%)",
                    is_match: false,
                    text: "Confundiste la Sensibilidad con el VPP. La prueba es buena detectando enfermos, pero falla ante tantos sanos.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "No. El VPP cae drásticamente cuando la enfermedad es poco frecuente en la muestra.",
                        discard: "¡Bien! Notaste la trampa de la prevalencia."
                    }
                }
            ],
            perla_enarm: {
                title: "VPP y Prevalencia",
                text: "Si la Prevalencia sube → el VPP sube. Si la Prevalencia baja → el VPP baja. Sensibilidad y Especificidad NO cambian con la prevalencia.",
                gpc_ref: "Bioestadística Clínica para el ENARM"
            }
        }
    },
    {
        id: "engl_tech_vocabulary_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [20, 50],
                mood_options: ["bilingüe"],
                bio_templates: [
                    "A patient presents with 'shortness of breath' and progressive 'fatigue' after walking two blocks.",
                    "Examination reveals a 'rash' on the upper limbs and 'wheezing' upon lung auscultation."
                ],
                duration_options: ["N/A"],
                vitals: {
                    TA: ["120/80"],
                    FC: ["78 bpm"],
                    Temp: ["37.0°C"]
                },
                details_templates: [
                    "Term translation check: What is the correct medical equivalent for 'Shortness of Breath' and 'Wheezing' in Spanish?",
                    "False Friend Alert: The patient reports 'Constipation'. Does this refer to nasal congestion or bowel movement issues?"
                ],
            },
            differentials: [
                {
                    title: "A) Disnea y Sibilancias",
                    is_match: true,
                    text: "'Shortness of breath' = Disnea. 'Wheezing' = Sibilancias.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! Dominar estos términos es vital para la sección de inglés técnico del ENARM.",
                        discard: "Error: No confundas 'Wheezing' (sibilancias) con otros ruidos pulmonares."
                    }
                },
                {
                    title: "B) Estreñimiento (Bowel movement issues)",
                    is_match: true,
                    text: "'Constipation' es el falso amigo más común: significa Estreñimiento, NO congestión nasal.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! Evitaste caer en el falso amigo. 'Constipated' nasal se dice 'Congested'.",
                        discard: "Error grave de traducción: Interpretar 'constipation' como gripe nasal puede llevar a errores de prescripción."
                    }
                }
            ],
            perla_enarm: {
                title: "Inglés Médico: False Friends",
                text: "Constipation = Estreñimiento. Injury = Lesión. Sever = Cortar. Informed Consent = Consentimiento Informado.",
                gpc_ref: "ENARM Technical English Section"
            }
        }
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BLUEPRINTS };
}













