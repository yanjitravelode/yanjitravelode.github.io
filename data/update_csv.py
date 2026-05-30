import os

# New data from txt files (only year >= 2021)
# Mapped by data signature pattern
new_data = {
    (1, '延吉市'): [(2020,345.64),(2021,590.40),(2022,641),(2023,877.9),(2024,1080),(2025,1160)],
    (2, '图们市'): [(2022,103.2),(2023,210),(2024,249),(2025,277)],
    (3, '敦化市'): [(2020,205),(2022,385),(2023,692),(2024,820.6)],
    (4, '珲春市'): [(2020,297.7),(2021,271),(2022,193.62),(2023,557.73),(2024,800.86),(2025,1200)],
    (5, '龙井市'): [(2021,204.53),(2022,188.56),(2023,478.25),(2024,496.34),(2025,456.37)],
    (6, '和龙市'): [(2020,170),(2021,181),(2022,199),(2024,744.3)],
    (7, '汪清县'): [(2020,23),(2021,24),(2022,25),(2023,98.3),(2024,116)],
    (8, '安图县'): [(2020,315.02),(2022,367),(2023,767),(2024,890),(2025,1038.4)],
    (9, '长白山'): [(2020,315.40),(2021,301.67),(2022,149.28),(2023,274.81),(2024,339.84),(2025,409.73)],
}

csv_path = os.path.join(os.path.dirname(__file__), 'cities.csv')
with open(csv_path, 'w', encoding='utf-8') as f:
    f.write('city_id,city_name,year,visitor_count\n')
    count = 0
    for cid, name in sorted(new_data):
        for year, val in sorted(new_data[(cid, name)], key=lambda x: x[0]):
            if year >= 2021:
                f.write(f'{cid},{name},{year},{val}\n')
                count += 1

with open(csv_path, 'r', encoding='utf-8') as f:
    content = f.read()
print(f'Wrote {count} rows')
print(content)
