# Open-source основа для CRM обследования зданий — обзор GitHub

Данные получены через GitHub API (`gh api`) 2026-09-29.
«Верифицирована» = у организации на GitHub стоит галочка Verified (домен подтверждён).
У twenty и odoo API вернул лицензию NOASSERTION (смешанная); указанная лицензия — по памяти, перед выбором проверить файл LICENSE.

## Готовые CRM/ERP (основа для доработки)

| # | Репозиторий | ⭐ | Владелец | Verified | Лицензия | Последний push | Стек | Зачем для обследования зданий |
|---|---|---|---|---|---|---|---|---|
| 1 | [twentyhq/twenty](https://github.com/twentyhq/twenty) | 57 689 | twenty.com | ✅ | AGPL/коммерч. (NOASSERTION) | 2026-09-29 | TypeScript, React, NestJS | Современная CRM, свои объекты (Объект/Обследование/Дефект) без кода, API, workflow |
| 2 | [odoo/odoo](https://github.com/odoo/odoo) | 54 735 | odoo.com | ✅ | LGPL-3 (Community) | 2026-09-29 | Python | CRM + проекты + счета + документы; выезды через OCA/field-service |
| 3 | [frappe/erpnext](https://github.com/frappe/erpnext) | 39 634 | frappe.io | ✅ | GPL-3.0 | 2026-09-28 | Python (Frappe) | ERP: проекты, договоры, счета; формы/чек-листы, PDF-отчёты |
| 4 | [krayin/laravel-crm](https://github.com/krayin/laravel-crm) | 23 964 | krayincrm.com | ❌ | MIT | 2026-09-29 | PHP, Laravel, Vue | Лёгкая CRM, MIT — можно закрыть код и продавать |
| 5 | [frappe/frappe](https://github.com/frappe/frappe) | 10 853 | frappe.io | ✅ | MIT | 2026-09-29 | Python, JS | Low-code фреймворк: свои доктайпы, мобильные формы, отчёты |
| 6 | [idurar/idurar-erp-crm](https://github.com/idurar/idurar-erp-crm) | 8 838 | idurarapp.com | ❌ | AGPL-3.0 | 2026-08-14 | Node.js, React | Счета, клиенты, КП |
| 7 | [Dolibarr/dolibarr](https://github.com/Dolibarr/dolibarr) | 7 670 | dolibarr.org | ✅ | GPL-3.0 | 2026-09-29 | PHP | CRM+ERP, модуль «Interventions» (выезды), договоры |
| 8 | [SuiteCRM/SuiteCRM](https://github.com/SuiteCRM/SuiteCRM) | 5 775 | suitecrm.com | ❌ | AGPL-3.0 | 2026-09-17 | PHP | Зрелая CRM, конструктор модулей |
| 9 | [frappe/crm](https://github.com/frappe/crm) | 3 619 | frappe.io | ✅ | AGPL-3.0 | 2026-09-29 | Python, Vue | Современная CRM поверх Frappe |
| 10 | [espocrm/espocrm](https://github.com/espocrm/espocrm) | 3 424 | espocrm.com | ✅ | AGPL-3.0 | 2026-09-28 | PHP, JS | Простая, свои сущности/поля, REST API |
| 11 | [cortezaproject/corteza](https://github.com/cortezaproject/corteza) | 2 165 | cortezaproject.org | ❌ | Apache-2.0 | 2026-09-28 | Go, Vue | Low-code платформа, CRM собирается из модулей |
| 12 | [marmelab/atomic-crm](https://github.com/marmelab/atomic-crm) | 1 296 | marmelab.com | ✅ | MIT | 2026-09-28 | React, Supabase | Небольшая CRM-заготовка, удобно дописывать с ИИ |

## Выездные работы (Field Service) — дополнение к CRM

| Репозиторий | ⭐ | Владелец | Verified | Лицензия | Последний push | Что даёт |
|---|---|---|---|---|---|---|
| [OCA/field-service](https://github.com/OCA/field-service) | 198 | Odoo Community Association | ❌ | AGPL-3.0 | 2026-09-28 | Модули Odoo: заявки, выезды, объекты (locations), оборудование |
| [clawnify/OpenFieldService](https://github.com/clawnify/OpenFieldService) | 31 | clawnify.com (орг. 2026 г.) | ❌ | MIT | 2026-09-28 | Планирование выездов; молодой проект |
| [Beveren-Software-Inc/Field_Service_Management](https://github.com/Beveren-Software-Inc/Field_Service_Management) | 21 | нет сайта | ❌ | AGPL-3.0 | 2026-09-20 | Field Service для ERPNext |

## Специализированно «обследование зданий»

Готовых зрелых решений нет: самые популярные репозитории по запросам
«building/property inspection» — это исследовательские ML-проекты (трещины, дроны)
с 0–50 звёзд или брошенные учебные проекты. Например:
- phiyodr/building-inspection-toolkit — датасеты/модели дефектов (последний push 2023);
- SMART-NYUAD/ABECIS — распознавание трещин фасадов (2022);
- codeforamerica/inspector-gadget — планирование инспекций, UNMAINTAINED.
Их можно использовать как модуль «ИИ-распознавание дефектов по фото», но не как CRM.
