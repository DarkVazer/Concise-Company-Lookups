# -*- coding: utf-8 -*-
import requests
import time
from supabase import create_client
from datetime import datetime, timedelta
import logging
import random

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Настройки Supabase
SUPABASE_URL = "https://zhcdwoozyatbydqebwvb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoY2R3b296eWF0YnlkcWVid3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM0NTUyOSwiZXhwIjoyMDY2OTIxNTI5fQ.YwZlPEPeDW9HSFkmZLMD8ml9Kl687hLQhbi7mRzyVQc"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Параметры для разнообразия поиска
REGIONS = [
    "Республика Адыгея", "Республика Башкортостан", "Республика Бурятия", "Республика Алтай", "Республика Дагестан", "Республика Ингушетия", "Кабардино-Балкарская Республика", "Республика Калмыкия", "Карачаево-Черкесская Республика", "Республика Карелия", "Республика Коми", "Республика Марий Эл", "Республика Мордовия", "Республика Саха (Якутия)", "Республика Северная Осетия — Алания", "Республика Татарстан", "Республика Тыва", "Удмуртская Республика", "Республика Хакасия", "Чеченская Республика", "Чувашская Республика", "Алтайский край", "Забайкальский край", "Камчатский край", "Краснодарский край", "Красноярский край", "Пермский край", "Приморский край", "Ставропольский край", "Хабаровский край", "Амурская область", "Архангельская область", "Астраханская область", "Белгородская область", "Брянская область", "Владимирская область", "Волгоградская область", "Вологодская область", "Воронежская область", "Ивановская область", "Иркутская область", "Калининградская область", "Калужская область", "Кемеровская область", "Кировская область", "Костромская область", "Курганская область", "Курская область", "Ленинградская область", "Липецкая область", "Магаданская область", "Московская область", "Мурманская область", "Нижегородская область", "Новгородская область", "Новосибирская область", "Омская область", "Оренбургская область", "Орловская область", "Пензенская область", "Псковская область", "Ростовская область", "Рязанская область", "Самарская область", "Саратовская область", "Сахалинская область", "Свердловская область", "Смоленская область", "Тамбовская область", "Тверская область", "Томская область", "Тульская область", "Тюменская область", "Ульяновская область", "Челябинская область", "Ярославская область", "Москва", "Санкт-Петербург", "Севастополь", "Еврейская автономная область", "Ненецкий автономный округ", "Ханты-Мансийский автономный округ — Югра", "Чукотский автономный округ", "Ямало-Ненецкий автономный округ", "Республика Крым"
]

OKVED_CODES = [
    "01.11", "01.41", "10.11", "10.71", "14.12", "20.11", "23.61", "25.11", "26.51", "27.12", "29.10", "41.20", "43.11", "45.20", "46.11", "46.73", "47.11", "47.19", "49.41", "52.10", "52.29", "55.10", "56.10", "61.10", "62.01", "62.02", "68.10", "68.20", "69.10", "70.22", "71.12", "73.11", "78.10", "81.22", "85.11", "86.21", "90.01", "93.19"
]
STATUSES = ["ACTIVE", "LIQUIDATING"]
TYPES = ["LEGAL", "INDIVIDUAL"]
BRANCH_TYPES = ["MAIN", "BRANCH"]

# Настройки DaData API
DADATA_API_KEY = "7cf849074d6e12215b16b1b94566da4f5319c8e3"
DADATA_SUGGEST_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party"
DADATA_FIND_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party"
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": f"Token {DADATA_API_KEY}"
}

