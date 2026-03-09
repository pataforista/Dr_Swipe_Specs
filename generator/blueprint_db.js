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
                    // Red flag is only applicable to women, we'll handle this in the generator logic
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
                sex_options: ["Masculino", "Femenino"],
                age_range: [2, 6],
                mood_options: ["irritable", "asténico"],
                bio_templates: [
                    "Madre lo trae por fiebre de {duration} días y exantema que inició en la cara y bajó al tronco.",
                    "Cuadro febril alto, tos, coriza y conjuntivitis. Hoy amanece con rash maculopapular que confluye."
                ],
                duration_options: ["3", "4", "5"],
                vitals: {
                    TA: ["90/60 (Adecuada para edad)", "95/65 (Adecuada para edad)"],
                    FC: ["120 lpm", "130 lpm"],
                    Temp: ["39.0°C", "39.5°C"]
                },
                details_templates: [
                    "A la exploración bucal: lesiones puntiformes blanquecinas en mucosa oral a nivel de 2° molar.",
                    "Esquema de vacunación incompleto (padres antivacunas). Presenta manchas de Koplik."
                ],
            },
            differentials: [
                {
                    title: "A) Sarampión",
                    text: "Pródromo de las 3 'C' (Cough, Coryza, Conjunctivitis) más Manchas de Koplik y exantema cefalocaudal confluente.",
                    is_match: true,
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Correcto! Las manchas de Koplik son patognomónicas. Recuerda dar Vitamina A para reducir complicaciones y mortalidad.",
                        discard: "Error: Ignoraste signos patognomónicos. El Sarampión es altamente contagioso y requiere aislamiento e intervención (Vitamina A)."
                    }
                },
                {
                    title: "B) Rubéola",
                    text: "Exantema maculopapular menos confluente, con adenopatías retroauriculares y occipitales dolorosas.",
                    is_match: false,
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "Falso. La Rubéola se caracteriza más por adenopatías retroauriculares marcadas (y manchas de Forchheimer), no Koplik.",
                        discard: "¡Bien hecho! Diferenciaste el pródromo más severo del Sarampión frente al cuadro más leve de la Rubéola."
                    }
                },
                {
                    title: "C) Escarlatina",
                    text: "Exantema micropapular áspero (piel de lija) con lengua en fresa y palidez perioral, por S. pyogenes.",
                    is_match: false,
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "El antecedente de faringitis exudativa y la 'lengua en fresa' estarían presentes en Escarlatina, no las manchas de Koplik.",
                        discard: "¡Correcto! Descartaste una etiología bacteriana (S. pyogenes) frente a un cuadro claramente viral clásico."
                    }
                }
            ],
            perla_enarm: {
                title: "Vitamina A en Sarampión",
                text: "El uso de Vitamina A en todos los casos de sarampión reduce la morbilidad (especialmente ocular y respiratoria) y la mortalidad. Es una perla ENARM inamovible.",
                gpc_ref: "GPC Diagnóstico Clínico de Enfermedades Exantemáticas en Niños"
            }
        }
    },
    {
        id: "ped_exant_varicella_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [4, 9],
                mood_options: ["quejumbroso", "con mucho prurito"],
                bio_templates: [
                    "Presenta lesiones pruriginosas generalizadas de {duration} días de evolución, con fiebre leve.",
                    "Cuadro eruptivo que inició en tronco y cuero cabelludo, diseminándose al resto del cuerpo."
                ],
                duration_options: ["2", "3"],
                vitals: {
                    TA: ["100/65", "90/60"],
                    FC: ["110 lpm", "100 lpm"],
                    Temp: ["38.0°C", "38.5°C"]
                },
                details_templates: [
                    "En su piel se observan máculas, pápulas, vesículas (gotas de rocío) y algunas costras al mismo tiempo.",
                    "Lesiones en patrón de 'Cielo Estrellado' (pleomorfismo regional). Madre pregunta qué medicamento para la fiebre puede darle."
                ],
            },
            differentials: [
                {
                    title: "A) Varicela (Tratamiento: Paracetamol)",
                    is_match: true,
                    text: "Cuadro clásico de pleomorfismo regional (cielo estrellado). Manejo sintomático antipirético seguro.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Perfect Match! El pleomorfismo es el sello de la varicela. El Paracetamol es seguro para la fiebre.",
                        discard: "Error: No reconociste el 'Cielo Estrellado', dato pivote para el diagnóstico clínico de Varicela."
                    }
                },
                {
                    title: "B) Enfermedad Mano-Pie-Boca",
                    is_match: false,
                    text: "Lesiones vesiculares confinadas a palmas, plantas y mucosa oral, por Coxsackievirus A16.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "En la Mano-Pie-Boca las lesiones respetan en gran medida el tronco y se concentran distalmente y en boca, a diferencia del patrón centrífugo/universal aquí.",
                        discard: "¡Bien! Diferenciaste topográficamente las lesiones."
                    }
                },
                {
                    title: "C) Varicela (Tratamiento: Ácido Acetilsalicílico)",
                    is_match: false,
                    text: "Misma enfermedad, pero se decide usar Aspirina para mitigar la fiebre intensa.",
                    safety_flags: { lethal_risk: true, decision_critical: false }, // RED FLAG
                    feedback: {
                        match: "¡Síndrome de Reye FULMINANTE! Acabas de causarle una encefalopatía hepática severa por dar Aspirina en una infección viral infantil.",
                        discard: "¡Excelente reflejo de seguridad! Jamás se debe dar Aspirina (AAS) en niños con Varicela o Influenza por el riesgo de Síndrome de Reye."
                    }
                }
            ],
            perla_enarm: {
                title: "Varicela vs Síndrome de Reye",
                text: "El reconocimiento del 'Cielo Estrellado' (pleomorfismo regional) rinde puntos asegurados. Además, SIEMPRE evita los salicilatos en infecciones virales infantiles (Varicela/Influenza) para prevenir Síndrome de Reye. Usa Paracetamol.",
                gpc_ref: "GPC Varicela en Pediatría"
            }
        }
    },
    {
        id: "ped_vac_srp_001",
        difficulty: "hard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [18, 18], // Exact 18 months
                mood_options: ["sano", "juguetón"],
                bio_templates: [
                    "Lactante sano, asintomático. Acude a su revisión de niño sano a los 18 meses de edad.",
                    "Visita de rutina a los 18 meses. Peso y talla en percentil 50. Hitos del desarrollo (camina independiente) adecuados."
                ],
                duration_options: ["0"],
                vitals: {
                    TA: ["N/A"],
                    FC: ["110 lpm"],
                    Temp: ["36.8°C"]
                },
                details_templates: [
                    "Esquema de vacunación al corriente hasta el año de vida. ¿Qué biológicos le corresponden en esta visita?",
                    "Todo normal. La madre pregunta qué vacunas le tocan hoy que acaba de cumplir año y medio."
                ],
            },
            differentials: [
                {
                    title: "A) Hexavalente Acelular + SRP (Dosis 2)",
                    is_match: true,
                    text: "Esquema actual: Refuerzo de Hexavalente a los 18 meses, y la SRP que históricamente era a los 6 años se adelantó a los 18 meses.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Excelente actualización! Normativa reciente: La 2da dosis de Triple Viral (SRP) se aplica a los 18 meses para cerrar brechas de inmunidad, además del refuerzo de Hexavalente.",
                        discard: "Error de normativa. Dejaste pasar una 'Oportunidad Perdida de Vacunación' crucial en el esquema actualizado."
                    }
                },
                {
                    title: "B) DPT + SRP (Dosis 2)",
                    is_match: false,
                    text: "Se le aplica el biológico DPT tradicional y la SRP acorde a la nueva normativa.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "Casi, pero la DPT (celular) como refuerzo único de los 4 años ya fue sustituida en esta edad por la Hexavalente (que incluye tétanos/difteria/acelular pertussis).",
                        discard: "¡Bien! Sabes que a los 18 meses toca la Hexavalente, no la DPT aislada."
                    }
                },
                {
                    title: "C) 2da Dosis de BCG y Sabin (VOP)",
                    is_match: false,
                    text: "Se planea aplicar refuerzo de tuberculosis y vacuna oral viva de poliomielitis (gotitas).",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "Error histórico. La BCG es Dosis Única al nacer (no se re-aplica a menos que no haya cicatriz y sea menor de 5 años bajo protocolos estrictos). Además, el OPV (Sabin bivalente) se aplica en Semanas Nacionales, el esquema basal usa IPV (Salk) en la Hexavalente.",
                        discard: "¡Perfecto! No caíste en distractores obsoletos del esquema antiguo."
                    }
                }
            ],
            perla_enarm: {
                title: "Actualización Cartilla SRP",
                text: "El cambio más preguntado recientemente: La Segunda Dosis de SRP (Sarampión, Rubéola, Parotiditis) ya NO es a los 6 años. Ahora es a los 18 MESES en la cartilla vigente.",
                gpc_ref: "Cartilla Nacional de Salud / Lineamientos de Vacunación Universal"
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
                    TA: ["160/110", "170/115"], // Criterios de severidad
                    FC: ["90 lpm", "95 lpm"],
                    Temp: ["36.8°C", "37.0°C"]
                },
                details_templates: [
                    "Tira reactiva con proteínas ++. Reflejos osteotendinosos hiperactivos (+++/++++).",
                    "Laboratorios muestran plaquetas en 85,000 y AST/ALT al doble del límite superior. Ácido úrico en 7 mg/dl."
                ],
            },
            differentials: [
                {
                    title: "A) Interrupción del Embarazo Previa Estabilización",
                    is_match: true,
                    text: "Preeclampsia CON datos de severidad. Se debe impregnar con Sulfato de Magnesio, control hipertensivo y resolver gestación.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! La TA >160/110, plaquetopenia, o cefalea/acúfenos son datos de SEVERIDAD. El tratamiento definitivo es la interrupción, pero siempre tras estabilizar a la madre y dar neuroprotección (Sulfato de Magnesio).",
                        discard: "Error: Descartar la interrupción ante datos de severidad arriesga a la paciente a Eclampsia y muerte."
                    }
                },
                {
                    title: "B) Manejo Expectante hasta Término",
                    is_match: false,
                    text: "Control con Alfametildopa y reposo absoluto en casa hasta las 38 SDG.",
                    safety_flags: { lethal_risk: true, decision_critical: false }, // RED FLAG
                    feedback: {
                        match: "¡Mortalidad Materna! Esta paciente tiene datos de severidad inminente (crisis hipertensiva, síntomas neurológicos, plaquetopenia). Mandarla a casa es letal.",
                        discard: "¡Bien hecho! Reconociste y rechazaste el manejo ambulatorio en una urgencia obstétrica severa."
                    }
                },
                {
                    title: "C) Hígado Graso Agudo del Embarazo",
                    is_match: false,
                    text: "Insuficiencia hepática severa, ictericia y coagulopatía en el tercer trimestre.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "Aunque hay elevación hepática en el síndrome HELLP (relacionado a Preeclampsia), el Hígado Graso Agudo cursa con hipoglucemia profunda y no necesariamente con hipertensión extrema inicial.",
                        discard: "Correcto, la clínica hipertensiva con cefalea y fosfenos apunta directo al espectro de la Preeclampsia Severa."
                    }
                }
            ],
            perla_enarm: {
                title: "Manejo de Preeclampsia Severa",
                text: "Los datos de severidad obligan a interrumpir el embarazo SIN IMPORTAR la edad gestacional. Sin embargo, nunca operes a una paciente con crisis hipertensiva; la REGLA DE ORO es estabilizar primero (Labetalol/Nifedipino/Hidralazina) y neuroproteger con Sulfato de Magnesio.",
                gpc_ref: "GPC Preeclampsia - Eclampsia"
            }
        }
    },
    {
        id: "obs_hem_dppni_001",
        difficulty: "standard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Femenino"],
                age_range: [25, 40],
                mood_options: ["muy adolorida", "inquieta"],
                bio_templates: [
                    "Gestante de {duration} SDG que presenta sangrado transvaginal oscuro y dolor abdominal muy intenso.",
                    "Paciente con antecedente de Preeclampsia, acude por sangrado vaginal oscuro escaso y dolor continuo tipo cólico muy fuerte."
                ],
                duration_options: ["33", "35", "37"],
                vitals: {
                    TA: ["150/100", "90/50 (Signos de choque)"],
                    FC: ["110 lpm", "120 lpm"],
                    Temp: ["36.5°C"]
                },
                details_templates: [
                    "A la palpación: Hipertonía uterina (útero leñoso). FCF en 90 lpm (bradicardia fetal).",
                    "Hipertonía uterina notable. Registro tococardiográfico muestra sufrimiento fetal agudo."
                ],
            },
            differentials: [
                {
                    title: "A) Desprendimiento Prematuro de Placenta (DPPNI)",
                    is_match: true,
                    text: "Surgimiento espontáneo de hipertonía, sangrado oscuro y dolor intenso. Frecuente sufrimiento fetal.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Perfecto! La suma de hipertonía uterina (útero leñoso) + sangrado oscuro = DPPNI hasta no demostrar lo contrario. Es indicación de CESÁREA URGENTE.",
                        discard: "Pésimo error. Dudaste de la patología hemorrágica más clásica de dolor súbito e hipertonía del 3er trimestre."
                    }
                },
                {
                    title: "B) Placenta Previa",
                    is_match: false,
                    text: "Sangrado vaginal rojo rutilante, abundante, indoloro y SIN actividad uterina.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "La placenta previa se caracteriza por sangrado rojo rutilante e INDOLORO (útero blando). Esta paciente tiene hipertonía.",
                        discard: "¡Bien hecho! Identificaste la diferencia clave: el dolor y la hipertonía descartan clínicamente una placenta previa pura."
                    }
                },
                {
                    title: "C) Ruptura Uterina",
                    is_match: false,
                    text: "Dolor abdominal súbito y desgarrador, cese de contracciones uterinas, palpación fácil de partes fetales.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "En la ruptura uterina se 'pierde' el tono (el útero ya no se palpa tenso porque se rompió) y el feto se va al abdomen, además aquí no hay antecedente de cesárea previa mencionado.",
                        discard: "Correcto, la hipertonía sostenida descarta fisiológicamente una ruptura (que implicaría pérdida del tono)."
                    }
                }
            ],
            perla_enarm: {
                title: "DPPNI vs Placenta Previa",
                text: "El binomio diagnóstico diferencial clave en hemorragias de la 2da mitad. DPPNI = Doloroso, Sangrado Obscuro, Hipertonía (Útero leñoso). Placenta Previa = Indoloro, Rojo Rutilante, Útero Blando sin contracciones.",
                gpc_ref: "GPC Hemorragia Obstétrica de la Segunda Mitad del Embarazo"
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
                },
                {
                    title: "C) Abdomen Agudo Quirúrgico",
                    is_match: false,
                    text: "Sospecha quirúrgica por dolor abdominal y vómito en un joven.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "Aunque el dolor abdominal es fuerte, en la CAD suele ser por dilatación gástrica secundaria a la cetonemia, una cirugía innecesaria sería letal.",
                        discard: "Bien hecho. El dolor abdominal en CAD mejora rápidamente tras el inicio de la hidratación y corrección metabólica."
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
        id: "surg_trauma_pneumo_001",
        difficulty: "hard",
        mode: "clinical_reasoning",
        template: {
            patient: {
                sex_options: ["Masculino", "Femenino"],
                age_range: [20, 45],
                mood_options: ["cianótico", "desesperado"],
                bio_templates: [
                    "Traído por paramédicos tras choque automovilístico frontal. Presenta dificultad respiratoria severa y taquicardia.",
                    "Paciente con trauma torácico cerrado por caída de 3 metros. Ingresa con disnea intensa, cianosis y alteración de conciencia."
                ],
                duration_options: ["0"],
                vitals: {
                    TA: ["70/40", "80/50"], // Choque
                    FC: ["130 lpm", "140 lpm"],
                    Temp: ["36.0°C"]
                },
                details_templates: [
                    "A la EF: Ausencia de ruidos respiratorios en hemitórax derecho e ingurgitación yugular evidente. Tráquea desviada a la izquierda.",
                    "Hemitórax izquierdo hipertimpánico sin ruidos ventilatorios. Venas del cuello distendidas. Saturación al 82%."
                ],
            },
            differentials: [
                {
                    title: "A) Descompresión inmediata con Aguja Gruesa",
                    is_match: true,
                    text: "Neumotórax a Tensión. Es un diagnóstico netamente CLÍNICO y una emergencia absoluta. ATLS 10a Ed: 5to espacio intercostal, línea axilar media/anterior.",
                    safety_flags: { lethal_risk: false, decision_critical: true },
                    feedback: {
                        match: "¡Excelente! Ingurgitación yugular + ausencia de ruidos + choque = Neumotórax a Tensión. Se descomprime INMEDIATAMENTE de forma clínica, sin radiografía. La nueva norma ATLS (10a Ed) recomienda el 5to espacio intercostal.",
                        discard: "Error Mortal: Retrasar o descartar la descompresión en un paciente con neumotórax a tensión en choque resulta en paro cardíaco inminente."
                    }
                },
                {
                    title: "B) Solicitar Radiografía de Tórax Portátil",
                    is_match: false,
                    text: "Confirmar el diagnóstico radiológicamente antes de realizar cualquier procedimiento invasivo torácico.",
                    safety_flags: { lethal_risk: true, decision_critical: false }, // RED FLAG
                    feedback: {
                        match: "¡Muerte por retraso! Un Neumotórax a Tensión es un diagnóstico clínico (A-B en el ATLS). Esperar una Rx compromete el retorno venoso y causa la muerte.",
                        discard: "¡Bien hecho! Evitaste perder tiempo vital en estudios de gabinete ante una emergencia clínica clarísima."
                    }
                },
                {
                    title: "C) Intubación Endotraqueal Inmediata",
                    is_match: false,
                    text: "Asegurar la Vía Aérea (Letra A) por hipoxia severa y alteración del estado de alerta.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "Si bien la Aérea es prioridad, la ventilación a presión positiva de la intubación puede EMPEORAR el neumotórax a tensión llevándolo al paro. Primero se descomprime (Problema de la 'B').",
                        discard: "Correcto, la prioridad de esta clínica es liberar la tensión torácica antes que nada."
                    }
                }
            ],
            perla_enarm: {
                title: "ATLS: Diagnóstico Clínico del Neumotórax a Tensión",
                text: "El Neumotórax a Tensión JAMÁS requiere Rx para su diagnóstico o tratamiento. La triada clínica (Ausencia de ruidos, desviación traqueal, ingurgitación yugular) ordena descompresión inmediata. (Ojo a la actualización del ATLS: 5to espacio).",
                gpc_ref: "Advanced Trauma Life Support (ATLS) 10ma Edición"
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
                    TA: ["100/65", "110/70"], // Aún no en Reynolds
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
                },
                {
                    title: "C) Péntada de Reynolds (Sepsis Biliar)",
                    is_match: false,
                    text: "Progresión natural de la colangitis. Añade choque (hipotensión severa) y alteración del estado mental.",
                    safety_flags: { lethal_risk: false, decision_critical: false },
                    feedback: {
                        match: "Cuidado clínico: La paciente está taquicárdica pero asintomática mentalmente y su TA está conservada. Aún no desarrolla la Péntada de Reynolds, solo Charcot.",
                        discard: "Excelente precisión diagnóstica. Al no haber choque ni confusión, se queda en Tríada de Charcot."
                    }
                }
            ],
            perla_enarm: {
                title: "Tríada de Charcot",
                text: "Componentes: 1. Dolor en hipocondrio derecho, 2. Ictericia, 3. Fiebre (con escalofríos). Si se agrega Choque y Confusión, es Péntada de Reynolds (mortalidad extrema). Manejo definitivo: Drenaje biliar (CPRE).",
                gpc_ref: "GPC Diagnóstico y Manejo de Colangitis Aguda"
            }
        }
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BLUEPRINTS };
}
