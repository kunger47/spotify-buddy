var popSlider = document.getElementById("popularity-filter");
var popOutput = document.getElementById("popularity-value");
var popComparator = document.getElementById("popularity-compare");
popOutput.innerHTML = popSlider.value;
popComparator.innerHTML = popComparator.value;

popSlider.oninput = function() {
    popOutput.innerHTML = this.value;
}

popComparator.addEventListener('click', function() {
if(this.value == "=")
    this.value = '>=';
else if(this.value == ">=")
    this.value = '<=';
else 
    this.value = '=';
}, false);

var lengthSlider = document.getElementById("length-filter");
var lengthOutput = document.getElementById("length-value");
var lengthComparator = document.getElementById("length-compare");
lengthOutput.innerHTML = lengthSlider.value;
lengthComparator.innerHTML = lengthComparator.value;

lengthSlider.oninput = function() {
    lengthOutput.innerHTML = this.value;
}

lengthComparator.addEventListener('click', function() {
if(this.value == "=")
    this.value = '>=';
else if(this.value == ">=")
    this.value = '<=';
else 
    this.value = '=';
}, false);