const canvas = document.getElementById("canvas");
const originalImageCanvas = document.createElement("canvas");
const modeButton = document.getElementById("drawing-mode");
const ctx = canvas.getContext('2d');
const originalCtx = originalImageCanvas.getContext('2d');
const colorBox = document.getElementById("color-box");
let mode = "remove";
colorBox.style.width = "20px";
colorBox.style.height = "20px";
colorBox.style.backgroundColor = "black";
const selectColorData = [19, 163, 188];
const removeColorData = [255,255,255, 0];
let originalImage;
let image;
let imageSize = {
  width: 500,
  height: 500,
}
const brushSize = 20;
let circle = new Path2D();
circle.stroke = `rgb(${selectColorData.join(",")})`;
const imageSrc = "https://images.unsplash.com/photo-1648199840917-9e4749a5047e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80";


const canvasOffset = {
  x: canvas.getBoundingClientRect().left,
  y: canvas.getBoundingClientRect().top,
}

const isInColorRange = (targetColor, compareTo, i) => {
  return (
    targetColor[i] >= compareTo[0] - 10
    && targetColor[i] <= compareTo[0] + 10
    && targetColor[i+1] >= compareTo[1] - 10
    && targetColor[i+1] <= compareTo[1] + 10
    && targetColor[i+2] >= compareTo[2] - 10
    && targetColor[i+2] <= compareTo[2] + 10
  )
}

const isInSpaceRange = (i, x, y, width, height) => {
  return (
    i >= (y - width) - (image.width * height)
    && i <= (y + width) + (image.width * height)
    && i % (image.width * 4) >= x - width
    && i % (image.width * 4) <= x + width
  )
}

const selectColor = (colorData, x, y, width, height) => {
    let canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height),
        pix = canvasData.data; 
    for (let i = 0, n = pix.length; i <n; i += 4) {
        if(isInColorRange(pix, colorData, i)){ 
          pix[i] = selectColorData[0];
          pix[i+1] = selectColorData[1];
          pix[i+2] = selectColorData[2];
        }
    }
    ctx.putImageData(canvasData, 0, 0);
}

const selectArea  = (x, y, width, height) => {
  ctx.clearRect(0,0, image.width, image.height);
  ctx.drawImage(image, 0,0, image.width, image.height);
  circle = new Path2D();
  circle.arc(x, y, brushSize/2, 0, 2 * Math.PI);
  ctx.stroke(circle);
}

const removeColor = (colorData, x, y, width, height) => {
    let canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height),
        pix = canvasData.data;  
    for (let i = 0, n = pix.length; i <n; i += 4) {
        if(isInColorRange(pix, colorData, i)){ 
             pix[i] = removeColorData[0];
             pix[i+1] = removeColorData[1];
             pix[i+2] = removeColorData[2];
             pix[i+3] = removeColorData[3];
        }
    }
  ctx.putImageData(canvasData, 0, 0);
}

const healColor = (position) => {
  ctx.clearRect(0,0, image.width, image.height);
  ctx.drawImage(originalImage, 0,0, originalImage.width, originalImage.height);
  ctx.globalCompositeOperation = "destination-in";
  ctx.moveTo(position.x, position.y);
  circle.moveTo(position.x, position.y);
  circle.arc(position.x, position.y, brushSize/2, 0, 2 * Math.PI);
  ctx.fill(circle);
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(image, 0,0, image.width, image.height);
}

const removeArea = (position) => {
  ctx.clearRect(0,0, image.width, image.height);
  ctx.drawImage(image, 0,0, image.width, image.height);
  ctx.globalCompositeOperation = "destination-out";
  ctx.moveTo(position.x, position.y);
  circle.moveTo(position.x, position.y);
  circle.arc(position.x, position.y, brushSize/2, 0, 2 * Math.PI);
  ctx.fill(circle);
  ctx.globalCompositeOperation = "source-over";
}

const setCanvas = () => {
  const _image = new Image();
  _image.onload = () => {
    image = _image.cloneNode();
    image.onload = null;
    originalImage = _image.cloneNode();
    imageSize = {
      width: Math.min(_image.width, imageSize.width),
      height: Math.min(_image.width, imageSize.width) * (_image.height /_image.width)
    }
    canvas.width = imageSize.width;
    canvas.height = imageSize.height;
    originalImageCanvas.width = imageSize.width;
    originalImageCanvas.height = imageSize.height;
    image.width = imageSize.width;
    image.height = imageSize.height;
    _image.width = imageSize.width;
    _image.height = imageSize.height;
    originalImage = _image.cloneNode();
    ctx.drawImage(image, 0,0, image.width, image.height);
    originalCtx.drawImage(_image, 0,0, _image.width, _image.height);
    console.log(originalImageCanvas)
  }
  _image.crossOrigin = "anonymous";
  _image.src = imageSrc;
}

