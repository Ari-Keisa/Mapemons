import re

with open('pages/kanto.html', 'r', encoding='utf-8') as f:
    kanto_html = f.read()

dynamic_maps = """
        // Dynamic mapping based on emojis and text for {{REGION}}
        const {{region}}TypeMap = new Proxy({}, {
            get: function(target, prop) {
                if (!prop) return undefined;
                const strProp = String(prop);
                
                // Exceptions based on text
                if (strProp.includes("Вихревые") || strProp.includes("Колодец")) return "special";
                if (strProp.includes("Озеро")) return "island";
                
                const emojiMap = {
                    "city": ["🏘", "🌆", "🏬", "🏙"],
                    "route": ["🛣", "🌊", "🛤", "Тропа", "Ворота"],
                    "special": ["🛕", "🛖", "🧊", "⛩", "✨", "🔮", "Башня"],
                    "forest": ["🌲", "🌳", "🏞", "🏕", "Лес", "парк"],
                    "cave": ["🍘", "🐉", "🕳", "Пещера", "Тоннель", "Логово"],
                    "island": ["🏝", "🏖"],
                    "mountain": ["🏔", "⛰", "🌋", "Гора"],
                    "other": ["🗼", "🛳", "🏜", "🌉", "🏟", "Маяк", "рубеж", "Зона", "Руины", "Штаб"]
                };
                
                for (let type in emojiMap) {
                    for (let indicator of emojiMap[type]) {
                        if (strProp.includes(indicator)) return type;
                    }
                }
                return undefined;
            }
        });
        
        const {{region}}DisplayMap = new Proxy({}, {
            get: function(target, prop) {
                return prop; // Use the raw ru_name which already includes emojis
            }
        });
"""

# Match the two dictionaries
pattern = re.compile(r'const kantoTypeMap = \{.*?\};.*?const kantoDisplayMap = \{.*?\};', re.DOTALL)

regions = [
    ("JOHTO", "Johto", "johto", "Джото"),
    ("HOENN", "Hoenn", "hoenn", "Хоэнн"),
    ("SINNOH", "Sinnoh", "sinnoh", "Синно"),
    ("UNOVA", "Unova", "unova", "Юнова")
]

for REGION, Region, region_lower, Region_ru in regions:
    new_html = kanto_html
    
    # Replace maps
    replacement = dynamic_maps.replace("{{REGION}}", REGION).replace("{{region}}", region_lower)
    new_html = pattern.sub(replacement, new_html)
    
    # Replace names
    new_html = new_html.replace("KANTO", REGION)
    new_html = new_html.replace("Kanto", Region)
    new_html = new_html.replace("kanto", region_lower)
    new_html = new_html.replace("Канто", Region_ru)
    
    with open(f"pages/{region_lower}.html", "w", encoding="utf-8") as f:
        f.write(new_html)

print("All region pages generated successfully!")
