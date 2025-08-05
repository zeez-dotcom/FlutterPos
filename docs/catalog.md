# Default Catalog

This system ships with a pre-seeded catalog of laundry service categories, clothing items, and prices. The data is inserted automatically when a new user account is created.

## Categories

| Type | English Name | Arabic Name |
| --- | --- | --- |
| Service | Normal Iron | كي عادي |
| Service | Normal Wash | غسيل عادي |
| Service | Normal Wash & Iron | غسيل وكي عادي |
| Service | Urgent Iron | كي مستعجل |
| Service | Urgent Wash | غسيل مستعجل |
| Service | Urgent Wash & Iron | غسيل وكي مستعجل |
| Clothing | Clothing Items | ملابس |

## Price Matrix

Prices are defined for each clothing item across all service categories. The matrix below shows how services map to clothing items.

| Clothing Item | Normal Iron | Normal Wash | Normal Wash & Iron | Urgent Iron | Urgent Wash | Urgent Wash & Iron |
| --- | --- | --- | --- | --- | --- | --- |
| Thobe (ثوب) | 4 | 5 | 7 | 6 | 7 | 9 |
| Shirt (قميص) | 2 | 3 | 4 | 3.5 | 4.5 | 5.5 |
| T-Shirt (تيشيرت) | 1.5 | 2.5 | 3.5 | 3 | 4 | 5 |
| Trouser (بنطال) | 2.5 | 3.5 | 4.5 | 4 | 5 | 6 |

## Seeding and Customization

During user creation the server seeds:

- **Categories** using the list above
- **Clothing items** such as Thobe, Shirt, T-Shirt and Trouser
- **Laundry services** for every clothing item and service category combination

After onboarding, administrators can customize the catalog through the **Admin → Categories** section by adding new categories, editing names or translations, and adjusting service prices.