const detectColor = (position) => {
  const colorData = ctx.getImageData(
    position.x, 
    position.y,
    1,
    1
  ).data;
  return colorData;
}

const changeColorBoxColor = (colorData) => {
  const rgba = `rgba(${colorData.join(",")})`;
  colorBox.style.backgroundColor = rgba;
}

const getLimitBox = (position) => {
  const x = position.x * 4;
    const y = (image.width * (position.y)) * 4 + 4 *  position.x;
  return {
    x,
    y,
    width: brushSize,
    height: brushSize,
  }
}

const onMouseMoveSelectColor = (e) => {
    ctx.drawImage(image, 0,0, image.width, image.height);
    const position = {
      x: e.clientX - canvasOffset.x,
      y: e.clientY - canvasOffset.y,
    }
    const color = detectColor(position);
    changeColorBoxColor(color);
  const limitBox = getLimitBox(position);
    if (mode === "remove by color") {
      selectColor(
        color, 
        limitBox.x, 
        limitBox.y, 
        limitBox.width, 
        limitBox.height
      );
    } else {
      selectArea(
        position.x, 
        position.y, 
        limitBox.width, 
        limitBox.height
      );
    }
  }

const onMouseDownAndMoveRemoveColor = (e) => {
    const callback  = (e) => {
    const position = {
      x: e.clientX - canvasOffset.x,
      y: e.clientY - canvasOffset.y,
    }
    const color = detectColor(position);
    const limitBox = getLimitBox(position);
  if (mode === "remove by color") {
    removeColor(
      color, 
      limitBox.x, 
      limitBox.y, 
      limitBox.width, 
      limitBox.height
    )
  } else if (mode === "heal area") {
    healColor(
    position,
  );
  } else {
    removeArea(position);
  }
  }
    canvas.onmousemove = callback;
    callback(e);
}

const registerListener = () => {
  canvas.onmousemove = onMouseMoveSelectColor;
  canvas.onmousedown = onMouseDownAndMoveRemoveColor;
  canvas.onmouseup = (e) => {
    canvas.onmousemove = null;
    canvas.onmousemove = onMouseMoveSelectColor;
    image.src = canvas.toDataURL();
  };
  canvas.onmouseleave = (e) => {
    canvas.onmousemove = null;
    canvas.onmousemove = onMouseMoveSelectColor;
    ctx.drawImage(image, 0,0, image.width, image.height);
  }
  modeButton.onclick = toggleMode;
}

const toggleMode = (e) => {
  if (e.target.innerText === "remove by color") {
    mode = "heal area";
  } else if (e.target.innerText === "heal area") {
    mode = "remove area";
  } else {
    mode = "remove by color";
  }
  e.target.innerText = mode;
}
// ===================================================================================

let model;
const segmentImageButton = document.getElementById("remove-background");
segmentImageButton.style.display = "none";
const maskCanvas = document.createElement("canvas");
const maskCtx = maskCanvas.getContext('2d');

segmentImageButton.onclick = predict;

async function loadModel(modelName) {
    model = await deeplab.load({ "base": modelName, "quantizationBytes": 2 });
    segmentImageButton.style.display = "inline-block";
}
async function predict() {
    let prediction = await model.segment(image);
    renderPrediction(prediction);
}

function removeBackground(color, width, height){
  image.width = width;
  image.height = height;
  originalImage.width = width;
  originalImage.height = height;
  canvas.width =width;
  canvas.height =height;
  originalImageCanvas.width =width;
  originalImageCanvas.height =height;
  ctx.drawImage(image, 0,0,width,height);
    var canvasData = ctx.getImageData(0, 0, width, height),
        pix = canvasData.data;
  var maskCanvasData = maskCtx.getImageData(0, 0, width, height),
        maskPix = maskCanvasData.data;
  
    for (var i = 0, n = maskPix.length; i <n; i += 4) {
        if(maskPix[i] === color[0] && maskPix[i+1] === color[1] && maskPix[i+2] === color[2]){
             maskPix[i+3] = 0;   
             pix[i+3] = 0;
        }
    }

    ctx.putImageData(canvasData, 0, 0);
    maskCtx.putImageData(maskCanvasData, 0, 0);
    const base64 = canvas.toDataURL();
    image.src = base64
    originalImage.src = originalImage.src;
}

function renderPrediction(prediction) {
    const { legend, height, width, segmentationMap } = prediction;

    const segmentationMapData = new ImageData(segmentationMap, width, height);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    maskCanvas.width = width;
    maskCanvas.height = height;
    maskCtx.putImageData(segmentationMapData, 0, 0);
    removeBackground([0,0,0], width, height);
}

//=====================================================================================
const main = () => {
  setCanvas();
  registerListener();
  loadModel("pascal");
}

main();