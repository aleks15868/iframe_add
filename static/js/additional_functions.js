const textInputs = document.querySelectorAll('.filter input[type="text"]');
    textInputs.forEach(input => {
        input.addEventListener('input', (event) => {
            event.target.value = event.target.value.replace(/[^0-9.,]/g, '');
        });
    });
function logHeights(className, maxWidth = 768) {
    const documentHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
    );
    const element = document.querySelector(`.${className}`);
    const elementHeight = element ? element.offsetHeight : 0;
    let rect = element.getBoundingClientRect();
    let lowestPixel = rect.bottom + window.scrollY;
    if (window.innerWidth <= maxWidth) {
        document.querySelector(`.${className}`).style.marginBottom = String(Math.max(10,documentHeight - lowestPixel))+"px";
    }
}
    