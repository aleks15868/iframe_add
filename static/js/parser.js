let max_cout_page = 0;
let active_cout_page = 1;
let Open;
function iframe_delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function saveDataToLocalStorage(data, name_json) {
    // Сохраняем данные в localStorage с уникальным ключом для каждой страницы
    localStorage.setItem(`${name_json}`, JSON.stringify(data));
}

// Функция для получения данных из localStorage
function getDataFromLocalStorage(page) {
    const data = localStorage.getItem(`buildify_n${page}`);
    return data ? JSON.parse(data) : null;
}

// Функция для подгрузки и использования данных с сервера
async function fetchAndSavePage(page) {
    const cachedData = getDataFromLocalStorage(page);
    if (cachedData) {
        return cachedData;
    }

    const changing_filters = JSON.parse(localStorage.getItem('changing_filters'));
    const result_filters = Object.entries(changing_filters)
        .map(([key, value]) => `&${key}=${value}`)
        .join('');
    let json_conf=`&api_version=${api_version}&api_province=${api_province}&api_key=${api_key}`;
    try {
        const response = await fetch(`/api/data?page=${page}${result_filters}${json_conf}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        try {
            saveDataToLocalStorage(data, `buildify_n${page}`);
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                localStorage.clear();
                CheckChangingFilters();
                saveDataToLocalStorage(data, `buildify_n${page}`);
            } else {
                console.error('An error occurred while saving data to localStorage:', e);
            }
        }
        return data; // Возвращаем данные
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return null; // Возвращаем null в случае ошибки
    }
}



async function animation(iframe_check, dispay){
    if(!iframe_check){
        dispay.style.opacity = "0";
        await iframe_delay(500); // Теперь можно использовать await
        dispay.style.display = "none";
    }
    else{
        dispay.style.display = "flex";
        await iframe_delay(100);
        dispay.style.opacity = "1";
        dispay.style.height = "100%";
    }
}

// Функция для сравнения объектов
function isFiltersEqual(obj1, obj2) {
    // Проверяем, есть ли оба объекта и они не пустые
    if (!obj1 || !obj2) return false;

    // Получаем ключи обоих объектов
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Если количество ключей не совпадает, объекты разные
    if (keys1.length !== keys2.length) return false;

    // Сравниваем значения по ключам
    for (let key of keys1) {
        if (obj1[key] !== obj2[key]) {
        return false;
        }
    }

    return true;
}

function CheckChangingFilters(){
    let select_element_type = document.querySelector('.filter select[name="type"]');
    let select_element_neighbourhood = document.querySelector('.filter select[name="neighbourhood"]');
    let select_element_city = document.querySelector('.filter select[name="city"]');
    let element_input_bedroom = document.querySelector('.filter input[name="bedroom"]');
    let element_input_bathroom = document.querySelector('.filter input[name="bathroom"]');
    let element_input_max_min_range = document.querySelectorAll('.filter .priceRange_filter_row_two input');
    //let select_element_temp = document.querySelector('.filter select[name="temp"]');
    let element_input_min_area = document.querySelector('.filter input[name="min_area"]');
    let element_input_max_area = document.querySelector('.filter input[name="max_area"]');
    let changing_filters={
        //"type":select_element_type.value,
        "neighbourhood":select_element_neighbourhood.value,
        "cityOrDistrict": select_element_city.value,
        "maxBeds":element_input_bedroom.value,
        "maxBaths":element_input_bathroom.value,
        "startPrice":Math.min(element_input_max_min_range[0].value,element_input_max_min_range[1].value),
        "endPrice":Math.max(element_input_max_min_range[0].value,element_input_max_min_range[1].value),
        "minSize":element_input_min_area.value,
        "maxSize":element_input_max_area.value
    }
    const storageKey = 'changing_filters';

    // Получаем сохраненные данные из localStorage
    const storedFilters = JSON.parse(localStorage.getItem(storageKey));

    // Проверяем, есть ли сохраненные данные и отличаются ли они
    if (!storedFilters || !isFiltersEqual(storedFilters, changing_filters)) {
    // Если данных нет или они отличаются, перезаписываем их
    localStorage.clear();
    localStorage.setItem(storageKey, JSON.stringify(changing_filters));
    } 
}
async function AnimationCheked(page, flag){
    // Анимация включения
    animation(true, iframe_background);
    let div_apartment_listing_item="";
    // Изменение содержимого
    iframe_apartment_listing.innerHTML = `
            <div class="iframe_loader_body">
                <div class="iframe_loader">
                    <span class="iframe_bar"></span>
                    <span class="iframe_bar"></span>
                    <span class="iframe_bar"></span>
                </div>
                `+div_apartment_listing_item+`
            </div>
    `;
    CheckChangingFilters();
    const json = await fetchAndSavePage(page);
    let count_index = 0;
    json["results"].forEach(element => {
        try {
            replaceSellingStatus={
                "Selling Now":"Selling",
                "Registration":"Registration"
            }
            let name = "";
            let streetName = "";
            name = element["name"] && element["name"].length > 22 ? element["name"].slice(0, 20) + "..." : element["name"] || "TBD";
            element["startPrice"] = element["startPrice"].toLocaleString('en-US');
            element["sellingStatus"] = replaceSellingStatus[element["sellingStatus"]];
            let item = `<div class="apartment_listing_item" data-index="${count_index}">
                            <div class="apartment_image">
                                <div class="selling_status">${element["sellingStatus"] || 'TDB'}</div>
                                <img src="${element["coverPhoto"]?.url || 'static/image/default_image.jpg'}" alt="home">
                            </div>
                            <div class="apartament_name">${name}</div>
                            <div class="apartament_address">
                                <span><img src="static/image/icon_address.svg">${element["fullAddress"]}</span>
                            </div>
                            <div class="apartament_about_the_house">
                                <div class="apartament_price">From $${element["startPrice"] || "TBD"}</div>
                                <div class="apartament_characteristic">
                                    <div class="apartament_sq"><img src="static/image/icon_sq.svg"><span>${element["maxSize"] || "0"}m</span></div>
                                    <div class="apartament_bedroom"><img src="static/image/icon_bedroom.svg"><span>${element["maxBeds"] || "0"}</span></div>
                                    <div class="apartament_bathroom"><img src="static/image/icon_bathroom.svg"><span>${element["maxBaths"] || "0"}</span></div>
                                </div>
                            </div>
                        </div>`;
            div_apartment_listing_item += item;
            count_index++;
        } catch (error) {
            console.error(`Error processing element: ${error.message}`, element);
            // Если нужно продолжать, просто пропускаем текущий элемент.
        }
    });
    
    // Обработка страниц
    try {
        let page_span = document.querySelectorAll('.page span');
        max_cout_page = Math.ceil(json["total"] / 9);
        for (let index = 0; index < 3; index++) {
            if (index > max_cout_page - 1) {
                page_span[index].style.display = "none";
            } else {
                page_span[index].style.display = "flex";
            }
            if (flag) {
                page_span[index].innerHTML = index + 1;
            }
        }
        await TurningPages(0, max_cout_page);
    } catch (error) {
        console.error(`Error processing pagination: ${error.message}`);
    }    
        iframe_apartment_listing.innerHTML = `
        <div class="iframe_loader_body">
            <div class="iframe_loader">
                <span class="iframe_bar"></span>
                <span class="iframe_bar"></span>
                <span class="iframe_bar"></span>
            </div>
        </div>
        `+div_apartment_listing_item+`
    `;
    iframe_background = document.querySelector('.iframe_loader_body');
    animation(false, iframe_background);
}

async function TurningPages(delta, max_input){
    let page_span = document.querySelectorAll('.page span');
    page_span.forEach(element => {
        element.innerHTML = Number(element.innerHTML)+delta;
        if(element.innerHTML == active_cout_page){
            element.classList.add("page_active");
        }
        else{
            element.classList.remove("page_active");
        }
    });
    if(delta==1 && page_span[0].innerHTML != 1){
        document.querySelector('.page_arrow.page_arrow_left').style.display = "flex";
    }
    if(page_span[0].innerHTML == 1){
        document.querySelector('.page_arrow.page_arrow_left').style.display = "none";
    }
    if(max_input>3){
        if(page_span[0].innerHTML != max_input-2){
            document.querySelector('.page_arrow.page_arrow_right').style.display = "flex";
        }
        else{
            document.querySelector('.page_arrow.page_arrow_right').style.display = "none";
        } 
    }
    else{
        document.querySelector('.page_arrow.page_arrow_right').style.display = "none";
    }
}
let iframe_background = document.querySelector('.iframe_loader_body');
const iframe_button = document.querySelector('.buttons_search');
let iframe_apartment_listing = document.querySelector('.apartment_listing');
const page_arrow_left = document.querySelector('.page_arrow.page_arrow_left');
const page_arrow_right = document.querySelector('.page_arrow.page_arrow_right');
const page_active = document.querySelectorAll('.page_num');
window.addEventListener('load', async (event) => {
    await AnimationCheked(0,true);
});

iframe_button.addEventListener('click', async (event) => {
    active_cout_page = 1;
    await AnimationCheked(0,true);
});

page_arrow_left.addEventListener('click', async (event) => {
    await TurningPages(-1,max_cout_page);
});
page_arrow_right.addEventListener('click', async (event) => {
    await TurningPages(1,max_cout_page);
});
page_active.forEach(element => {
    element.addEventListener('click', async (event) => {
        if(active_cout_page != event.target.textContent){
            active_cout_page = event.target.textContent
            let page_span = document.querySelectorAll('.page span');
            if((event.target.textContent>1) && (event.target.textContent<max_cout_page)){
                for (let index = 0; index < 3; index++) {
                    if(event.target.textContent == page_span[index].innerHTML){
                        await TurningPages(index-1,max_cout_page);
                    }
                }
            }
            page_span.forEach(element => {
                if(element.innerHTML == active_cout_page){
                    element.classList.add("page_active");
                }
                else{
                    element.classList.remove("page_active");
                }
            });
            await AnimationCheked(Number(active_cout_page)-1, false);
        }
    });
});
