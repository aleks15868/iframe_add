const textInputs = document.querySelectorAll('.filter input[type="text"]');
    textInputs.forEach(input => {
        input.addEventListener('input', (event) => {
            event.target.value = event.target.value.replace(/[^0-9.,]/g, '');
        });
    });
function redirectToProvincePage(selectElement) {
    const province = selectElement.value; // Получаем значение из select
    const baseUrl = window.location.origin; // Получаем текущий домен и протокол
    const url = `${baseUrl}/${province}?apiVersion=${api_version}&apiKey=${api_key}`; // Формируем URL
    window.location.href = url; // Переходим по сформированному URL
    }
const bedroom = document.querySelector('.room .popup_bedroom');
const bathroom = document.querySelector('.room .popup_bathroom');
document.body.addEventListener('click', function(event) {
    // Проверяем, что клик был не на input внутри .filter_type_dropdown_content
    if (event.target.closest('.filter_type_dropdown_button')) {
        const dropdownContent = document.querySelector('.filter_type_dropdown_content');
        if (dropdownContent) {
            dropdownContent.style.display = 'flex';
        }
    }else{
        if (!event.target.closest('.filter_type_dropdown_content input')) {
        // Находим элемент с классом .filter_type_dropdown_content и скрываем его
        const dropdownContent = document.querySelector('.filter_type_dropdown_content');
        if (dropdownContent) {
            dropdownContent.style.display = 'none';
        }
    }
    }
    if(!event.target.closest('.room .popup_room')){
        if (!event.target.closest('.room .input_bedroom')) {
            // Находим элемент с классом .filter_type_dropdown_content и скрываем его
            if (bedroom) {
                bedroom.style.display = 'none';
            }
        }else{
            if (bedroom) {
                bedroom.style.display = 'block';
            }
        }
        if (!event.target.closest('.room .input_bathroom')) {
            // Находим элемент с классом .filter_type_dropdown_content и скрываем его
            if (bathroom) {
                bathroom.style.display = 'none';
            }
        }else{
            if (bathroom) {
                bathroom.style.display = 'block';
            }
        }
    }
});
const bedroom_item = document.querySelectorAll('.filter .room .popup_bedroom .popup_room_item')
bedroom_item.forEach(item=>{
    item.addEventListener('click', function() {
        let dataBedroom= item.getAttribute('data-bedroom');
        console.log("bedroom:",dataBedroom); // Выводит значение атрибута data-bedroom
        bedroom_item.forEach(data=>{
            data.classList.remove('popup_room_item_active'); 
        });
        item.classList.add('popup_room_item_active'); 
        bedroom.style.display="none";
        document.querySelector('.room .input_bedroom').setAttribute('data-bedroom', dataBedroom);
        document.querySelector('.room .input_bedroom').innerHTML=dataBedroom+"+";
    });
});
const bathroom_item = document.querySelectorAll('.filter .room .popup_bathroom .popup_room_item')
bathroom_item.forEach(item=>{
    item.addEventListener('click', function() {
        let dataBathroom= item.getAttribute('data-bathroom');
        console.log("bathroom:",dataBathroom); // Выводит значение атрибута data-bedroom
        bathroom_item.forEach(data=>{
            data.classList.remove('popup_room_item_active'); 
        });
        item.classList.add('popup_room_item_active'); 
        bathroom.style.display="none";
        document.querySelector('.room .input_bathroom').setAttribute('data-bathroom', dataBathroom);
        document.querySelector('.room .input_bathroom').innerHTML=dataBathroom+"+";
    });
});




const city = document.querySelector('select[name="city"]');
const neighbourhood = document.querySelectorAll('select[name="neighbourhood"] option');

city.addEventListener('change', () => {
    const selectedOption = city.options[city.selectedIndex];
    const value = selectedOption.value;
    
    neighbourhood.forEach(item => {
        const dataCity = item.getAttribute('data-city');
        
        // Проверка, существует ли 'data-city' и не является ли он пустым
        if (dataCity && dataCity.includes(value)) {
            item.style.display="block";
        }
        else{
            item.style.display="none";
        }
    });
    neighbourhood[1].style.display="block";
    document.querySelector('select[name="neighbourhood"]').selectedIndex = 1;
});