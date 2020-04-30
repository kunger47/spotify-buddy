var slider = document.getElementById("popularity-filter");
var output = document.getElementById("popularity-value");
var comparator = document.getElementById("popularity-compare");
output.innerHTML = slider.value;
comparator.innerHTML = comparator.value;

slider.oninput = function() {
output.innerHTML = this.value;
}

comparator.addEventListener('click', function() {
if(this.value == "=")
    this.value = '>=';
else if(this.value == ">=")
    this.value = '<=';
else 
    this.value = '=';
}, false);