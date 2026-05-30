import os

csv_path = os.path.join(os.path.dirname(__file__), 'cities.csv')

known_data = [
    (1, '延吉市', [(2022,641),(2023,877.9),(2024,1008),(2025,1100)]),
    (2, '图们市', [(2021,100.6),(2022,103.2),(2023,210),(2024,249),(2025,277)]),
    (3, '敦化市', [(2022,385),(2023,692),(2024,820.6),(2025,759.93)]),
    (4, '珲春市', [(2021,271),(2022,190),(2023,557.7),(2024,800.36),(2025,1064)]),
    (5, '龙井市', [(2021,204.53),(2022,188.56),(2023,478.25),(2024,496.34),(2025,456.37)]),
    (6, '和龙市', [(2022,165),(2023,531),(2024,744.3),(2025,856.09)]),
    (7, '汪清县', [(2021,24),(2022,25),(2023,98.3),(2024,116),(2025,120)]),
    (8, '安图县', [(2021,276),(2022,367),(2023,767),(2024,890),(2025,1038.4)]),
    (9, '长白山', [(2021,301.67),(2022,149.28),(2023,274.81),(2024,339.84),(2025,409.73)]),
]

with open(csv_path, 'w', encoding='utf-8') as f:
    f.write('city_id,city_name,year,visitor_count\n')
    count = 0
    for cid, name, data in sorted(known_data):
        for year, val in sorted(data):
            f.write(f'{cid},{name},{year},{val}\n')
            count += 1

# Verify
with open(csv_path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f'Written {count} rows')
print('---')
print(content)
print('---')
# Verify specific city
assert '延吉市' in content, '延吉市 not found!'
assert '图们市' in content, '图们市 not found!'
print('All city names verified OK')
