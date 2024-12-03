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