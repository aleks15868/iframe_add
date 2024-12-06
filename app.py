import requests
from flask import Flask, jsonify, render_template, abort, request, redirect, url_for
from functools import lru_cache
from flask_cors import CORS
import json
import re
import urllib.parse
from datetime import datetime

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

def paser_api_city(api_key,api_version,api_province,total):
    count=0
    array_city=set()
    while True:
        url = f"https://api.getbuildify.com/{api_version}/{api_province}/search_listings?page={count}&perPage=1000&retrieveAttributes=neighbourhood%2CcityOrDistrict%2CestimatedCompletionDate%2CminBeds%2CminBaths&referrences=neighbourhood%2CcityOrDistrict%2CestimatedCompletionDate%2CminBeds%2CminBaths"
        count+=1
        headers = {
            "accept": "application/json",
            "x-api-key": api_key
        }
        req = requests.get(url, headers=headers)
        array_city = {}
        array_json_city = []
        move_in_date_array=[]
        pattern = r'20\d{2}'
        current_year = datetime.now().year
        for elem in json.loads(req.text)["results"]:
            if 'estimatedCompletionDate' in elem and 'minBeds' in elem and 'minBaths' in elem:
                if elem["minBeds"] is not None and elem["minBaths"] is not None:
                    if elem["estimatedCompletionDate"] is not None and elem["estimatedCompletionDate"]!="" and elem["minBeds"]>=1 and elem["minBaths"]>=1:
                        years = re.findall(pattern, elem["estimatedCompletionDate"])
                        filtered_years = [year for year in years if current_year <= int(year) <= 2199]
                        move_in_date_array.extend(filtered_years)
            for item in elem["neighbourhood"]:
                if item not in array_city:
                    array_city[item]=[]
                if 'cityOrDistrict' in elem:
                    if (elem["cityOrDistrict"] not in array_city[item]) and (elem["cityOrDistrict"] not in [None,""]):
                        array_city[item].append(elem["cityOrDistrict"])
        if total < count*1000:
            for item in array_city.keys():
                array_json_city.append({"city":",".join(array_city[item]), "neighbourhood":item})
            return [array_json_city,move_in_date_array]
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

def parser_is_move_in_ready(api_version,api_province,api_key,end_url,data,page):
    count = 0
    move_in_ready_count = 0

    temp_cout = 0

    move_in_ready = []
    url = f'https://api.getbuildify.com/{api_version}/{api_province}/search_listings?page=0&perPage=1000&filterQuery={end_url}'
    headers = {
            "accept": "application/json",
            "x-api-key": api_key
        }
    count+=1
    response = requests.get(url, headers=headers)
    response = json.loads(response.text)
    if 'results' in response:
        req = response["results"]
        for item in req:
            temp_cout+=1
            if 'estimatedCompletionDate' in item:
                if item["estimatedCompletionDate"] is not None:
                    if data in item["estimatedCompletionDate"]:
                        if move_in_ready_count >= page*9 and  move_in_ready_count<=page*9+8:
                            move_in_ready.append(item)
                        move_in_ready_count+=1
    
        if response["total"]>1000:
            while count*1000 < response["total"]:
                url = f'https://api.getbuildify.com/{api_version}/{api_province}/search_listings?page={count}&perPage=1000&filterQuery={end_url}'
                headers = {
                        "accept": "application/json",
                        "x-api-key": api_key
                    }
                response = requests.get(url, headers=headers)
                response = json.loads(response.text)
                req = response["results"]
                for item in req:
                    if 'estimatedCompletionDate' in item:
                        if item["estimatedCompletionDate"] is not None:
                            if data in item["estimatedCompletionDate"]:
                                if move_in_ready_count >= page*9 and  move_in_ready_count<=page*9+8:
                                    move_in_ready.append(item)
                                move_in_ready_count+=1
    return json.dumps({
        "results":move_in_ready,
        "total":move_in_ready_count
    }, ensure_ascii=False)




@app.route('/api/data', methods=['GET'])
def get_data():
    # Получаем параметр page из строки запроса
    page = request.args.get('page', type=int)
    request_array_key = ["type","neighbourhood","cityOrDistrict","minBeds","minBaths","startPrice", "endPrice","date"]
    request_json = {key: request.args.get(key) for key in request_array_key}  
    string_url = f'startPrice >= {request_json["startPrice"]}  AND startPrice <= {request_json["endPrice"]}'
    if request_json["type"] !="":
        string_url += f' AND {request_json["type"]}'
    if request_json["minBeds"] != "":
        string_url+=f' AND minBeds >= {request_json["minBeds"]}'
    if request_json["minBaths"] != "":
        string_url+=f' AND minBaths >= {request_json["minBaths"]}'
    for key in ["neighbourhood","cityOrDistrict"]:
        if request_json[key] != "":
            string_url+=f' AND {key}:"{request_json[key]}"'

    if page is None:
        return jsonify({"error": "Parameter 'page' is required"}), 400
    api_version = request.args.get('api_version')
    api_province = request.args.get('api_province')
    api_key = request.args.get('api_key')

    if  request_json["date"]=="":
        url = f'https://api.getbuildify.com/{api_version}/{api_province}/search_listings?page={page}&perPage=9&filterQuery={urllib.parse.quote(string_url)}'
        headers = {
            "accept": "application/json",
            "x-api-key": api_key
        }
        response = requests.get(url, headers=headers)
        # Возвращаем JSON
        return response.text
    else:
        return parser_is_move_in_ready(api_version,api_province,api_key,urllib.parse.quote(string_url),request_json["date"],page)

routes = {
    "on": "Ontario",
    "bc": "British Columbia",
    # "ab": "Albertn",
    # "mb": "Manitoba",
    # "nb": "New Brunswick",
    # "nl": "Newfoundland and Labrador",
    # "ns": "Nova Scotia",
    # "pe": "Prince Edward Island",
    # "qc": "Quebec",
    # "sk": "Saskatchewan"
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

        api_response = json.loads(request_onload(api_key,api_version,api_province))
        total = api_response["total"]
        api_response = api_response["facets"]
        option_type=[]
        option_neighbourhood=[]
        option_city=[]
        option_move_in_date=[]

        if "type" in api_response:
            for key in api_response["type"].keys():
                if key=="Condo":
                    option_type.append({"name":key,"active":True})
                else:
                    option_type.append({"name":key,"active":False})
            option_type = sorted(option_type, key=lambda x: x["name"])
        if "cityOrDistrict" in api_response:
            option_city=[key for key in api_response["cityOrDistrict"].keys()]   
            option_city = sorted(option_city, key=str.lower)
        if ("cityOrDistrict" in api_response) and ("neighbourhood" in api_response):
            option_array=paser_api_city(api_key,api_version,api_province, total)
            option_neighbourhood=option_array[0]
            option_neighbourhood = sorted(option_neighbourhood, key=lambda x: x["neighbourhood"])
            option_move_in_date=set(option_array[1])
            option_move_in_date = sorted(option_move_in_date, key=str.lower)
            
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
            option_move_in_date=option_move_in_date,
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