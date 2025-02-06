var NUM_CLASSES = 0;
const webcam = new Webcam(document.getElementById('webcam'));

const controllerDataset = new ControllerDataset(NUM_CLASSES);

let mobilenet;
let model;

async function loadMobilenet() {
  const mobilenet = await tf.loadLayersModel(
      'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');

  const layer = mobilenet.getLayer('conv_pw_13_relu');
  return tf.model({inputs: mobilenet.inputs, outputs: layer.output});
}

ui.setExampleHandler(label => {
  tf.tidy(() => {
    const img = webcam.capture();
    controllerDataset.addExample(mobilenet.predict(img), label);

    NUM_CLASSES = totals.filter(total => total > 0).length;

    ui.drawThumb(img, label);
  });
  ui.trainStatus('TRAIN');
});

async function train() {
  if (controllerDataset.xs == null) {
    throw new Error('Add some examples before training!');
  }

  model = tf.sequential({
    layers: [
      // Layer 0
      tf.layers.flatten({inputShape: [7, 7, 256]}),
      // Layer 1
      tf.layers.dense({
        units: 100,
        activation: 'relu',
        kernelInitializer: tf.initializers.varianceScaling(
            {scale: 1.0, mode: 'fanIn', distribution: 'normal'}),
        useBias: true
      }),
      // Layer 2
      tf.layers.dense({
        units: NUM_CLASSES,
        kernelInitializer: tf.initializers.varianceScaling(
            {scale: 1.0, mode: 'fanIn', distribution: 'normal'}),
        useBias: false,
        activation: 'softmax'
      })
    ]
  });

  const optimizer = tf.train.adam(0.0001);

  model.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'});

  const batchSize =
      Math.floor(controllerDataset.xs.shape[0] * 0.4);
  if (!(batchSize > 0)) {
    throw new Error(
        `Batch size is 0 or NaN. Please choose a non-zero fraction.`);
  }
  let loss = 0;
  // Train the model
  model.fit(controllerDataset.xs, controllerDataset.ys, {
    batchSize,
    epochs: 20,
    callbacks: {
      onBatchEnd: async (batch, logs) => {
        document.getElementById('train').className =
            'train-model-button train-status';
        loss = logs.loss.toFixed(5);
        ui.trainStatus('LOSS: ' + loss);
      },
      onTrainEnd: () => {
        if (loss > 1) {
          document.getElementById('user-help-text').innerText =
              'Model is not trained well. Add more samples and train again';
        } else {
          ui.enableModelTest();
        }
      }
    }
  });
}

let isPredicting = false;

function handleGesture(gesture) {
  console.log(`Detected gesture: ${gesture}`);
  chrome.runtime.sendMessage({ action: "performGesture", gesture });
}

async function predict() {
  ui.isPredicting();
  console.log('Starting prediction...');
  while (isPredicting) {
    const predictedClass = tf.tidy(() => {
      const img = webcam.capture();
      console.log('Captured image from webcam');

      const activation = mobilenet.predict(img);
      console.log('Generated activation from mobilenet');

      const predictions = model.predict(activation);
      console.log('Generated predictions from model');

      return predictions.as1D().argMax();
    });

    const classId = (await predictedClass.data())[0];
    predictedClass.dispose();

    const gesture = CONTROLS[classId];
    console.log(`Predicted class ID: ${classId}, Gesture: ${gesture}`);
    handleGesture(gesture);
    ui.predictClass(classId);
    await tf.nextFrame();
  }
  ui.donePredicting();
}

document.getElementById('train').addEventListener('click', async () => {
  ui.trainStatus('ENCODING...');
  controllerDataset.ys = null;
  controllerDataset.addLabels(NUM_CLASSES);
  ui.trainStatus('TRAINING...');
  await tf.nextFrame();
  await tf.nextFrame();
  isPredicting = false;
  await train();
  ui.showPredictionUI();
});

document.getElementById('predict').addEventListener('click', () => {
  isPredicting = true;
  predict();
});

document.getElementById('stop-predict').addEventListener('click', () => {
  isPredicting = false;
  // webcam.stop();
  // window.close();
});

async function init() {
  try {
    await webcam.setup();
    console.log('Webcam is on');
  } catch (e) {
    console.log(e);
    document.getElementById('no-webcam').style.display = 'block';
    document.getElementById('webcam-inner-wrapper').className =
        'webcam-inner-wrapper center grey-bg';
    document.getElementById('bottom-section').style.pointerEvents = 'none';
  }

  mobilenet = await loadMobilenet();
  tf.tidy(() => mobilenet.predict(webcam.capture()));

  ui.init();
}

init();
