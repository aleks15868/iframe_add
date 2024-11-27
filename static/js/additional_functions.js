const textInputs = document.querySelectorAll('.filter input[type="text"]');
    textInputs.forEach(input => {
        input.addEventListener('input', (event) => {
            event.target.value = event.target.value.replace(/[^0-9.,]/g, '');
        });
    });