CITIES = [
    "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону", "Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград",
    "Саратов", "Тюмень", "Тольятти", "Ижевск", "Барнаул", "Ульяновск", "Иркутск", "Владивосток", "Ярославль", "Хабаровск", "Махачкала", "Оренбург", "Новокузнецк", "Томск", "Кемерово", "Рязань", "Астрахань",
    "Пенза", "Липецк", "Киров", "Чебоксары", "Брянск", "Тула", "Калуга", "Севастополь", "Сочи", "Ставрополь", "Тверь", "Магнитогорск", "Иваново", "Белгород", "Сургут", "Владимир", "Архангельск", "Нижний Тагил",
    "Грозный", "Курск", "Смоленск", "Калининград", "Череповец", "Волжский", "Владикавказ", "Мурманск", "Саранск", "Якутск", "Орёл", "Вологда", "Подольск", "Чита", "Новороссийск", "Кострома", "Комсомольск-на-Амуре",
    "Петрозаводск", "Нижневартовск", "Йошкар-Ола", "Тамбов", "Находка", "Благовещенск", "Стерлитамак", "Псков", "Бийск", "Прокопьевск", "Балаково", "Энгельс", "Рыбинск", "Армавир", "Сызрань", "Северодвинск",
    "Норильск", "Златоуст", "Альметьевск", "Каменск-Уральский", "Миасс", "Копейск", "Петропавловск-Камчатский", "Нефтеюганск", "Салават", "Нижнекамск", "Димитровград", "Сергиев Посад", "Новочеркасск", "Орск",
    "Шахты", "Нефтекамск", "Каменск-Шахтинский", "Первоуральск", "Рубцовск", "Коломна", "Майкоп", "Березники", "Пятигорск", "Арзамас", "Элиста", "Кызыл", "Обнинск", "Керчь", "Новомосковск",
    # Административные центры всех регионов:
    "Майкоп", "Уфа", "Улан-Удэ", "Горно-Алтайск", "Махачкала", "Магас", "Нальчик", "Элиста", "Черкесск", "Петрозаводск", "Сыктывкар", "Йошкар-Ола", "Саранск", "Якутск", "Владикавказ", "Казань", "Кызыл", "Ижевск", "Абакан", "Грозный", "Чебоксары", "Барнаул", "Чита", "Петропавловск-Камчатский", "Краснодар", "Красноярск", "Пермь", "Владивосток", "Ставрополь", "Хабаровск", "Благовещенск", "Архангельск", "Астрахань", "Белгород", "Брянск", "Владимир", "Волгоград", "Вологда", "Воронеж", "Иваново", "Иркутск", "Калининград", "Калуга", "Кемерово", "Киров", "Кострома", "Курган", "Курск", "Гатчина", "Липецк", "Магадан", "Красногорск", "Мурманск", "Нижний Новгород", "Великий Новгород", "Новосибирск", "Омск", "Оренбург", "Орёл", "Пенза", "Псков", "Ростов-на-Дону", "Рязань", "Самара", "Саратов", "Южно-Сахалинск", "Екатеринбург", "Смоленск", "Тамбов", "Тверь", "Томск", "Тула", "Тюмень", "Ульяновск", "Челябинск", "Ярославль", "Москва", "Санкт-Петербург", "Севастополь", "Биробиджан", "Нарьян-Мар", "Ханты-Мансийск", "Анадырь", "Салехард", "Симферополь"
]

LIMIT_ERROR_CODES = [429]
LIMIT_ERROR_STRINGS = [
    'Too Many Requests',
    'превышен лимит',
    'limit',
    'ограничен',
    'rate limit',
    'слишком много запросов',
]

def is_limit_error(response_or_exception):
    # Проверка по коду ответа
    if hasattr(response_or_exception, 'status_code'):
        if response_or_exception.status_code in LIMIT_ERROR_CODES:
            return True
        # Иногда лимит возвращается с 400, но с текстом
        try:
            text = response_or_exception.text.lower()
            if any(s in text for s in LIMIT_ERROR_STRINGS):
                return True
        except Exception:
            pass
    # Проверка по тексту исключения
    if hasattr(response_or_exception, 'args') and response_or_exception.args:
        text = str(response_or_exception.args[0]).lower()
        if any(s in text for s in LIMIT_ERROR_STRINGS):
            return True
    return False

def generate_random_inn(length=10):
    return ''.join([str(random.randint(0, 9)) for _ in range(length)])

def fetch_inns_by_query(query, count=10, limit_error_counter=None):
    payload = {
        "query": query,
        "count": min(count, 20)
    }
    logger.info(f"Authorization header: {HEADERS.get('Authorization')}")
    try:
        response = requests.post(DADATA_SUGGEST_URL, headers=HEADERS, json=payload, timeout=10)
        response.raise_for_status()
        suggestions = response.json().get("suggestions", [])
        inns = [s["data"]["inn"] for s in suggestions if s["data"].get("inn")]
        logger.info(f"Получено {len(inns)} ИНН по запросу '{query}'")
        return inns
    except requests.exceptions.RequestException as e:
        logger.error(f"Ошибка при получении ИНН: {e}")
        if limit_error_counter is not None and is_limit_error(e):
            limit_error_counter['count'] += 1
        return []

