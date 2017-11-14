Uint8ClampedArray.prototype.setColor = function(i,color){
    this[i] = color;
    this[i+1] = color;
    this[i+2] = color;
};

Uint8ClampedArray.prototype.transformToGrey = function(){
    for (var i = 0; i < this.length; i += 4) {
        var avg = (this[i] + this[i + 1] + this[i + 2]) / 3;
        this.setColor(i,avg);
    }
};

Uint8ClampedArray.prototype.getColorsAtIndeces = function(indeces){
    var colors = [];
    for (var i = 0 ; i < indeces.length; i ++){
        colors[i] = this[indeces[i] * 4];
    }
    return colors;
};

var canvas = $('#myCanvas')[0];
var ctx = canvas.getContext("2d");
var img = new Image();

img.addEventListener('load', function() {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    var imageData = ctx.getImageData(0, 0, img.width, img.height);
    imageData.data.transformToGrey();
    originalImage = imageData;
    adjustedImage = imageData;
    ctx.putImageData(originalImage, 0, 0);
    drawHisto();
});
img.src = 'Lena.png';

$(document).on('change', '#filterDropdown', function() {
    selectedFilter = $(this).find(":selected").val();
    console.log(selectedFilter + " selected");
    updateImage();
});

$(document).on('input change', '#slider', function() {
    brightness = parseInt($(this).val());
    $('#slider_value').html(brightness);
    updateImage();
});

$(document).on('input change', '#binSize', function() {
    amountOfBins = parseInt($(this).val());
    drawHisto();
});

var originalImage;
var adjustedImage;
var brightness = 0;
var selectedFilter = "none";
var amountOfBins = 50;

function updateImage(){
    var brightnessAdjustedImage = adjustBrightness(originalImage,parseInt(brightness));
    adjustedImage = useFilter(brightnessAdjustedImage);
    ctx.putImageData(adjustedImage , 0, 0);
    drawHisto();
}

function limitColorRange(wantedColor){
    if (wantedColor < 0)
        return 0;
    else if (wantedColor > 255)
        return 255;
    else return wantedColor;
}

function adjustBrightness(origImage) {
    var adjustetImageData = origImage.data.slice(0);
    for (var i = 0; i < adjustetImageData.length; i += 4) {
        var adjustedColor = limitColorRange(adjustetImageData[i] + brightness);
        adjustetImageData.setColor(i,adjustedColor);
    }
    return new ImageData(adjustetImageData,origImage.width,origImage.height);
}

function extracted(value, maxValue) {
    var mappedValue;
    if (value < 0)
        mappedValue = Math.abs(value);
    else if (value >= maxValue)
        mappedValue = maxValue - (value - maxValue + 2);
    else mappedValue = value;
    return mappedValue;
}

function getKernelIndeces(width, height, index){
    var row = (index / width) | 0 ;
    var column = index % width;
    var kernelIndeces = [];
    var i = 0;
    for(var verticalReal = row - 1; verticalReal <= row +1; verticalReal ++){
        var verticalProjected = extracted(verticalReal, height);
        for(var horizontal = column - 1; horizontal <= column +1; horizontal ++) {
            var horizontalProjected = extracted(horizontal,width);
            kernelIndeces[i] = verticalProjected * width + horizontalProjected;
            i ++;
        }
    }
    return kernelIndeces;
}

function applyFilterOnKernel(colorsInKernel) {
    if(selectedFilter == "min"){
        var smallestColor = Math.min.apply(this, colorsInKernel);
        return smallestColor;
    } else if( selectedFilter == "median"){
        colorsInKernel.sort();
        return colorsInKernel[4];
    } else if( selectedFilter == "box"){
        var sum = colorsInKernel.reduce((a,b) =>  a+b ,0);
        return sum / 9;
    }
}

function useFilter(origImage) {
    if (selectedFilter != "none") {
        var adjustetImageData = origImage.data.slice(0);
        for (var i = 0; i < origImage.width * origImage.height; i ++) {
            var kernelIndecesForcurrentPosition = getKernelIndeces(origImage.width,origImage.height,i);
            var colorsInKernel = origImage.data.getColorsAtIndeces(kernelIndecesForcurrentPosition);
            var filteredValue = applyFilterOnKernel.call(this, colorsInKernel);
            adjustetImageData.setColor(i * 4,filteredValue);
        }
        return new ImageData(adjustetImageData,origImage.width,origImage.height);
    }
    return origImage;
}

function createHisto(amountOfBins){
    var histo = new Array(amountOfBins).fill(0);
    var colorsPerBin = 256 / amountOfBins;
    for (var i = 0; i < adjustedImage.data.length; i += 4) {
        var currentColor = (adjustedImage.data[i] / colorsPerBin) | 0;
        if (histo[currentColor] == null)
            histo[currentColor] = 1;
        else
            histo[currentColor] ++;
    }
    return histo;
}

function drawHisto() {
    let paper = Raphael(10,600,550,300);
    var clearBackGround = paper.rect(0,0,550,300);
    clearBackGround.attr("fill","#fff");
    clearBackGround.attr("stroke","#000");
    var xAchse = paper.path("M0 290L500 290");
    xAchse.attr("stroke","#000");

    var histo = createHisto(amountOfBins);
    var balkenBreite = (500 / amountOfBins);
    var hoechsterBalke = Math.max.apply(null,histo);
    for(let i = 0; i < histo.length; i++){
        let currentHeight = 290 - ((histo[i] * 290 / hoechsterBalke) | 0);
        var currentBalken = paper.path("M" + (balkenBreite * i) + " " + currentHeight + "L" + (balkenBreite * (i + 1)) +" "+ currentHeight);
        currentBalken.attr("stroke","#000");
        var linkeSeite = paper.path("M" + (balkenBreite * i) + " " + 290 + "L" + (balkenBreite * (i)) +" "+ currentHeight);
        linkeSeite.attr("stroke","#000");
        var rechteSeite = paper.path("M" + (balkenBreite * (i+1)) + " " + 290 + "L" + (balkenBreite * (i+1)) +" "+ currentHeight);
        rechteSeite.attr("stroke","#000");
    }
}


