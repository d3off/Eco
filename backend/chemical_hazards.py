"""
chemical_hazards.py
База данных химических веществ, опасных реакций и оценки угроз здоровью.
Пороговые значения основаны на нормах ВОЗ и ПДК РФ.
"""

# ─────────────────────────────────────────────────────────────────────────────
# СПРАВОЧНИК ВЕЩЕСТВ
# ─────────────────────────────────────────────────────────────────────────────
SUBSTANCES = {
    "co2": {
        "name": "CO₂",
        "full_name": "Диоксид углерода (углекислый газ)",
        "unit": "ppm",
        "who_threshold": 1000,      # ppm — выше начинаются когнитивные нарушения
        "danger_threshold": 5000,   # ppm — опасно для жизни
        "organs": ["Мозг", "Сердечно-сосудистая система"],
        "symptoms": "Головная боль, головокружение, нарушение концентрации, удушье",
        "sources": ["Сжигание топлива", "Промышленные печи", "Вентиляция"],
        "is_carcinogen": False,
        "icon": "💨",
    },
    "no2": {
        "name": "NO₂",
        "full_name": "Диоксид азота",
        "unit": "мкг/м³",
        "who_threshold": 40,        # мкг/м³ (годовой)
        "danger_threshold": 200,    # мкг/м³ (часовой)
        "organs": ["Лёгкие", "Бронхи", "Иммунная система"],
        "symptoms": "Кашель, бронхит, снижение функции лёгких, астма",
        "sources": ["Транспорт", "Тепловые электростанции", "Химзаводы"],
        "is_carcinogen": False,
        "icon": "🟠",
    },
    "methane": {
        "name": "CH₄",
        "full_name": "Метан",
        "unit": "ppb",
        "who_threshold": 2000,      # ppb — выше начинается вытеснение кислорода
        "danger_threshold": 50000,  # ppb — взрывоопасная концентрация
        "organs": ["Лёгкие", "Центральная нервная система"],
        "symptoms": "Головная боль, головокружение, асфиксия при высоких концентрациях",
        "sources": ["Нефтегазовые предприятия", "Свалки", "Животноводство"],
        "is_carcinogen": False,
        "icon": "🔥",
    },
    "so2": {
        "name": "SO₂",
        "full_name": "Диоксид серы (сернистый ангидрид)",
        "unit": "мкг/м³",
        "who_threshold": 20,        # мкг/м³ (суточный)
        "danger_threshold": 500,
        "organs": ["Лёгкие", "Слизистые оболочки", "Глаза"],
        "symptoms": "Резкий кашель, бронхоспазм, слезотечение, хронический бронхит",
        "sources": ["Металлургия", "Нефтепереработка", "Тепловые станции"],
        "is_carcinogen": False,
        "icon": "🌫️",
    },
    "co": {
        "name": "CO",
        "full_name": "Монооксид углерода (угарный газ)",
        "unit": "мг/м³",
        "who_threshold": 10,        # мг/м³ (8 часов)
        "danger_threshold": 50,
        "organs": ["Кровь (гемоглобин)", "Мозг", "Сердце"],
        "symptoms": "Отравление: головная боль → потеря сознания → смерть",
        "sources": ["Неполное сгорание", "Автомобили", "Пожары"],
        "is_carcinogen": False,
        "icon": "☠️",
    },
    "o3": {
        "name": "O₃",
        "full_name": "Озон (приземный)",
        "unit": "мкг/м³",
        "who_threshold": 100,       # мкг/м³ (8 часов)
        "danger_threshold": 240,
        "organs": ["Глубокие лёгкие", "Дыхательные пути"],
        "symptoms": "Воспаление лёгких, снижение функции дыхания, боль в груди",
        "sources": ["Фотохимический смог (NO₂ + УФ-излучение)"],
        "is_carcinogen": True,
        "icon": "🌞",
    },
    "h2s": {
        "name": "H₂S",
        "full_name": "Сероводород",
        "unit": "мг/м³",
        "who_threshold": 0.15,      # мг/м³ (ПДК РФ)
        "danger_threshold": 10,
        "organs": ["ЦНС", "Лёгкие", "Глаза"],
        "symptoms": "Рвота, потеря сознания, паралич дыхательного центра, смерть",
        "sources": ["Нефтепереработка", "Сточные воды", "Химзаводы"],
        "is_carcinogen": False,
        "icon": "💀",
    },
    "nh3": {
        "name": "NH₃",
        "full_name": "Аммиак",
        "unit": "мг/м³",
        "who_threshold": 0.2,       # мг/м³ (ПДК РФ)
        "danger_threshold": 35,
        "organs": ["Глаза", "Верхние дыхательные пути", "Кожа"],
        "symptoms": "Резкое раздражение глаз и горла, кашель, химический ожог",
        "sources": ["Производство удобрений", "Животноводство", "Холодильные предприятия"],
        "is_carcinogen": False,
        "icon": "⚗️",
    },
    "benzene": {
        "name": "C₆H₆",
        "full_name": "Бензол",
        "unit": "мкг/м³",
        "who_threshold": 1.6,       # мкг/м³ (ВОЗ, канцерогенный)
        "danger_threshold": 10,
        "organs": ["Костный мозг", "Кровь", "ЦНС"],
        "symptoms": "Лейкемия (рак крови), головокружение, анемия",
        "sources": ["НПЗ", "Нефтехимия", "Автотранспорт"],
        "is_carcinogen": True,
        "icon": "☢️",
    },
    "formaldehyde": {
        "name": "HCHO",
        "full_name": "Формальдегид",
        "unit": "мкг/м³",
        "who_threshold": 100,       # мкг/м³ (30 мин)
        "danger_threshold": 250,
        "organs": ["Слизистые", "Лёгкие", "ДНК клеток"],
        "symptoms": "Раздражение глаз/горла, рак носоглотки, генотоксичность",
        "sources": ["Деревообработка", "Пластмасса", "Строительные материалы"],
        "is_carcinogen": True,
        "icon": "🧪",
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# ОПАСНЫЕ ХИМИЧЕСКИЕ РЕАКЦИИ
# ─────────────────────────────────────────────────────────────────────────────
REACTIONS = [
    {
        "id": "no2_water",
        "name": "NO₂ + H₂O (в лёгких)",
        "equation": "3NO₂ + H₂O → 2HNO₃ + NO",
        "product": "Азотная кислота (HNO₃)",
        "mechanism": "Растворяясь в слизистой лёгких, NO₂ образует азотную и азотистую кислоту, вызывая химический ожог альвеол",
        "health_effect": "Отёк лёгких, химический ожог дыхательных путей",
        "triggers": {"no2_elevated": True},  # срабатывает при повышенном NO2
        "severity": "HIGH",
    },
    {
        "id": "so2_water",
        "name": "SO₂ + H₂O",
        "equation": "SO₂ + H₂O → H₂SO₃",
        "product": "Сернистая кислота (H₂SO₃)",
        "mechanism": "Сернистый газ реагирует с влагой воздуха и в лёгких, образуя слабую кислоту, раздражающую слизистые",
        "health_effect": "Хронический бронхит, кислотные дожди, поражение экосистем",
        "triggers": {"so2_present": True},
        "severity": "MEDIUM",
    },
    {
        "id": "so2_no2_synergy",
        "name": "SO₂ + NO₂ (синергия)",
        "equation": "SO₂ + NO₂ → H₂SO₄ + HNO₃ (в атмосфере)",
        "product": "Кислотный смог",
        "mechanism": "Совместное воздействие SO₂ и NO₂ в 3–5 раз токсичнее, чем каждый газ по отдельности — взаимное усиление токсичности",
        "health_effect": "Тяжёлые респираторные заболевания, поражение лёгких, смертельная опасность для астматиков",
        "triggers": {"so2_present": True, "no2_elevated": True},
        "severity": "HIGH",
    },
    {
        "id": "co_hemoglobin",
        "name": "CO + Гемоглобин",
        "equation": "CO + Hb → HbCO (карбоксигемоглобин)",
        "product": "Карбоксигемоглобин",
        "mechanism": "Угарный газ связывается с гемоглобином в 250 раз сильнее, чем кислород — кровь теряет способность переносить O₂",
        "health_effect": "Кислородное голодание тканей, потеря сознания, смерть при концентрации HbCO > 60%",
        "triggers": {"co_present": True},
        "severity": "HIGH",
    },
    {
        "id": "photochemical_smog",
        "name": "NO₂ + УФ-излучение → O₃",
        "equation": "NO₂ + hν → NO + O·; O· + O₂ → O₃",
        "product": "Приземный озон (фотохимический смог)",
        "mechanism": "Под действием солнечного ультрафиолета NO₂ распадается, образуя атомарный кислород, который соединяется с O₂ в токсичный озон",
        "health_effect": "Глубокое поражение лёгочной ткани, снижение иммунитета, наиболее опасен в солнечные дни",
        "triggers": {"no2_elevated": True},
        "severity": "MEDIUM",
    },
    {
        "id": "h2s_oxidation",
        "name": "H₂S + O₂",
        "equation": "2H₂S + 3O₂ → 2SO₂ + 2H₂O",
        "product": "Цепная реакция: H₂S → SO₂",
        "mechanism": "Сероводород окисляется в атмосфере до диоксида серы, переходя из одного опасного вещества в другое",
        "health_effect": "Двойная токсичность: сначала H₂S поражает ЦНС, затем продукт реакции SO₂ поражает лёгкие",
        "triggers": {"h2s_present": True},
        "severity": "HIGH",
    },
    {
        "id": "no2_methane",
        "name": "NO₂ + CH₄ (фотохимия)",
        "equation": "CH₄ + 2NO₂ + УФ → HCHO + ... (смог)",
        "product": "Формальдегид, пероксиацетилнитрат (ПАН)",
        "mechanism": "Метан участвует в атмосферных фотохимических реакциях с оксидами азота, образуя канцерогенный формальдегид и ПАН",
        "health_effect": "Раздражение глаз и слизистых, канцерогенное воздействие, поражение растительности",
        "triggers": {"no2_elevated": True, "methane_elevated": True},
        "severity": "MEDIUM",
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# РЕКОМЕНДАЦИИ ПО УРОВНЯМ ОПАСНОСТИ
# ─────────────────────────────────────────────────────────────────────────────
RECOMMENDATIONS = {
    "LOW": [
        "✅ Качество воздуха в норме",
        "🚶 Прогулки на свежем воздухе безопасны",
        "🌱 Рекомендуется регулярный контроль показателей",
    ],
    "MEDIUM": [
        "⚠️ Ограничьте длительное пребывание на улице",
        "😷 Людям с астмой и заболеваниями лёгких рекомендуется носить маску",
        "🏠 Закройте окна при проветривании в часы пик",
        "🏃 Физические нагрузки на улице нежелательны",
    ],
    "HIGH": [
        "🚨 ВЫСОКИЙ УРОВЕНЬ ОПАСНОСТИ — оставайтесь в помещении",
        "🏥 При симптомах (кашель, одышка, головная боль) — обратитесь к врачу",
        "😷 Используйте респиратор класса не ниже FFP2 при выходе на улицу",
        "🚫 Не открывайте окна, используйте очиститель воздуха",
        "📢 Сообщите о ситуации в экологическую службу",
        "👶 Дети, пожилые и беременные — строго в помещении",
    ],
}


# ─────────────────────────────────────────────────────────────────────────────
# ФУНКЦИЯ ОЦЕНКИ ОПАСНОСТИ
# ─────────────────────────────────────────────────────────────────────────────
def assess_hazard(co2: float, no2: float, methane: float) -> dict:
    """
    Оценивает химическую опасность на основе замеренных уровней веществ.
    Возвращает словарь с уровнем опасности, активными угрозами и реакциями.
    """
    active_threats = []
    violation_count = 0

    # ─── Оценка отдельных веществ ───────────────────────────────────────────
    substances_to_check = [
        ("co2",     co2),
        ("no2",     no2),
        ("methane", methane),
    ]

    for substance_key, measured_value in substances_to_check:
        info = SUBSTANCES[substance_key]
        if measured_value > info["who_threshold"]:
            violation_count += 1
            excess_ratio = measured_value / info["who_threshold"]
            severity = "HIGH" if measured_value > info["danger_threshold"] else "MEDIUM"

            active_threats.append({
                "substance_key": substance_key,
                "name": info["name"],
                "full_name": info["full_name"],
                "measured_value": round(measured_value, 2),
                "who_threshold": info["who_threshold"],
                "unit": info["unit"],
                "excess_ratio": round(excess_ratio, 2),
                "organs": info["organs"],
                "symptoms": info["symptoms"],
                "is_carcinogen": info["is_carcinogen"],
                "severity": severity,
                "icon": info["icon"],
            })

    # ─── Определение флагов для реакций ─────────────────────────────────────
    flags = {
        "no2_elevated":    no2 > SUBSTANCES["no2"]["who_threshold"],
        "methane_elevated": methane > SUBSTANCES["methane"]["who_threshold"],
        "so2_present":     False,   # расширяемо при добавлении новых датчиков
        "co_present":      False,
        "h2s_present":     False,
    }

    # ─── Проверка активных реакций ───────────────────────────────────────────
    active_reactions = []
    for reaction in REACTIONS:
        triggers_met = all(
            flags.get(trigger_key, False) == trigger_val
            for trigger_key, trigger_val in reaction["triggers"].items()
        )
        if triggers_met:
            active_reactions.append(reaction)

    # ─── Итоговый уровень опасности ──────────────────────────────────────────
    has_high_reaction = any(r["severity"] == "HIGH" for r in active_reactions)

    if violation_count == 0 and not active_reactions:
        hazard_level = "LOW"
    elif violation_count >= 3 or has_high_reaction:
        hazard_level = "HIGH"
    else:
        hazard_level = "MEDIUM"

    return {
        "hazard_level": hazard_level,
        "violation_count": violation_count,
        "active_threats": active_threats,
        "active_reactions": active_reactions,
        "recommendations": RECOMMENDATIONS[hazard_level],
        "substances_reference": [
            {
                "name": v["name"],
                "full_name": v["full_name"],
                "unit": v["unit"],
                "who_threshold": v["who_threshold"],
                "organs": v["organs"],
                "is_carcinogen": v["is_carcinogen"],
                "icon": v["icon"],
            }
            for v in SUBSTANCES.values()
        ],
    }
