const rangeInput = document.querySelectorAll(".custom-range");
    let line = document.querySelector(".hide_minimum_priceRange");
    let Show = document.querySelector(".priceRange_show");
    let minimum = rangeInput[0].value = rangeInput[0].getAttribute("min");
    let maximum = rangeInput[1].value = rangeInput[1].getAttribute("max");
    let delta_procent=0;
    if((rangeInput[0].getAttribute("max")-rangeInput[0].getAttribute("min")) !== 0){
        delta_procent = 100/(rangeInput[0].getAttribute("max")-rangeInput[0].getAttribute("min"));
    }
    rangeInput.forEach(input => {
        input.addEventListener("input", () => {
            let min_input = Math.min(rangeInput[0].value, rangeInput[1].value);
            let max_input = Math.max(rangeInput[0].value, rangeInput[1].value);
            if((rangeInput[0].getAttribute("max")-rangeInput[0].getAttribute("min")) !== 0){
                Show.innerHTML="<div>From: <span>$"+min_input.toLocaleString('en-US')+"</span></div><div>To: <span>$"+max_input.toLocaleString('en-US')+"</span></div>";
            }else{
                Show.innerHTML="<div>From: <span>$TBD</span></div><div>To: <span>$TBD</span></div>";
            }
            line.style.left = delta_procent*(min_input-minimum)+"%";
            line.style.width =Math.abs(max_input-min_input)*delta_procent+"%";
        });
    });