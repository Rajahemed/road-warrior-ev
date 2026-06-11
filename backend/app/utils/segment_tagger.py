def segment_tagger(data):
    if data.get("accidental_insurance") == "No":
        return "PERSONAL_INSURANCE_LEAD"
    if data.get("bike_insurance") == "No":
        return "BIKE_INSURANCE_LEAD"
    if data.get("open_to_rental") == "Yes":
        return "EV_RENTAL_LEAD"
    if data.get("open_to_ev") == "Yes":
        return "EV_SALE_LEAD"
    if data.get("vehicle_type") == "Petrol":
        return "RETROFIT_LEAD"
    if data.get("wants_product") == "Yes":
        return "PRODUCT_LEAD"

    return "GENERAL_LEAD"