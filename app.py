import requests
from flask import Flask, jsonify, render_template, abort, request, redirect, url_for
from functools import lru_cache
from flask_cors import CORS
import json
import re
import urllib.parse

app = Flask(__name__)

# Включение CORS
CORS(app)

def request_onload(api_key,api_version,api_province):
    url = f"https://api.getbuildify.com/{api_version}/{api_province}/search_listings?page=0&perPage=0&facets=type%2Cneighbourhood%2CcityOrDistrict%2CendPrice%2CstartPrice"

    headers = {
        "accept": "application/json",
        "x-api-key": api_key
    }
    req=requests.get(url, headers=headers)
    return req.text

@lru_cache(maxsize=256)
def get_data_from_api(api_version, api_province, api_key):
    url = f"https://api.getbuildify.com/{api_version}/{api_province}/search_listings?page=0&perPage=0"
    headers = {"accept": "application/json", "x-api-key": api_key}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        if 'code' in response.json():
            return None  # Возвращаем JSON-данные
        return response.json()
    return None  # В случае ошибки вернётся None

@app.route('/api/modal_features_data', methods=['GET'])
def modal_features_get_data():
     # Получаем параметр page из строки запроса
    Object = request.args.get('object')
    if Object is None:
        return jsonify({"error": "Parameter 'page' is required"}), 400
    
    api_version = request.args.get('api_version')
    api_province = request.args.get('api_province')
    api_key = request.args.get('api_key')

    url = f'https://api.getbuildify.com/{api_version}/{api_province}/listing?id={Object}&retrieveAttributes=architects%2Cbuilders%2CinteriorDesigners%2CmarketingCompanies%2CsalesCompanies&referrences=architects%2Cbuilders%2CinteriorDesigners%2CmarketingCompanies%2CsalesCompanies'
    headers = {
        "accept": "application/json",
        "x-api-key": api_key
    }
    response = requests.get(url, headers=headers)
    # Возвращаем JSON
    return response.text

@app.route('/api/data', methods=['GET'])
def get_data():
    # Получаем параметр page из строки запроса
    page = request.args.get('page', type=int)
    request_array_key = ["neighbourhood","cityOrDistrict","maxBeds","maxBaths","startPrice", "endPrice","minSize","maxSize"]
    request_json = {key: request.args.get(key) for key in request_array_key}  
    string_url = f'startPrice >= {request_json["startPrice"]}  AND startPrice <= {request_json["endPrice"]}'
    if request_json["minSize"] != "":
        string_url+=f' AND minSize >= {request_json["minSize"]}'
    if request_json["maxSize"] != "":
        string_url+=f' AND maxSize <= {request_json["maxSize"]}'
    for key in ["maxBeds","maxBaths","neighbourhood","cityOrDistrict"]:
        if request_json[key] != "":
            string_url+=f' AND {key}:"{request_json[key]}"'

    if page is None:
        return jsonify({"error": "Parameter 'page' is required"}), 400
    
    api_version = request.args.get('api_version')
    api_province = request.args.get('api_province')
    api_key = request.args.get('api_key')

    url = f'https://api.getbuildify.com/{api_version}/{api_province}/search_listings?page={page}&perPage=9&filterQuery={urllib.parse.quote(string_url)}'
    headers = {
        "accept": "application/json",
        "x-api-key": api_key
    }
    response = requests.get(url, headers=headers)
    # Возвращаем JSON
    return response.text

routes = {
    "on": "Ontario",
    "bc": "British Columbia",
    "ab": "Albertn",
    "mb": "Manitoba",
    "nb": "New Brunswick",
    "nl": "Newfoundland and Labrador",
    "ns": "Nova Scotia",
    "pe": "Prince Edward Island",
    "qc": "Quebec",
    "sk": "Saskatchewan"
  }

for route in routes.keys():
    @app.route(f'/{route}', defaults={'path': route}, endpoint=f'handler_{route}')
    @app.route('/<path:path>', endpoint=f'handler_{route}')
    def handler(path):
        api_version = request.args.get('apiVersion')
        api_province = path
        api_key = request.args.get('apiKey')

        if not api_version or not api_key:
            return abort(400, description="The apiVersion and apiKey parameters are required")

        # Запрос к API
        api_data = get_data_from_api(api_version, api_province, api_key)
        province=[]
        for key in routes.keys():
            item = {
                "name":routes[key],
                "value":key,
                "active":False
            }
            if key == path:
                item["active"] = True

            province.append(item)
        if api_data is None:
            return "You entered something incorrectly", 400  # Ошибка, если данные не получены

        api_response = json.loads(request_onload(api_key,api_version,api_province))["facets"]
        option_type=[]
        option_neighbourhood=[]
        option_city=[]
        
        # Возвращаем простой HTML-код
        # if "type" in api_response:
        #     option_type=[key for key in api_response["type"].keys()]
        #     option_type = sorted(option_type, key=str.lower)
        if "neighbourhood" in api_response:
            option_neighbourhood=[key for key in api_response["neighbourhood"].keys()]
            option_neighbourhood = sorted(option_neighbourhood, key=str.lower)
        if "cityOrDistrict" in api_response:
            option_city=[key for key in api_response["cityOrDistrict"].keys()]   
            option_city = sorted(option_city, key=str.lower)
        max_int=0    
        min_int=0
        min_str="TBD"
        max_str="TBD" 
        if "startPrice" in api_response:
            if (api_response["startPrice"] !=[]):
                max_int=max([int(key) for key in api_response["startPrice"].keys()])
                max_str=re.sub(r'(?<=\d)(?=(\d{3})+$)', ',', str(max_int))
                min_int=min([int(key) for key in api_response["startPrice"].keys()])
                min_str=re.sub(r'(?<=\d)(?=(\d{3})+$)', ',', str(min_int))
        return render_template('index.html', 
            option_type=option_type,
            province=province,
            max_int=max_int,
            min_int=min_int,
            min_str=min_str,
            max_str=max_str,
            option_neighbourhood=option_neighbourhood,
            option_city=option_city,
            api_version=api_version,
            api_province=api_province,
            api_key=api_key)

@app.route('/')
def index():
    # Получаем параметры из текущего запроса
    api_version = request.args.get('apiVersion')
    api_key = request.args.get('apiKey')
    api_province = request.args.get('path', 'on')  # Если path не передан, по умолчанию используем 'on'

    # Перенаправляем на соответствующий маршрут
    return redirect(url_for(f'handler_{api_province}', apiVersion=api_version, apiKey=api_key))

if __name__ == '__main__':
    app.run(debug=True)