def get_language(city):

    city = city.lower()

    karnataka = [
        "bangalore",
        "bengaluru",
        "mysore",
        "hubli",
        "mangalore"
    ]

    if city in karnataka:

        return "Kannada"

    return "English"