def fetch_company_full_data(inn, branch_type="MAIN", type_param="LEGAL", limit_error_counter=None):
    payload = {
        "query": inn,
        "branch_type": branch_type,
        "type": type_param
    }
    logger.info(f"Authorization header: {HEADERS.get('Authorization')}")
    try:
        response = requests.post(DADATA_FIND_URL, headers=HEADERS, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        if not data.get("suggestions"):
            logger.warning(f"Нет данных для ИНН {inn}")
            return None
        return data["suggestions"][0]["data"]
    except requests.exceptions.RequestException as e:
        logger.error(f"Ошибка при запросе для ИНН {inn}: {e}")
        if limit_error_counter is not None and is_limit_error(e):
            limit_error_counter['count'] += 1
        return None

def safe_actuality_date(raw):
    # Если None — вернуть None
    if raw is None:
        return None
    try:
        if isinstance(raw, str):
            return raw
        ts = int(raw)
        if ts > 10**12:
            ts = ts // 1000
        return datetime.utcfromtimestamp(ts).isoformat() + 'Z'
    except Exception:
        return None

def map_company_data(company_data):
    """Преобразование данных DaData в формат для таблицы companies (только разрешённые поля)."""
    if not company_data:
        return None
    return {
        "inn": company_data.get("inn"),
        "region": ((company_data.get("address") or {}).get("data") or {}).get("region_with_type"),
        "okved_code": company_data.get("okved"),
        "finance_revenue": (company_data.get("finance") or {}).get("revenue"),
        "employee_count": company_data.get("employee_count"),
        "actuality_date": safe_actuality_date((company_data.get("state") or {}).get("actuality_date")),
        "name": (company_data.get("name") or {}).get("full_with_opf"),
    }

def upsert_company_data(company_data, limit_error_counter=None):
    """Добавление или обновление данных компании в Supabase."""
    if not company_data:
        return False
    try:
        existing = supabase.table("companies").select("*").eq("inn", company_data["inn"]).execute()
        if existing.data:
            result = supabase.table("companies").update(company_data).eq("inn", company_data["inn"]).execute()
            logger.info(f"Обновлена компания с ИНН {company_data['inn']}")
        else:
            result = supabase.table("companies").insert(company_data).execute()
            logger.info(f"Добавлена компания с ИНН {company_data['inn']}")
        return True
    except Exception as e:
        logger.error(f"Ошибка при сохранении данных для ИНН {company_data['inn']}: {e}")
        if limit_error_counter is not None and is_limit_error(e):
            limit_error_counter['count'] += 1
        return False

def process_massive_companies():
    """Массовый сбор компаний только по регионам и городам (рандомный порядок)."""
    max_daily_requests = 5000  # лимит для бесплатного тарифа
    requests_made = 0
    success_count = 0
    fail_count = 0
    limit_error_counter = {'count': 0}
    # Рандомизация списков
    regions_shuffled = REGIONS[:]
    cities_shuffled = CITIES[:]
    random.shuffle(regions_shuffled)
    random.shuffle(cities_shuffled)
    # 1. По регионам
    for region in regions_shuffled:
        if requests_made >= max_daily_requests or limit_error_counter['count'] >= 6:
            logger.error(f"Остановка: подряд {limit_error_counter['count']} ограничений по лимиту!")
            break
        inns = fetch_inns_by_query(region, count=10, limit_error_counter=limit_error_counter)
        for inn in inns:
            if requests_made >= max_daily_requests or limit_error_counter['count'] >= 6:
                logger.error(f"Остановка: подряд {limit_error_counter['count']} ограничений по лимиту!")
                break
            company_data = fetch_company_full_data(inn, limit_error_counter=limit_error_counter)
            if company_data is not None:
                mapped = map_company_data(company_data)
                if mapped and upsert_company_data(mapped, limit_error_counter=limit_error_counter):
                    success_count += 1
                    limit_error_counter['count'] = 0  # сброс если успешный запрос
                else:
                    fail_count += 1
            else:
                fail_count += 1
            requests_made += 1
            time.sleep(0.2)
    # 2. По городам
    for city in cities_shuffled:
        if requests_made >= max_daily_requests or limit_error_counter['count'] >= 6:
            logger.error(f"Остановка: подряд {limit_error_counter['count']} ограничений по лимиту!")
            break
        inns = fetch_inns_by_query(city, count=10, limit_error_counter=limit_error_counter)
        for inn in inns:
            if requests_made >= max_daily_requests or limit_error_counter['count'] >= 6:
                logger.error(f"Остановка: подряд {limit_error_counter['count']} ограничений по лимиту!")
                break
            company_data = fetch_company_full_data(inn, limit_error_counter=limit_error_counter)
            if company_data is not None:
                mapped = map_company_data(company_data)
                if mapped and upsert_company_data(mapped, limit_error_counter=limit_error_counter):
                    success_count += 1
                    limit_error_counter['count'] = 0
                else:
                    fail_count += 1
            else:
                fail_count += 1
            requests_made += 1
            time.sleep(0.2)
    logger.info(f"Обработка завершена: успешно {success_count}, ошибки {fail_count}, запросов {requests_made}")

if __name__ == "__main__":
    process_massive_companies()