var ui = ui || {}

const CONTROLS = ['up', 'down', 'left', 'right', 'pause'];

var controlsCaptured = [], labelsCaptured = [];

ui.init =function() 
{
  var controlButtons = document.getElementsByClassName('control-button');
  for (var i = 0; i < controlButtons.length; i++) {
    controlButtons[i].addEventListener('mouseover', function(event) {
      if (event.target.classList.contains('control-button')) {
        document.getElementById(event.target.id + '-icon').className =
            'control-icon center move-up';
        document.getElementById(event.target.id + '-add-icon').className =
            'add-icon';
      }
    });
    controlButtons[i].addEventListener('mouseout', function(event) {
      if (event.target.classList.contains('control-button')) {
        document.getElementById(event.target.id + '-icon').className =
            'control-icon center';
        document.getElementById(event.target.id + '-add-icon').className =
            'add-icon invisible';
      }
    });
  }
}

const trainStatusElement = document.getElementById('train-status');

function removeActiveClass() {
  let activeElement = document.getElementsByClassName('active');
  while (activeElement.length > 0) {
    activeElement[0].className = 'control-inner-wrapper';
  }
}

ui.predictClass =function(classId) {
  removeActiveClass();
  classId = Math.floor(classId);
  document.getElementById(controlsCaptured[classId] + '-button').className =
      'control-inner-wrapper active';
  document.body.setAttribute('data-active', controlsCaptured[classId]);
}

ui.isPredicting =function() {
  document.getElementById('predict').className = 'test-button hide';
  document.getElementById('webcam-outer-wrapper').style.border ='4px solid #00db8b';
  document.getElementById('stop-predict').className = 'stop-button';
  document.getElementById('bottom-section').style.pointerEvents = 'none';
};

ui.donePredicting =function() {
  document.getElementById('predict').className = 'test-button';
  document.getElementById('webcam-outer-wrapper').style.border ='2px solid #c8d0d8';
  document.getElementById('stop-predict').className = 'stop-button hide';
  document.getElementById('bottom-section').style.pointerEvents = 'all';
  removeActiveClass();
}

ui.trainStatus =function(status) {
  trainStatusElement.innerText = status;
}

ui.enableModelTest =function() {
  document.getElementById('predict').className = 'test-button';
}

ui.showPredictionUI = function() {
  document.getElementById('train').style.display = 'none';
  document.getElementById('predict').style.display = 'block';
  document.getElementById('stop-predict').style.display = 'block';
  // document.getElementById('bottom-section').style.display = 'none';
};

var addExampleHandler;

ui.setExampleHandler = function(handler) {
  addExampleHandler = handler;
};
let mouseDown = false;
const totals = [0, 0, 0, 0,0];

const upButton = document.getElementById('up');
const downButton = document.getElementById('down');
const leftButton = document.getElementById('left');
const rightButton = document.getElementById('right');
const pauseButton = document.getElementById('pause');

const thumbDisplayed = {};
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

ui.handler =async function(label) {
  mouseDown = true;
  const id = CONTROLS[label];
  const button = document.getElementById(id);
  const total = document.getElementById(id + '-total');

  document.body.removeAttribute('data-active');


  while (mouseDown) {
    totals[label] = totals[label] + 1;
    total.innerText = totals[label];
    for (var i = 0; i < totals.length; i++) {
      if (totals[i] > 0) {
        var isPresent = false;
        for (var j = 0; j < controlsCaptured.length; j++) {
          if (CONTROLS[i] === controlsCaptured[j]) {
            isPresent = true;
            break;
          }
        }
        if (!isPresent) {
          controlsCaptured.push(CONTROLS[i]);
          labelsCaptured.push(i);
          break;
        }
      }
    }
    addExampleHandler(label);
    await Promise.all([tf.nextFrame(), timeout(300)]);
  }
  document.body.setAttribute('data-active', CONTROLS[label]);
  if (controlsCaptured.length >= 2) {
    document.getElementById('train').className = 'train-button';
    ui.trainStatus('TRAIN');
    document.getElementById('predict').className = 'test-button disabled';
  }
}

upButton.addEventListener('mousedown', () => ui.handler(0));
upButton.addEventListener('mouseup', () => mouseDown = false);

downButton.addEventListener('mousedown', () => ui.handler(1));
downButton.addEventListener('mouseup', () => mouseDown = false);

leftButton.addEventListener('mousedown', () => ui.handler(2));
leftButton.addEventListener('mouseup', () => mouseDown = false);

rightButton.addEventListener('mousedown', () => ui.handler(3));
rightButton.addEventListener('mouseup', () => mouseDown = false);

pauseButton.addEventListener('mousedown', () => ui.handler(4));
pauseButton.addEventListener('mouseup', () => mouseDown = false);

ui.drawThumb = function(img, label) {
  if (thumbDisplayed[label] == null) {
    const thumbCanvas = document.getElementById(CONTROLS[label] + '-thumb');
    thumbCanvas.style.display = 'block';
    document.getElementById(CONTROLS[label] + '-icon').style.top = '-50%';
    ui.draw(img, thumbCanvas);
  }
}

ui.draw = function(image, canvas) {
  const [width, height] = [224, 224];
  const ctx = canvas.getContext('2d');
  const imageData = new ImageData(width, height);
  const data = image.dataSync();
  for (let i = 0; i < height * width; ++i) {
    const j = i * 4;
    imageData.data[j + 0] = (data[i * 3 + 0] + 1) * 127;
    imageData.data[j + 1] = (data[i * 3 + 1] + 1) * 127;
    imageData.data[j + 2] = (data[i * 3 + 2] + 1) * 127;
    imageData.data[j + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}
